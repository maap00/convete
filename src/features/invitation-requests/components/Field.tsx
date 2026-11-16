import type {FieldErrors,RequestDraft} from '../types';
export interface StepProps {draft:RequestDraft;errors:FieldErrors;setField:(path:string,value:unknown)=>void}
export const fieldId=(path:string)=>`request-${path.replaceAll('.','-')}`;
export function Field({path,label,value,onChange,errors,help,required=false,type='text',maxLength,options,wide=false}:{path:string;label:string;value:string;onChange:(value:string)=>void;errors:FieldErrors;help?:string;required?:boolean;type?:string;maxLength?:number;options?:readonly{value:string;label:string}[];wide?:boolean}){
 const id=fieldId(path),error=errors[path];
 const props={id,name:path,value,onChange:(event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>onChange(event.target.value),required,'aria-invalid':Boolean(error),'aria-describedby':[help?`${id}-help`:'',error?`${id}-error`:''].filter(Boolean).join(' ')||undefined};
 return <div className={`request-field${wide?' request-field--wide':''}`}><label htmlFor={id}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
 {options?<select {...props}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:type==='textarea'?<textarea {...props} rows={4} maxLength={maxLength}/>:<input {...props} type={type} maxLength={maxLength} autoComplete={path==='contact.email'?'email':path==='contact.whatsapp'?'tel':path.startsWith('couple.')?'name':'off'} step={type==='number'?'1':undefined}/>}
 {help&&<p className="request-help" id={`${id}-help`}>{help}</p>}{error&&<p className="request-error" id={`${id}-error`}>{error}</p>}</div>;
}
export function BoundField({path,label,draft,errors,setField,...props}:StepProps&{path:string;label:string;help?:string;required?:boolean;type?:string;maxLength?:number;options?:readonly{value:string;label:string}[];wide?:boolean}){
 let value:unknown=draft;for(const part of path.split('.'))value=(value as Record<string,unknown>)[part];
 return <Field {...props} path={path} label={label} value={String(value??'')} onChange={value=>setField(path,value)} errors={errors}/>;
}
export function Toggle({label,checked,onChange,help}:{label:string;checked:boolean;onChange:(value:boolean)=>void;help?:string}){return <label className="request-toggle"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span>{label}{help&&<small>{help}</small>}</span></label>;}
