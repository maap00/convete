export interface Finding {level:'ERROR'|'WARNING'|'INFO';code:string;field:string;message:string}
export interface AuditedResource {path:string;roles:string[];kind:'photo'|'social'|'decoration';required:boolean;exists:boolean;valid:boolean;bytes?:number;width?:number;height?:number;sha256?:string}
export interface AuditReport {
 schemaVersion:1;rulesVersion:1;slug:string;id?:string;couple?:string;theme?:string;reviewedAt:string;
 technical:'passed'|'blocked';readyForReview:boolean;findings:Finding[];resources:AuditedResource[];sections:string[];
 fingerprint?:string;origin?:string;fixture:boolean;route:string;
 timings:{auditMs:number;generationPreparationMs:number|null;humanReviewMinutes:null};
 recommendations:string[];
}
export interface ApprovalRecord {
 schemaVersion:1;slug:string;responsible:string;approvedAt:string;recordedAt:string;fingerprint:string;
 status:'approved'|'simulated';checklistConfirmed:true;publicationAuthorized:boolean;warningCodes:string[];
 observations?:string;humanReviewMinutes?:number;
}
export interface ApprovalSummary {status:'absent'|'approved'|'stale'|'simulated'|'invalid'|'blocked';approvedAt?:string;publicationAuthorized:boolean;warningsAcknowledged:boolean;humanReviewMinutes:number|null}
export interface HandoffReport {
 schemaVersion:1;audit:AuditReport;approval:ApprovalSummary;
 state:'blocked'|'ready-for-review'|'client-approved'|'ready-for-publication';
 publishedAndVerified:false;publicationBlockers:string[];nextSteps:string[];
}
