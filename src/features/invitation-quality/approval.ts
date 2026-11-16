import * as fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {auditExisting,type AuditOptions} from './audit.ts';
import {readPrivateDirectory,workspacePath,writeNewFile} from './storage.ts';
import type {AuditReport,ApprovalRecord,ApprovalSummary} from './types';
const validInstant=(value:unknown):value is string=>{
 try{return typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)===value.slice(0,10)&&Number(value.slice(11,13))<24&&Number(value.slice(14,16))<60&&Number(value.slice(17,19))<60;}catch{return false;}
};
const warningCodes=(report:AuditReport)=>[...new Set(report.findings.filter(f=>f.level==='WARNING').map(f=>`${f.code}:${f.field}`))].sort();
export interface ApprovalInput {
 responsible:string;approvedAt:string;reviewedFingerprint:string;confirmClientApproval:boolean;confirmChecklist:boolean;
 authorizePublication:boolean;acknowledgeWarnings:boolean;simulation?:boolean;observations?:string;humanReviewMinutes?:number;
}
export async function recordApproval(slug:string,input:ApprovalInput,options:AuditOptions={}):Promise<{record:ApprovalRecord;path:string;elapsedMs:number}>{
 const started=performance.now(),root=options.root??process.cwd(),report=await auditExisting(slug,options),now=options.now??new Date();
 if(report.technical!=='passed'||!report.fingerprint)throw new Error('approval: hay errores técnicos; no se puede registrar aprobación.');
 if(input.confirmClientApproval!==true||input.confirmChecklist!==true)throw new Error('approval: requiere confirmación explícita de aprobación recibida y checklist revisado.');
 if(!/^[a-f0-9]{64}$/.test(input.reviewedFingerprint)||input.reviewedFingerprint!==report.fingerprint)throw new Error('approval: la huella revisada no corresponde a la versión actual.');
 if(typeof input.responsible!=='string'||!input.responsible.trim()||input.responsible.length>160||/[\u0000-\u001f\u007f]/.test(input.responsible))throw new Error('responsible: identificación explícita de 1–160 caracteres sin controles.');
 if(!validInstant(input.approvedAt)||Date.parse(input.approvedAt)>now.getTime())throw new Error('approved-at: indica un instante ISO real con zona, no futuro, proporcionado por el operador.');
 if(input.observations!==undefined&&(typeof input.observations!=='string'||input.observations.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input.observations)))throw new Error('observations: texto de hasta 2000 caracteres sin controles.');
 if(input.humanReviewMinutes!==undefined&&(!Number.isFinite(input.humanReviewMinutes)||input.humanReviewMinutes<0||input.humanReviewMinutes>1440))throw new Error('human-review-minutes: duración declarada entre 0 y 1440 minutos.');
 if(report.fixture&&!input.simulation)throw new Error('approval: una demo/fixture solo admite --simulation, nunca aprobación comercial real.');
 const warnings=warningCodes(report);if(warnings.length&&input.acknowledgeWarnings!==true)throw new Error('approval: revisa las advertencias y confirma --acknowledge-warnings.');
 const record:ApprovalRecord={schemaVersion:1,slug,responsible:input.responsible.trim(),approvedAt:new Date(input.approvedAt).toISOString(),recordedAt:now.toISOString(),fingerprint:report.fingerprint,status:input.simulation?'simulated':'approved',checklistConfirmed:true,publicationAuthorized:input.authorizePublication===true,warningCodes:warnings,...(input.observations?.trim()?{observations:input.observations.trim()}:{}),...(input.humanReviewMinutes!==undefined?{humanReviewMinutes:input.humanReviewMinutes}:{})};
 const path=`.convete/approvals/${slug}/${randomUUID()}.json`;await writeNewFile(root,path,JSON.stringify(record,null,2)+'\n',true);
 return {record,path,elapsedMs:Math.round(performance.now()-started)};
}
function isRecord(v:unknown,slug:string):v is ApprovalRecord {
 if(!v||typeof v!=='object')return false;const r=v as ApprovalRecord;
 return r.schemaVersion===1&&r.slug===slug&&['approved','simulated'].includes(r.status)&&typeof r.responsible==='string'&&Boolean(r.responsible.trim())&&validInstant(r.approvedAt)&&validInstant(r.recordedAt)&&Date.parse(r.approvedAt)<=Date.parse(r.recordedAt)&&/^[a-f0-9]{64}$/.test(r.fingerprint)&&r.checklistConfirmed===true&&typeof r.publicationAuthorized==='boolean'&&Array.isArray(r.warningCodes)&&r.warningCodes.every(v=>typeof v==='string')&&(r.humanReviewMinutes===undefined||Number.isFinite(r.humanReviewMinutes)&&r.humanReviewMinutes>=0&&r.humanReviewMinutes<=1440);
}
export async function approvalSummary(report:AuditReport,root=process.cwd()):Promise<ApprovalSummary>{
 const empty:ApprovalSummary={status:'absent',publicationAuthorized:false,warningsAcknowledged:false,humanReviewMinutes:null};
 if(report.technical!=='passed')return {...empty,status:'blocked'};
 try{
  const directory=`.convete/approvals/${report.slug}`,names=await readPrivateDirectory(root,directory),records:ApprovalRecord[]=[];
  for(const name of names){const file=await workspacePath(root,`${directory}/${name}`),stat=await fs.stat(file);if(stat.size>16*1024)throw new Error('Registro demasiado grande');const value:unknown=JSON.parse(await fs.readFile(file,'utf8'));if(!isRecord(value,report.slug))throw new Error('Registro inválido');records.push(value);}
  if(!records.length)return empty;
  records.sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt)||Date.parse(b.approvedAt)-Date.parse(a.approvedAt));
  const current=records[0];if(records[1]?.recordedAt===current.recordedAt&&JSON.stringify(records[1])!==JSON.stringify(current))return {...empty,status:'invalid'};if(Date.parse(current.recordedAt)>Date.parse(report.reviewedAt))return {...empty,status:'invalid'};
  if(current.fingerprint!==report.fingerprint)return {...empty,status:'stale'};
  if(current.status==='simulated'||report.fixture)return {...empty,status:'simulated',approvedAt:current.approvedAt,humanReviewMinutes:current.humanReviewMinutes??null};
  return {status:'approved',approvedAt:current.approvedAt,publicationAuthorized:current.publicationAuthorized,warningsAcknowledged:warningCodes(report).every(c=>current.warningCodes.includes(c)),humanReviewMinutes:current.humanReviewMinutes??null};
 }catch{return {...empty,status:'invalid'};}
}
