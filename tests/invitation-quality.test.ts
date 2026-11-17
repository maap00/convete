import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {auditExisting,canonical,readInvitation} from '../src/features/invitation-quality/audit.ts';
import {recordApproval,approvalSummary,type ApprovalInput} from '../src/features/invitation-quality/approval.ts';
import {clientChecklist,createHandoff,handoffMarkdown} from '../src/features/invitation-quality/documents.ts';
import {writeNewFile} from '../src/features/invitation-quality/storage.ts';
import {generateInvitation} from '../src/features/invitation-generator/generate.ts';
import {validateInvitationAssets} from '../src/features/invitations/validate-assets.ts';
import {getInvitation} from '../src/features/invitations/repository.ts';
import type {WeddingInvitation} from '../src/features/invitations/types';
const sharp:typeof import('sharp')['default']=createRequire(import.meta.url)('sharp');
const project=process.cwd(),slug='fixture-calidad',now=new Date('2026-11-16T03:00:00.000Z');
async function setup(t:test.TestContext,fixture=false){
 const root=await fs.mkdtemp(join(tmpdir(),'convete-quality-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(join(root,'public/invitations'),{recursive:true});await fs.mkdir(join(root,'public/themes/botanical'),{recursive:true});await fs.mkdir(join(root,'assets'));
 for(const file of ['sprig.svg','floral-corner.webp'])await fs.copyFile(join(project,'public/themes/botanical',file),join(root,'public/themes/botanical',file));
 await fs.copyFile(join(project,'public/invitations/laura-martin/social.jpg'),join(root,'assets/social.jpg'));
 const input=join(root,'request.json');await fs.copyFile(join(project,'docs/examples/solicitud-invitacion-recorrido-4.1.1.json'),input);
 const generation=await generateInvitation({root,input,assets:join(root,'assets'),slug,fixture});
 const config=join(root,'data/invitations',slug,'invitation.json');
 const options={root,now};
 const update=async(change:(v:WeddingInvitation)=>void)=>{const v=await readInvitation(slug,root);change(v);await fs.writeFile(config,JSON.stringify(v,null,2));};
 return {root,input,config,options,update,generation};
}
const flags=(fingerprint:string):ApprovalInput=>({responsible:'Responsable ficticio de prueba aislada',approvedAt:'2026-11-16T02:00:00Z',reviewedFingerprint:fingerprint,confirmClientApproval:true,confirmChecklist:true,authorizePublication:false,acknowledgeWarnings:true});
const error=(r:Awaited<ReturnType<typeof auditExisting>>,code:string)=>r.findings.some(f=>f.level==='ERROR'&&f.code===code);
async function tree(root:string):Promise<string>{
 const entries:Record<string,string>={};const walk=async(path:string)=>{for(const d of await fs.readdir(join(root,path),{withFileTypes:true})){const name=path?`${path}/${d.name}`:d.name;if(d.isDirectory())await walk(name);else if(d.isFile())entries[name]=(await fs.readFile(join(root,name))).toString('base64');}};await walk('');return canonical(entries);
}
test('a valid generated invitation audits read-only with measured time and no public origin requirement',async t=>{
 const s=await setup(t),before=await tree(s.root),r=await auditExisting(slug,s.options);
 assert.equal(r.technical,'passed');assert.equal(r.readyForReview,true);assert.match(r.fingerprint!,/^[a-f0-9]{64}$/);assert.ok(r.findings.some(f=>f.code==='LOCAL_ONLY'&&f.level==='WARNING'));assert.equal(r.timings.humanReviewMinutes,null);assert.ok(r.timings.auditMs>=0);assert.ok(r.timings.generationPreparationMs!==null);assert.equal(await tree(s.root),before);
});
test('missing invitation, malformed JSON and unknown theme return blocking reports instead of throwing',async t=>{
 const s=await setup(t);assert.ok(error(await auditExisting('not-existing',s.options),'CONFIG_READ'));
 await fs.writeFile(s.config,'{');assert.ok(error(await auditExisting(slug,s.options),'CONFIG_READ'));
 await fs.writeFile(s.config,JSON.stringify(getInvitation('laura-martin')));assert.ok(error(await auditExisting(slug,s.options),'CONFIG_READ'));
 const v=getInvitation('laura-martin')!;v.slug=slug;Object.assign(v,{theme:'missing'});await fs.writeFile(s.config,JSON.stringify(v));assert.ok(error(await auditExisting(slug,s.options),'CONFIG_INVALID'));
});
test('invalid required names and event fields cannot be declared technically ready',async t=>{
 const s=await setup(t);await s.update(v=>{v.couple.first='';});const r=await auditExisting(slug,s.options);assert.equal(r.readyForReview,false);assert.ok(error(r,'CONFIG_INVALID'));assert.equal((await createHandoff(r,s.root)).state,'blocked');
 await s.update(v=>{v.couple.first='Alma';Object.assign(v,{rsvp:null});});assert.ok(error(await auditExisting(slug,s.options),'CONFIG_INVALID'));
 await s.update(v=>{Object.assign(v,{rsvp:{enabled:false,message:'Desactivado'},commercial:{contact:{email:'private@example.com',apiKey:'private-test-secret'}}});});const privateData=await auditExisting(slug,s.options);assert.ok(error(privateData,'PRIVATE_DATA'));assert.ok(!JSON.stringify(privateData).includes('private@example.com'));assert.ok(!JSON.stringify(privateData).includes('private-test-secret'));
});
test('missing referenced main photo blocks, but omitted optional photos do not',async t=>{
 const s=await setup(t);await fs.rm(join(s.root,'public/invitations',slug,'photos/main-01.webp'));assert.ok(error(await auditExisting(slug,s.options),'RESOURCE_INVALID'));
 await s.update(v=>{delete v.storyPhoto;delete v.seo.image;});const r=await auditExisting(slug,s.options);assert.equal(r.technical,'passed');assert.ok(r.findings.some(f=>f.code==='RESOURCE_INVALID'&&f.level==='WARNING'));
});
test('inactive gallery, venues, welcome, gifts, dress code and RSVP are not audited as active resources or fields',async t=>{
 const s=await setup(t);await s.update(v=>{
  for(const section of v.sections)section.enabled=false;
  v.photos=[{src:`/invitations/${slug}/missing.jpg`,width:100,height:100,alt:'Oculta'}];v.storyPhoto={...v.photos[0]};v.ceremony.photo={...v.photos[0]};
  v.rsvp={enabled:false,phone:'bad',message:'',maxCompanions:-1};v.gifts={message:'',url:'javascript:bad'};v.dressCode={title:'',description:''};v.messages.welcome='';
 });const r=await auditExisting(slug,s.options);assert.equal(r.technical,'passed');assert.ok(!r.resources.some(v=>v.path.endsWith('missing.jpg')));assert.deepEqual(r.sections,[]);
});
test('active RSVP needs a valid receiver; disabled RSVP does not',async t=>{
 const s=await setup(t);await s.update(v=>{v.rsvp.enabled=true;delete v.rsvp.phone;});assert.ok(error(await auditExisting(slug,s.options),'RSVP_INVALID'));
 await s.update(v=>{v.rsvp.enabled=false;});assert.equal((await auditExisting(slug,s.options)).technical,'passed');
});
test('unsafe active links and invalid coordinates reuse shared configuration validation',async t=>{
 const s=await setup(t);await s.update(v=>{v.ceremony.googleMapsUrl='javascript:bad';});assert.ok(error(await auditExisting(slug,s.options),'CONFIG_INVALID'));
 await s.update(v=>{delete v.ceremony.googleMapsUrl;v.ceremony.coordinates={latitude:91,longitude:0};});assert.ok(error(await auditExisting(slug,s.options),'CONFIG_INVALID'));
});
test('gift link and text are optional when disabled and valid when enabled',async t=>{
 const s=await setup(t);await s.update(v=>{v.sections.find(x=>x.id==='gifts')!.enabled=true;v.gifts={message:'Su presencia',url:'https://example.com/lista',buttonText:'Ver lista'};});const r=await auditExisting(slug,s.options);assert.equal(r.technical,'passed');assert.ok(r.findings.some(f=>f.code==='GIFTS_LINK'));
});
test('historical weddings and expired RSVP produce information/warnings, not invalid dates',async t=>{
 const s=await setup(t),r=await auditExisting(slug,{root:s.root,now:new Date('2030-01-01T00:00:00Z')});assert.equal(r.technical,'passed');assert.ok(r.findings.some(f=>f.code==='HISTORICAL_EVENT'&&f.level==='INFO'));assert.ok(r.findings.some(f=>f.code==='RSVP_EXPIRED'&&f.level==='WARNING'));
});
test('no public origin is valid locally; invalid configured origins block; missing OG is a warning and blocks publication',async t=>{
 const s=await setup(t);assert.equal((await auditExisting(slug,s.options)).technical,'passed');assert.ok(error(await auditExisting(slug,{...s.options,origin:'http://localhost'}),'PUBLIC_ORIGIN_INVALID'));
 await s.update(v=>{v.seo.image=`/invitations/${slug}/missing-social.jpg`;});const r=await auditExisting(slug,s.options);assert.equal(r.technical,'passed');assert.ok(r.findings.some(f=>f.code==='RESOURCE_INVALID'&&f.level==='WARNING'));assert.ok((await createHandoff(r,s.root)).publicationBlockers.some(v=>v.includes('imagen')));
 const v=await readInvitation(slug,s.root);assert.doesNotThrow(()=>validateInvitationAssets(v,join(s.root,'public'),{previewOptional:true}));assert.throws(()=>validateInvitationAssets(v,join(s.root,'public')));assert.ok(error(await auditExisting(slug,{...s.options,origin:'https://example.com'}),'RESOURCE_INVALID'));
});
test('image byte formats and declared dimensions are checked without recompression',async t=>{
 const s=await setup(t);await s.update(v=>{v.storyPhoto!.width=1;});assert.ok(error(await auditExisting(slug,s.options),'IMAGE_DIMENSIONS'));
 const image=join(s.root,'public/invitations',slug,'photos/main-01.webp'),low=await sharp(await fs.readFile(image)).resize({width:200}).webp().toBuffer({resolveWithObject:true});await fs.writeFile(image,low.data);await s.update(v=>{v.storyPhoto!.width=low.info.width;v.storyPhoto!.height=low.info.height;});const small=await auditExisting(slug,s.options);assert.equal(small.technical,'passed');assert.ok(small.findings.some(f=>f.code==='IMAGE_LOW_RESOLUTION'));
 await fs.writeFile(image,'corrupt');assert.ok(error(await auditExisting(slug,s.options),'RESOURCE_INVALID'));
});
test('client checklist follows active sections and contains no implementation jargon or automatic consent',async t=>{
 const s=await setup(t),r=await auditExisting(slug,s.options),text=clientChecklist(await readInvitation(slug,s.root),r);
 assert.match(text,/\[ \]/);assert.match(text,/confirmaciones/);assert.match(text,/itinerario/);assert.doesNotMatch(text,/vestimenta|información de regalos|Next.js|React|JSON/);
 assert.match(text,/no registra automáticamente/);assert.match(text,/Autorizamos por separado/);
 await s.update(v=>{v.sections=v.sections.map(x=>({...x,enabled:false}));});const a=await auditExisting(slug,s.options),hidden=clientChecklist(await readInvitation(slug,s.root),a);assert.doesNotMatch(hidden,/receptor|ceremonia|recepción|itinerario/);
});
test('technical success alone is not approval and cannot claim publication',async t=>{
 const s=await setup(t),r=await auditExisting(slug,s.options),h=await createHandoff(r,s.root);assert.equal(h.approval.status,'absent');assert.equal(h.state,'ready-for-review');assert.equal(h.publishedAndVerified,false);assert.match(handoffMarkdown(h),/Ruta local, no pública/);
});
test('approval requires explicit received consent, checklist, responsible, time, current fingerprint and warning acknowledgement',async t=>{
 const s=await setup(t),r=await auditExisting(slug,s.options),good=flags(r.fingerprint!);
 for(const change of [{confirmClientApproval:false},{confirmChecklist:false},{responsible:''},{approvedAt:'2027-02-29T00:00:00Z'},{approvedAt:'2030-01-01T00:00:00Z'},{reviewedFingerprint:'0'.repeat(64)},{acknowledgeWarnings:false},{humanReviewMinutes:-1}])await assert.rejects(recordApproval(slug,{...good,...change},s.options));
 assert.equal((await approvalSummary(r,s.root)).status,'absent');
});
test('private explicit approval binds the exact version but does not authorize publication implicitly',async t=>{
 const s=await setup(t),r=await auditExisting(slug,s.options),result=await recordApproval(slug,{...flags(r.fingerprint!),humanReviewMinutes:12.5},s.options);
 assert.match(result.path,/^\.convete\/approvals\//);assert.equal(result.record.responsible,'Responsable ficticio de prueba aislada');
 const h=await createHandoff(await auditExisting(slug,s.options),s.root);assert.equal(h.approval.status,'approved');assert.equal(h.state,'client-approved');assert.equal(h.approval.humanReviewMinutes,12.5);assert.equal(h.publishedAndVerified,false);
});
test('configuration edits invalidate approval; property reordering and audit timestamps do not change fingerprint',async t=>{
 const s=await setup(t),r=await auditExisting(slug,s.options);await recordApproval(slug,flags(r.fingerprint!),s.options);
 const v=JSON.parse(await fs.readFile(s.config,'utf8'));await fs.writeFile(s.config,JSON.stringify(Object.fromEntries(Object.entries(v).reverse())));
 const same=await auditExisting(slug,{...s.options,now:new Date(now.getTime()+1000)});assert.equal(same.fingerprint,r.fingerprint);assert.equal((await approvalSummary(same,s.root)).status,'approved');
 await s.update(v=>{v.messages.closing='Mensaje actualizado';});const changed=await auditExisting(slug,s.options);assert.notEqual(changed.fingerprint,r.fingerprint);assert.equal((await approvalSummary(changed,s.root)).status,'stale');assert.equal((await createHandoff(changed,s.root)).state,'ready-for-review');
});
test('relevant image bytes, shared decorations and renderer/style changes invalidate the reviewed version',async t=>{
 const s=await setup(t),r=await auditExisting(slug,s.options);await recordApproval(slug,flags(r.fingerprint!),s.options);
 await fs.appendFile(join(s.root,'public/themes/botanical/sprig.svg'),'\n<!-- cambio fixture -->');const decor=await auditExisting(slug,s.options);assert.notEqual(decor.fingerprint,r.fingerprint);assert.equal((await approvalSummary(decor,s.root)).status,'stale');
 await fs.mkdir(join(s.root,'src/styles'),{recursive:true});await fs.writeFile(join(s.root,'src/styles/fixture.css'),'body{color:#111}');const styled=await auditExisting(slug,s.options);assert.notEqual(styled.fingerprint,decor.fingerprint);
 const photo=join(s.root,'public/invitations',slug,'photos/main-01.webp');await fs.appendFile(photo,'\n');assert.notEqual((await auditExisting(slug,s.options)).fingerprint,styled.fingerprint);
});
test('simulation is explicitly marked and never counts as real commercial approval',async t=>{
 const s=await setup(t,true),r=await auditExisting(slug,s.options);await assert.rejects(recordApproval(slug,flags(r.fingerprint!),s.options),/simulation/);
 const result=await recordApproval(slug,{...flags(r.fingerprint!),simulation:true,authorizePublication:true},s.options);assert.equal(result.record.status,'simulated');
 const h=await createHandoff(await auditExisting(slug,s.options),s.root);assert.equal(h.approval.status,'simulated');assert.equal(h.state,'ready-for-review');assert.equal(h.publishedAndVerified,false);
});
test('ready-for-publication requires valid origin, current real approval and explicit publication authority',async t=>{
 const s=await setup(t),options={...s.options,origin:'https://example.com'},r=await auditExisting(slug,options);await recordApproval(slug,{...flags(r.fingerprint!),authorizePublication:true},options);
 const h=await createHandoff(await auditExisting(slug,options),s.root);assert.equal(h.state,'ready-for-publication');assert.deepEqual(h.publicationBlockers,[]);assert.equal(h.publishedAndVerified,false);
 const expired=await createHandoff(await auditExisting(slug,{...options,now:new Date('2030-01-01T00:00:00Z')}),s.root);assert.equal(expired.approval.status,'approved');assert.equal(expired.approval.warningsAcknowledged,false);assert.equal(expired.state,'client-approved');
 const local=await createHandoff(await auditExisting(slug,s.options),s.root);assert.equal(local.approval.status,'stale');
});
test('corrupt approval records fail closed rather than inventing approval',async t=>{
 const s=await setup(t),r=await auditExisting(slug,s.options);await writeNewFile(s.root,`.convete/approvals/${slug}/broken.json`,'{}',true);assert.equal((await approvalSummary(r,s.root)).status,'invalid');assert.equal((await createHandoff(r,s.root)).state,'ready-for-review');
});
test('report outputs are explicit, refuse overwrites, public paths, traversal and symlinks',async t=>{
 const s=await setup(t);await writeNewFile(s.root,'reports/audit.json','first');await assert.rejects(writeNewFile(s.root,'reports/audit.json','second'),/EEXIST/);assert.equal(await fs.readFile(join(s.root,'reports/audit.json'),'utf8'),'first');
 for(const path of ['../escape.json','public/report.json','.git/report.json','reports/bad.html'])await assert.rejects(writeNewFile(s.root,path,'bad'));
 await fs.symlink(tmpdir(),join(s.root,'reports/link'));await assert.rejects(writeNewFile(s.root,'reports/link/escape.json','bad'),/simbólico/);
});
test('auditing refuses unsafe slugs and symlinked invitation resources without changing files',async t=>{
 const s=await setup(t);for(const value of ['../escape','foo/bar','admin'])await assert.rejects(auditExisting(value,s.options));
 const image=join(s.root,'public/invitations',slug,'photos/main-01.webp');await fs.rm(image);await fs.symlink(join(project,'tests/fixtures/legacy-generated/fixture-generador-local/photos/main-01.webp'),image);const r=await auditExisting(slug,s.options);assert.ok(error(r,'RESOURCE_INVALID'));
});
test('CLI supports readonly JSON/checklist/handoff, exit codes and explicit report output',async t=>{
 const s=await setup(t),cli=resolve('scripts/invitation-quality.ts'),run=(mode:string,args:string[])=>spawnSync(process.execPath,['--experimental-strip-types',cli,mode,...args],{cwd:s.root,encoding:'utf8'}),before=await tree(s.root);
 const audit=run('check',['--slug',slug,'--json']);assert.equal(audit.status,0,audit.stderr);assert.equal(JSON.parse(audit.stdout).technical,'passed');assert.equal(await tree(s.root),before);
 assert.equal(run('check',['--slug','not-existing','--json']).status,1);assert.equal(run('check',['--slug','../escape']).status,1);assert.equal(run('approve',['--slug',slug]).status,1);assert.equal(run('check',['--unknown']).status,1);assert.equal(run('handoff',['--slug',slug,'--published']).status,1);
 const checklist=run('check',['--slug',slug,'--checklist']);assert.equal(checklist.status,0);assert.match(checklist.stdout,/\[ \]/);
 const handoff=run('handoff',['--slug',slug,'--json']);assert.equal(handoff.status,0);assert.equal(JSON.parse(handoff.stdout).state,'ready-for-review');
 assert.equal(run('check',['--slug',slug,'--json','--output','reports/check.json']).status,0);assert.equal(run('check',['--slug',slug,'--json','--output','reports/check.json']).status,1);
});
test('isolated commercial flow measures automated phases without claiming client time or publication',async t=>{
 const s=await setup(t,true);assert.ok(s.generation.timings.validationMs>=0);assert.ok(s.generation.timings.assetPreparationMs>=0);assert.ok(s.generation.timings.generationTotalMs!==null);
 const audit=await auditExisting(slug,s.options),checklist=clientChecklist(await readInvitation(slug,s.root),audit);await writeNewFile(s.root,'reports/checklist.md',checklist);
 const result=await recordApproval(slug,{...flags(audit.fingerprint!),simulation:true,observations:'Prueba aislada. No existe consentimiento real.'},s.options);
 const handoff=await createHandoff(await auditExisting(slug,s.options),s.root);await writeNewFile(s.root,'reports/handoff.md',handoffMarkdown(handoff));assert.equal(result.record.status,'simulated');assert.equal(handoff.approval.humanReviewMinutes,null);assert.equal(handoff.publishedAndVerified,false);
});
test('the two built-in demos remain independent and their commercial audits do not mutate them',async()=>{
 const a=getInvitation('laura-martin'),b=getInvitation('ana-carlos');for(const name of ['laura-martin','ana-carlos'])assert.equal((await auditExisting(name,{now})).technical,'passed');assert.deepEqual(getInvitation('laura-martin'),a);assert.deepEqual(getInvitation('ana-carlos'),b);
});

test('approval CLI records a simulation only in the isolated workspace',async t=>{
 const s=await setup(t,true),r=await auditExisting(slug,s.options),cli=resolve('scripts/invitation-quality.ts');
 const result=spawnSync(process.execPath,['--experimental-strip-types',cli,'approve','--slug',slug,'--responsible','Responsable ficticio de prueba CLI','--approved-at','2020-01-01T00:00:00Z','--reviewed-fingerprint',r.fingerprint!,'--confirm-client-approval','--confirm-checklist','--acknowledge-warnings','--simulation'],{cwd:s.root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).status,'simulated');
 const records=await fs.readdir(join(s.root,'.convete/approvals',slug));assert.equal(records.length,1);assert.equal(JSON.parse(await fs.readFile(join(s.root,'.convete/approvals',slug,records[0]),'utf8')).status,'simulated');
});
