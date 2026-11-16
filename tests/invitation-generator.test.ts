import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
import {parseRequest,parseRequestJSON} from '../src/features/invitation-generator/input.ts';
import {createSlug,validateSlug} from '../src/features/invitation-generator/slug.ts';
import {requestToInvitation} from '../src/features/invitation-generator/transform.ts';
import {generateInvitation,planGeneration} from '../src/features/invitation-generator/generate.ts';
import {discoverInvitations} from '../src/features/invitations/discovery.ts';
import {validateInvitationRegistry} from '../src/features/invitations/validation.ts';
import {validateInvitationAssets} from '../src/features/invitations/validate-assets.ts';
import {invitationMetadata} from '../src/features/invitations/metadata.ts';
import {getInvitation} from '../src/features/invitations/repository.ts';
import type {WeddingInvitationRequest} from '../src/features/invitation-requests/types';
const project=process.cwd(),example=await fs.readFile('docs/examples/solicitud-invitacion-recorrido-4.1.1.json','utf8');
const request=()=>JSON.parse(example) as WeddingInvitationRequest;
const photo=(r:WeddingInvitationRequest)=>Object.fromEntries(r.resources.map(v=>[v.id,{src:'/invitations/fixture-pareja/photos/main-01.webp',width:1200,height:630,alt:'Recurso de prueba'}]));
async function setup(t:test.TestContext){
 const root=await fs.mkdtemp(join(tmpdir(),'convete-generator-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(join(root,'public/invitations'),{recursive:true});await fs.mkdir(join(root,'public/themes/botanical'),{recursive:true});await fs.mkdir(join(root,'originals'));
 for(const file of ['sprig.svg','floral-corner.webp'])await fs.copyFile(join(project,'public/themes/botanical',file),join(root,'public/themes/botanical',file));
 await fs.copyFile(join(project,'public/invitations/laura-martin/social.jpg'),join(root,'originals/social.jpg'));
 const input=join(root,'request.json');await fs.writeFile(input,example);
 return {root,input,assets:join(root,'originals'),slug:'fixture-pareja'};
}
test('external request parser accepts the actual exported example and rejects malformed JSON',()=>{
 assert.equal(parseRequestJSON(example).schemaVersion,1);assert.throws(()=>parseRequestJSON('{bad'),/JSON inválido/);
});
test('unknown schema, absent objects and wrong primitive types fail before transformation',()=>{
 for(const mutation of [(r:Record<string,unknown>)=>r.schemaVersion=2,(r:Record<string,unknown>)=>r.couple=null,(r:Record<string,unknown>)=>r.resources={},(r:Record<string,unknown>)=>r.preferences=null]){const r=JSON.parse(example);mutation(r);assert.throws(()=>parseRequest(r));}
 const r=request();Object.assign(r.event,{date:42});assert.throws(()=>parseRequest(r),/event.date/);
});
test('incomplete names, event dates, email and phone reuse the commercial validation',()=>{
 const r=request();r.couple.first='';assert.throws(()=>parseRequest(r),/couple.first/);
 r.couple.first='Alma';r.commercial.contact.email='bad';assert.throws(()=>parseRequest(r),/contact.email/);
 r.commercial.contact.email='pareja@example.com';r.commercial.contact.whatsapp='123';assert.throws(()=>parseRequest(r),/contact.whatsapp/);
});
test('unknown themes, sections, inconsistent same-location data and RSVP cannot enter the engine',()=>{
 const r=request();Object.assign(r.preferences,{theme:'future'});assert.throws(()=>parseRequest(r),/theme/);
 r.preferences.theme='botanical';Object.assign(r.preferences.sections,{unknown:true});assert.throws(()=>parseRequest(r),/sections/);
 const v=request();v.venues.reception.location.name='Otro lugar';assert.throws(()=>parseRequest(v),/sameLocation/);
 const p=request();p.rsvp={enabled:true,phone:'123',maxCompanions:99,deadline:'2028-01-01T00:00:00.000Z'};assert.throws(()=>parseRequest(p),/rsvp/);
});
test('ISO millisecond timestamps from the form are converted without changing instants or zone',()=>{
 const r=request(),v=requestToInvitation(r,'fixture-pareja',photo(r));assert.equal(v.event.timeZone,r.event.timeZone);
 assert.equal(Date.parse(v.event.startsAt),Date.parse(r.venues.ceremony.startsAt));assert.equal(Date.parse(v.reception.startsAt),Date.parse(r.venues.reception.startsAt));
 assert.equal(v.couple.first,r.couple.first);assert.equal(v.messages.romantic,r.content.cover);assert.equal(v.personalization?.palette,r.preferences.palette);
 assert.equal(v.rsvp.enabled,true);assert.equal(v.rsvp.phone,r.rsvp.enabled?r.rsvp.phone:undefined);
});
test('disabled sections receive documented internal defaults and remain disabled',()=>{
 const r=request();r.preferences.sections.welcome=false;delete r.content.welcome;r.rsvp={enabled:false};r.preferences.sections.rsvp=false;
 const v=requestToInvitation(r,'fixture-pareja',photo(r));assert.equal(v.messages.welcome,r.content.cover);assert.equal(v.dressCode.description,'Sección desactivada.');assert.equal(v.gifts.message,'Sección desactivada.');assert.equal(v.rsvp.enabled,false);assert.equal(v.rsvp.phone,undefined);
 for(const id of ['welcome','dressCode','gifts','rsvp'])assert.equal(v.sections.find(s=>s.id===id)?.enabled,false);
});
test('custom messages, guest instructions, colors, maps and gifts survive the pure transformation',()=>{
 const r=request();r.content.story='Nuestra historia';r.content.specialInstructions='Lleguen con tiempo.';
 r.preferences.sections.dressCode=true;r.celebration.dressCode='Formal';r.celebration.colors='Oliva y blanco';r.preferences.sections.gifts=true;r.celebration.giftsMessage='Su presencia';r.celebration.giftsUrl='https://example.com/lista';
 for(const v of [r.venues.ceremony,r.venues.reception])v.location.googleMapsUrl='https://www.google.com/maps/search/?api=1&query=Caracas';
 const before=structuredClone(r),v=requestToInvitation(r,'fixture-pareja',photo(r));assert.deepEqual(r,before);assert.equal(v.messages.story,r.content.story);assert.equal(v.guestInstructions,r.content.specialInstructions);assert.equal(v.dressCode.suggestedColors,r.celebration.colors);assert.equal(v.gifts.url,r.celebration.giftsUrl);assert.equal(v.ceremony.googleMapsUrl,r.venues.ceremony.location.googleMapsUrl);
});
test('hidden supplied content, invalid URLs and missing active content are reported, not silently discarded',()=>{
 const r=request();r.celebration.dressCode='Formal';assert.throws(()=>parseRequest(r),/sections/);
 delete r.celebration.dressCode;r.preferences.sections.gifts=true;r.celebration.giftsMessage='Regalos';r.celebration.giftsUrl='javascript:bad';assert.throws(()=>parseRequest(r),/giftsUrl/);
 const v=request();v.content.welcome='';assert.throws(()=>parseRequest(v),/welcome/);
});
test('manifest types, duplicates, missing required IDs, precision and resource resolution are validated',()=>{
 const r=request();r.resources[0].filename='../secret.jpg';assert.throws(()=>parseRequest(r),/resources/);
 for(const mime of ['image/svg+xml','__proto__','constructor']){const m=request();m.resources[0].mimeType=mime;assert.throws(()=>parseRequest(m),/resources/);}
 const c=request();c.completeness.requiredResourceIds=[];assert.throws(()=>parseRequest(c),/requiredResourceIds/);
 const v=request();v.venues.ceremony.startsAt='2027-12-04T20:00:01.000Z';assert.throws(()=>parseRequest(v),/minutos/);
 assert.throws(()=>requestToInvitation(request(),'fixture-pareja',{}),/fotografía sin resolver/);
});
test('Unicode accents and separators normalize predictably; invalid, long and reserved slugs fail',()=>{
 assert.equal(createSlug('Laura &','Martín'),'laura-martin');assert.equal(createSlug('Ána María','Muñoz'),'ana-maria-munoz');assert.equal(createSlug('Ａｎａ','Carlos'),'ana-carlos');
 for(const slug of ['../escape','foo/bar','foo\\bar','api','admin','solicitar-invitacion','UPPER','a','a'.repeat(81),'a--b','%2e%2e'])assert.throws(()=>validateSlug(slug));
 assert.throws(()=>createSlug('李','龍'));
});
test('planning optimizes real fixture bytes, omits commercial contact and does not write',async t=>{
 const options=await setup(t);const before=await fs.readdir(join(options.root,'public/invitations'));
 const plan=await planGeneration({...options,dryRun:true});assert.equal(plan.report.status,'dry-run');assert.equal(plan.report.photos,1);assert.ok(plan.images[0].data.length>0);assert.match(plan.invitation.storyPhoto!.src,/main-01.webp$/);assert.equal(plan.invitation.seo.noIndex,true);
 assert.ok(!JSON.stringify(plan.invitation).includes('pareja@example.com'));assert.ok(!JSON.stringify(plan.invitation).includes('12025550100'));assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),before);
});
test('dry-run validates every resource but writes no output, locks or staging',async t=>{
 const options=await setup(t);const report=await generateInvitation({...options,dryRun:true});assert.equal(report.status,'dry-run');assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),[]);
});
test('missing input, invalid JSON and missing asset directory leave no partial output',async t=>{
 const options=await setup(t);await assert.rejects(generateInvitation({...options,input:join(options.root,'missing.json')}),/ENOENT/);
 await fs.writeFile(options.input,'{');await assert.rejects(generateInvitation(options),/JSON inválido/);await fs.writeFile(options.input,example);
 await assert.rejects(generateInvitation({...options,assets:undefined}),/faltan los originales/);assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),[]);
});
test('missing originals and altered sizes are errors',async t=>{
 const options=await setup(t);await fs.rename(join(options.assets,'social.jpg'),join(options.assets,'other.jpg'));await assert.rejects(generateInvitation(options),/faltan archivos originales/);
 await fs.writeFile(join(options.assets,'social.jpg'),'invalid');await assert.rejects(generateInvitation(options),/tamaño/);assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),[]);
});
test('fake MIME, corrupt files and symlinks cannot be published',async t=>{
 const options=await setup(t),r=request();await fs.writeFile(join(options.assets,'social.jpg'),Buffer.alloc(r.resources[0].size));await assert.rejects(generateInvitation(options));
 await fs.rm(join(options.assets,'social.jpg'));await fs.symlink(join(project,'public/invitations/laura-martin/social.jpg'),join(options.assets,'social.jpg'));await assert.rejects(generateInvitation(options),/enlace simbólico/);assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),[]);
});
test('real generation creates independent config, optimized photos and report, discovered without editing registry',async t=>{
 const options=await setup(t);const report=await generateInvitation(options);assert.equal(report.status,'created');
 const entries=discoverInvitations(join(options.root,'public'));assert.equal(entries.length,1);assert.equal(entries[0].slug,options.slug);validateInvitationRegistry(entries);validateInvitationAssets(entries[0],join(options.root,'public'));
 for(const file of report.files)assert.ok((await fs.stat(join(options.root,file))).isFile());
 assert.equal(JSON.parse(await fs.readFile(join(options.root,report.files[1]),'utf8')).status,'created');
});
test('repeat generation, explicit directory collisions and built-in demo slugs never overwrite',async t=>{
 const options=await setup(t);await generateInvitation(options);const path=join(options.root,'public/invitations',options.slug,'invitation.json'),before=await fs.readFile(path,'utf8');
 await assert.rejects(generateInvitation(options),/ya existe/);assert.equal(await fs.readFile(path,'utf8'),before);
 await assert.rejects(generateInvitation({...options,slug:'laura-martin'}),/ya existe/);
 await fs.mkdir(join(options.root,'public/invitations/reserved-pair'));await assert.rejects(generateInvitation({...options,slug:'reserved-pair'}),/ya existe/);
});
test('write failure after staging an image rolls back only this run',async t=>{
 const options=await setup(t);await fs.mkdir(join(options.root,'public/invitations/keep-existing'));await fs.writeFile(join(options.root,'public/invitations/keep-existing/note.txt'),'keep');let writes=0;
 await assert.rejects(generateInvitation(options,{rename:fs.rename,writeFile:async(...args:Parameters<typeof fs.writeFile>)=>{if(++writes===2)throw new Error('fixture: escritura fallida');return fs.writeFile(...args);}}),/escritura fallida/);
 assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),['keep-existing']);assert.equal(await fs.readFile(join(options.root,'public/invitations/keep-existing/note.txt'),'utf8'),'keep');
});
test('final rename failure and concurrent creation leave no partial directories',async t=>{
 const options=await setup(t);await assert.rejects(generateInvitation(options,{writeFile:fs.writeFile,rename:async()=>{throw new Error('fixture: rename fallido');}}),/rename fallido/);assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),[]);
 const results=await Promise.allSettled([generateInvitation(options),generateInvitation(options)]);assert.equal(results.filter(v=>v.status==='fulfilled').length,1);assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),[options.slug]);
});
test('discovery rejects mismatched slugs and symbolic configurations',async t=>{
 const options=await setup(t);await generateInvitation(options);const file=join(options.root,'public/invitations',options.slug,'invitation.json');const r=JSON.parse(await fs.readFile(file,'utf8'));r.slug='other-pair';await fs.writeFile(file,JSON.stringify(r));assert.throws(()=>discoverInvitations(join(options.root,'public')),/slug distinto/);
 await fs.rm(file);await fs.symlink(join(options.root,'request.json'),file);assert.throws(()=>discoverInvitations(join(options.root,'public')),/configuración insegura/);
});
test('generated metadata uses the actual couple, local main image and no invented canonical',()=>{
 const r=request(),v=requestToInvitation(r,'fixture-pareja',photo(r));const local=invitationMetadata(v);assert.equal(local.alternates,undefined);assert.match(local.title as string,/Alma Ficticia/);assert.equal(v.seo.image,v.storyPhoto?.src);
 const publicData=invitationMetadata(v,'https://example.com');assert.equal(publicData.alternates?.canonical,'https://example.com/invitacion/fixture-pareja');assert.equal(local.robots&&typeof local.robots==='object'&&local.robots.index,false);
});
test('CLI help, dry-run and invalid options return appropriate exit statuses',async t=>{
 const options=await setup(t),cli=resolve('scripts/create-invitation.ts');
 const run=(args:string[])=>spawnSync(process.execPath,['--experimental-strip-types',cli,...args],{cwd:options.root,encoding:'utf8'});
 assert.match(execFileSync(process.execPath,['--experimental-strip-types',cli,'--help'],{encoding:'utf8'}),/dry-run/);
 assert.equal(run([]).status,1);assert.equal(run(['--unknown']).status,1);
 const result=run(['--input',options.input,'--assets',options.assets,'--slug',options.slug,'--dry-run']);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/dry-run/);assert.deepEqual(await fs.readdir(join(options.root,'public/invitations')),[]);
});
test('the 4.2 adapter does not mutate the two existing demos',()=>{
 const a=getInvitation('laura-martin'),b=getInvitation('ana-carlos');requestToInvitation(request(),'fixture-pareja',photo(request()));assert.deepEqual(getInvitation('laura-martin'),a);assert.deepEqual(getInvitation('ana-carlos'),b);
});
