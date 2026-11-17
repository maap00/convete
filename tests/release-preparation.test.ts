import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {inspectReleaseArtifact} from '../src/features/invitations/release-artifact.ts';
import {resolveMetadataOrigin,invitationMetadata,metadataForEnvironment} from '../src/features/invitations/metadata.ts';
import {effectiveRsvp} from '../src/features/invitations/demo.ts';
import {builtInInvitations} from '../src/features/invitations/builtins.ts';
import {getRSVPAvailability,prepareWhatsAppRSVP} from '../src/features/rsvp/whatsapp.ts';
import {generateInvitation} from '../src/features/invitation-generator/generate.ts';
import {discoverInvitations} from '../src/features/invitations/discovery.ts';
const project=process.cwd();
async function temp(t:test.TestContext){const root=await fs.mkdtemp(join(tmpdir(),'convete-release-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.mkdir(join(root,'public/invitations'),{recursive:true});return root;}
test('Preview resolves its own explicit origin or Vercel deployment hostname, never the production fallback',()=>{
 const env={VERCEL_ENV:'preview',CONVETE_PUBLIC_ORIGIN:'https://convete.vercel.app',VERCEL_URL:'convete-preview-example.vercel.app'};
 assert.equal(resolveMetadataOrigin(env),'https://convete-preview-example.vercel.app');assert.equal(resolveMetadataOrigin({...env,CONVETE_PREVIEW_ORIGIN:'https://preview.example.com'}),'https://preview.example.com');
 assert.throws(()=>resolveMetadataOrigin({VERCEL_ENV:'preview',CONVETE_PUBLIC_ORIGIN:env.CONVETE_PUBLIC_ORIGIN}),/Preview/);
 for(const hostname of ['localhost','127.0.0.1','https://wrong.vercel.app','user:pass@example.com','example.com/path'])assert.throws(()=>resolveMetadataOrigin({...env,VERCEL_URL:hostname}));
 const client=structuredClone(builtInInvitations[0]);client.seo.noIndex=false;assert.deepEqual(metadataForEnvironment(client,env).robots,{index:false,follow:false});assert.deepEqual(metadataForEnvironment(client,{VERCEL_ENV:'production',CONVETE_PUBLIC_ORIGIN:env.CONVETE_PUBLIC_ORIGIN}).robots,{index:true,follow:true});
 assert.equal(resolveMetadataOrigin({}),undefined);assert.throws(()=>resolveMetadataOrigin({VERCEL_ENV:'production'}));
});
test('metadataBase and each public social/canonical URL use exactly the resolved environment origin',()=>{
 for(const env of [{VERCEL_ENV:'production',CONVETE_PUBLIC_ORIGIN:'https://convete.vercel.app'},{VERCEL_ENV:'preview',VERCEL_URL:'convete-preview-example.vercel.app'}])for(const i of builtInInvitations){const origin=resolveMetadataOrigin(env)!,m=invitationMetadata(i,origin);assert.equal(new URL(String(m.metadataBase)).origin,origin);assert.equal(m.alternates?.canonical,`${origin}/invitacion/${i.slug}`);assert.ok(JSON.stringify(m.openGraph).includes(`${origin}/invitations/${i.slug}/social.jpg`));assert.ok(!JSON.stringify(m).includes('localhost'));}
});
test('explicit per-invitation demo mode cannot prepare a real action even if RSVP is accidentally enabled',()=>{
 const demo=structuredClone(builtInInvitations[0]);demo.rsvp={enabled:true,phone:'12025550101',message:'Prueba',maxCompanions:2};
 const safe=effectiveRsvp(demo);assert.equal(safe.phone,undefined);assert.equal(getRSVPAvailability(safe,new Date()),'disabled');assert.equal(prepareWhatsAppRSVP({name:'Persona ficticia',attendance:'yes',companions:0},safe,{eventLabel:'Prueba'},new Date()).status,'unavailable');assert.equal(demo.rsvp.enabled,true);
 const commercial={...demo,mode:'commercial' as const};const live=effectiveRsvp(commercial);assert.equal(getRSVPAvailability(live,new Date()),'ready');assert.equal(prepareWhatsAppRSVP({name:'Persona ficticia',attendance:'yes',companions:0},live,{eventLabel:'Prueba'},new Date()).status,'ready');
 assert.equal(getRSVPAvailability({...live,demoMode:true},new Date()),'disabled');
});
test('public tree rejects internal documents and symlinks but keeps graphics, font licenses and a legitimate public manifest',async t=>{
 const root=await temp(t);await fs.mkdir(join(root,'public/fonts'));await fs.writeFile(join(root,'public/fonts/Inter-OFL.txt'),'Fixture license');await fs.writeFile(join(root,'public/manifest.json'),JSON.stringify({name:'Convete',icons:[]}));assert.deepEqual(inspectReleaseArtifact(root).errors,[]);
 await fs.writeFile(join(root,'public/invitations/request.json'),'{}');assert.ok(inspectReleaseArtifact(root).errors.some(e=>e.includes('request.json')));await fs.rm(join(root,'public/invitations/request.json'));
 await fs.writeFile(join(root,'public/manifest.json'),JSON.stringify({name:'Convete',commercial:{}}));assert.ok(inspectReleaseArtifact(root).errors.some(e=>e.includes('manifiesto')));
 await fs.symlink(join(root,'public/fonts/Inter-OFL.txt'),join(root,'public/leak.txt'));assert.ok(inspectReleaseArtifact(root).errors.some(e=>e.includes('simbólico')));
});
test('production static scanning permits Next JSON while rejecting internal documents and unexpected demo prerenders',async t=>{
 const root=await temp(t);await fs.mkdir(join(root,'.next/static/chunks'),{recursive:true});await fs.writeFile(join(root,'.next/static/chunks/build-manifest.json'),'{}');await fs.writeFile(join(root,'.next/prerender-manifest.json'),JSON.stringify({routes:{'/invitacion/laura-martin':{}}}));assert.deepEqual(inspectReleaseArtifact(root,{artifacts:true,publicDemo:true}).errors,[]);
 await fs.writeFile(join(root,'.next/static/chunks/preparation-report.json'),'{}');await fs.writeFile(join(root,'.next/prerender-manifest.json'),JSON.stringify({routes:{'/invitacion/fixture-no-publica':{}}}));await fs.mkdir(join(root,'public/invitations/fixture-interna'));const r=inspectReleaseArtifact(root,{artifacts:true,publicDemo:true});assert.ok(r.errors.some(e=>e.includes('ajeno')));assert.ok(r.errors.some(e=>e.includes('documento interno')));assert.ok(r.errors.some(e=>e.includes('no prevista')));
});
test('generator stores only derived photos under public and rolls back photos if the private commit rename fails',async t=>{
 const root=await temp(t);await fs.mkdir(join(root,'public/themes/botanical'),{recursive:true});for(const file of ['sprig.svg','floral-corner.webp'])await fs.copyFile(join(project,'public/themes/botanical',file),join(root,'public/themes/botanical',file));
 const options={root,input:join(project,'docs/examples/solicitud-invitacion-recorrido-4.1.1.json'),assets:join(project,'public/invitations/laura-martin'),slug:'fixture-privada',fixture:true};
 await generateInvitation({...options,dryRun:true});await assert.rejects(fs.stat(join(root,'data')),/ENOENT/);
 let renames=0;await assert.rejects(generateInvitation(options,{writeFile:fs.writeFile,rename:async(...args:Parameters<typeof fs.rename>)=>{if(++renames===2)throw new Error('fixture: private rename failed');return fs.rename(...args);}}),/private rename failed/);
 assert.deepEqual(await fs.readdir(join(root,'public/invitations')),[]);assert.deepEqual(await fs.readdir(join(root,'data/invitations')),[]);
 const report=await generateInvitation(options);assert.ok(report.files[0].startsWith('data/invitations/'));assert.deepEqual(await fs.readdir(join(root,'public/invitations',options.slug)),['photos']);assert.equal(discoverInvitations(join(root,'public'))[0].mode,'demo');assert.deepEqual(inspectReleaseArtifact(root).errors,[]);
});
