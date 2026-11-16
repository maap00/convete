import {parseArgs} from 'node:util';
import {auditExisting,readInvitation} from '../src/features/invitation-quality/audit.ts';
import {recordApproval} from '../src/features/invitation-quality/approval.ts';
import {auditText,clientChecklist,createHandoff,handoffMarkdown} from '../src/features/invitation-quality/documents.ts';
import {writeNewFile} from '../src/features/invitation-quality/storage.ts';
try{
 const mode=process.argv[2];if(!['check','approve','handoff'].includes(mode))throw new Error('comando: check, approve o handoff.');
 const {values:v}=parseArgs({args:process.argv.slice(3),allowPositionals:false,strict:true,options:{slug:{type:'string'},json:{type:'boolean'},output:{type:'string'},checklist:{type:'boolean'},help:{type:'boolean'},responsible:{type:'string'},'approved-at':{type:'string'},'reviewed-fingerprint':{type:'string'},'confirm-client-approval':{type:'boolean'},'confirm-checklist':{type:'boolean'},'authorize-publication':{type:'boolean'},'acknowledge-warnings':{type:'boolean'},simulation:{type:'boolean'},observations:{type:'string'},'human-review-minutes':{type:'string'}}});
 if(v.help){console.log(`Convete · ${mode}\n\ninvitation:check -- --slug pareja [--json | --checklist] [--output docs/reporte.json]\ninvitation:handoff -- --slug pareja [--json] [--output reports/entrega.md]\ninvitation:approve -- --slug pareja --responsible "Responsable real" --approved-at ISO-CON-ZONA --reviewed-fingerprint HUELLA --confirm-client-approval --confirm-checklist [--authorize-publication] [--acknowledge-warnings] [--observations TEXTO] [--human-review-minutes NUMERO] [--simulation]\n\nCheck/handoff no escriben por defecto. Output requiere archivo nuevo bajo docs/ o reports/.\nApprove registra una declaración explícita de aprobación YA recibida; no la solicita ni la prueba.\n--simulation nunca cuenta como aprobación comercial real. Ningún comando publica ni verifica un despliegue.`);}
 else{
  if(!v.slug)throw new Error('slug: obligatorio. Consulta --help.');
  const approvalFlags=['responsible','approved-at','reviewed-fingerprint','confirm-client-approval','confirm-checklist','authorize-publication','acknowledge-warnings','simulation','observations','human-review-minutes'] as const;
  if(mode!=='approve'&&approvalFlags.some(k=>v[k]!==undefined))throw new Error('Las opciones de aprobación solo se admiten en invitation:approve.');
  if(mode==='approve'){
   if(v.output||v.checklist||v.json)throw new Error('approve: los registros se guardan en .convete/; no admite --output, --checklist ni --json.');
   if(v['human-review-minutes']!==undefined&&!v['human-review-minutes'].trim())throw new Error('human-review-minutes: indica un número.');
   const result=await recordApproval(v.slug,{responsible:v.responsible??'',approvedAt:v['approved-at']??'',reviewedFingerprint:v['reviewed-fingerprint']??'',confirmClientApproval:v['confirm-client-approval']===true,confirmChecklist:v['confirm-checklist']===true,authorizePublication:v['authorize-publication']===true,acknowledgeWarnings:v['acknowledge-warnings']===true,simulation:v.simulation,observations:v.observations,humanReviewMinutes:v['human-review-minutes']===undefined?undefined:Number(v['human-review-minutes'])},{origin:process.env.CONVETE_PUBLIC_ORIGIN});
   console.log(JSON.stringify({status:result.record.status,record:result.path,fingerprint:result.record.fingerprint,elapsedMs:result.elapsedMs},null,2));
  }else{
   if(v.checklist&&(mode!=='check'||v.json))throw new Error('--checklist solo se admite en check y no se combina con --json.');
   const audit=await auditExisting(v.slug,{origin:process.env.CONVETE_PUBLIC_ORIGIN});let output:string;
   if(mode==='handoff'){const report=await createHandoff(audit);output=v.json?JSON.stringify(report,null,2)+'\n':handoffMarkdown(report);}
   else output=v.checklist?clientChecklist(await readInvitation(v.slug),audit):v.json?JSON.stringify(audit,null,2)+'\n':auditText(audit);
   if(v.output)await writeNewFile(process.cwd(),v.output,output);else process.stdout.write(output);
   if(audit.technical==='blocked')process.exitCode=1;
  }
 }
}catch(error){console.error(`ERROR: ${error instanceof Error?error.message:'Operación no completada.'}`);process.exitCode=1;}
