/** Explicitly isolated fixture: no client consent is claimed or stored in the project. */
import * as fs from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
import {generateInvitation} from '../src/features/invitation-generator/generate.ts';
import {auditExisting,readInvitation} from '../src/features/invitation-quality/audit.ts';
import {recordApproval} from '../src/features/invitation-quality/approval.ts';
import {clientChecklist,createHandoff,handoffMarkdown} from '../src/features/invitation-quality/documents.ts';
const project=process.cwd(),root=await fs.mkdtemp(join(tmpdir(),'convete-commercial-flow-'));
try{
 await fs.mkdir(join(root,'public/invitations'),{recursive:true});await fs.mkdir(join(root,'public/themes/botanical'),{recursive:true});
 for(const file of ['sprig.svg','floral-corner.webp'])await fs.copyFile(join(project,'public/themes/botanical',file),join(root,'public/themes/botanical',file));
 const options={root,input:join(project,'docs/examples/solicitud-invitacion-recorrido-4.1.1.json'),assets:join(project,'public/invitations/laura-martin'),slug:'fixture-flujo-comercial',fixture:true};
 const start=performance.now(),dryRun=await generateInvitation({...options,dryRun:true}),dryRunMs=Math.round(performance.now()-start);
 assert.deepEqual(await fs.readdir(join(root,'public/invitations')),[]);
 const generation=await generateInvitation(options),audit=await auditExisting(options.slug,{root});assert.equal(audit.technical,'passed');
 const checklistStart=performance.now(),checklist=clientChecklist(await readInvitation(options.slug,root),audit),checklistMs=Math.round(performance.now()-checklistStart);
 const approval=await recordApproval(options.slug,{responsible:'Responsable ficticio del ensayo aislado',approvedAt:'2020-01-01T00:00:00Z',reviewedFingerprint:audit.fingerprint!,confirmClientApproval:true,confirmChecklist:true,authorizePublication:false,acknowledgeWarnings:true,simulation:true,observations:'SIMULACIÓN AISLADA. No hay cliente ni consentimiento real.'},{root});
 const handoffStart=performance.now(),handoff=await createHandoff(await auditExisting(options.slug,{root}),root),handoffMs=Math.round(performance.now()-handoffStart);assert.equal(handoff.approval.status,'simulated');assert.equal(handoff.state,'ready-for-review');assert.equal(handoff.publishedAndVerified,false);
 console.log(JSON.stringify({notice:'EJEMPLOS FICTICIOS AISLADOS: no representan aprobación ni autorización de una persona real.',timings:{dryRunMs,requestValidationMs:dryRun.timings.validationMs,assetPreparationMs:generation.timings.assetPreparationMs,generationTotalMs:generation.timings.generationTotalMs,auditMs:audit.timings.auditMs,checklistMs,approvalRegistrationMs:approval.elapsedMs,handoffMs,humanReviewMinutes:null},audit,checklist,approvalExample:approval.record,handoff,handoffMarkdown:handoffMarkdown(handoff)},null,2));
}finally{await fs.rm(root,{recursive:true,force:true});}
