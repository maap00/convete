'use client';
import {useEffect,useRef,useState} from 'react';
import {steps} from '../config';
import {useRequestDraft} from '../useRequestDraft';
import {validateRequest,validateRequestStep,stepForField} from '../validation';
import {serializeRequest} from '../serialization';
import {downloadRequest} from '../export';
import type {FieldErrors} from '../types';
import {CoupleStep} from './CoupleStep';
import {VenuesStep} from './VenuesStep';
import {ContentStep} from './ContentStep';
import {CelebrationStep} from './CelebrationStep';
import {PreferencesStep} from './PreferencesStep';
import {ReviewStep} from './ReviewStep';
import {WizardProgress} from './WizardProgress';
import {fieldId} from './Field';
export function InvitationRequestWizard(){
 const {draft,files,setField,addFiles,removeFile}=useRequestDraft();const [step,setStep]=useState(0),[visited,setVisited]=useState(0);
 const [errors,setErrors]=useState<FieldErrors>({});const [reviewed,setReviewed]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const heading=useRef<HTMLHeadingElement>(null),errorSummary=useRef<HTMLDivElement>(null);const initial=useRef(true);
 useEffect(()=>{if(initial.current){initial.current=false;return;}heading.current?.focus();},[step]);
 function change(path:string,value:unknown){setField(path,value);
  const hiddenErrors:Record<string,string[]>={'preferences.sections.dressCode':['celebration.dressCode','celebration.colors'],'preferences.sections.welcome':['content.welcome','content.story'],'preferences.sections.gifts':['celebration.giftsMessage','celebration.giftsUrl'],'preferences.sections.itinerary':['celebration.itinerary','itinerary.'],'preferences.sections.gallery':['resources.gallery'],'rsvp.enabled':['rsvp.']};
  if(value===false&&hiddenErrors[path])setErrors(current=>Object.fromEntries(Object.entries(current).filter(([key])=>!hiddenErrors[path].some(prefix=>key.startsWith(prefix)))));
 setReviewed(false);setStatus('');setErrors(current=>Object.fromEntries(Object.entries(current).filter(([key])=>key!==path&&!key.startsWith(path+'.')&&key!=='review')));}
 function go(next:number){if(busy)return;setStep(next);setStatus('');}
 function showErrors(next:FieldErrors){setErrors(next);setTimeout(()=>errorSummary.current?.focus(),0);}
 function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy)return;
  if(step<5){const next=validateRequestStep(draft,step);if(Object.keys(next).length){showErrors(next);return;}setErrors({});setVisited(Math.max(visited,step+1));go(step+1);return;}
  const next=validateRequest(draft);if(!reviewed)next.review='Confirma que revisaste los datos y que entregarás también los originales.';
  if(Object.keys(next).length){showErrors(next);return;}
  try{const request=serializeRequest(draft,{id:crypto.randomUUID(),createdAt:new Date().toISOString()});downloadRequest(request);setStatus('Se preparó la descarga del JSON. No se ha enviado la solicitud. Entrega el archivo descargado junto con todas las fotografías originales del manifiesto.');setErrors({});}catch{showErrors({export:'No se pudo preparar la descarga. Revisa los campos e inténtalo de nuevo; tus datos siguen en esta pestaña.'});}
 }
 const props={draft,errors,setField:change};
 const controls={resources:draft.resources,files,busy,setBusy,onAdd:(entries:Parameters<typeof addFiles>[0],chosen:File[])=>{addFiles(entries,chosen);setReviewed(false);setErrors(current=>Object.fromEntries(Object.entries(current).filter(([key])=>!key.startsWith('resources'))));},onRemove:(id:string)=>{removeFile(id);setReviewed(false);}};
 return <div className="request-page"><div className="request-shell"><header className="request-brand"><span className="request-wordmark" aria-label="Convete"><span className="request-brand-mark" aria-hidden="true">c</span>convete<span className="request-brand-dot">.</span></span><span>por maap00.world</span></header>
 <main id="request-main"><div className="request-intro"><p className="request-kicker">SU HISTORIA EMPIEZA AQUÍ</p><h1>Creemos su invitación<span>.</span></h1><p>Ustedes ponen la historia. Nosotros le damos forma.<br/>Reúnan los detalles de su boda en seis pasos sencillos.</p></div>
 <WizardProgress step={step} visited={busy?-1:visited} onGo={go}/>
 <form className="request-card" noValidate onSubmit={submit} aria-labelledby="request-step-title">
 <div className="request-card-title"><span aria-hidden="true">{String(step+1).padStart(2,'0')}</span><div><p className="request-kicker">{step===5?'TODO LISTO PARA REVISAR':'VAMOS PASO A PASO'}</p><h2 id="request-step-title" ref={heading} tabIndex={-1}>{steps[step]}</h2></div></div>
 <p className="request-required">Los campos marcados con * son obligatorios.</p>
 {Object.keys(errors).length>0&&<div className="request-error-summary" ref={errorSummary} tabIndex={-1} role="alert"><h3>Hay detalles por corregir</h3><ul>{Object.entries(errors).map(([key,message])=><li key={key}><button type="button" onClick={()=>{if(key==='review'||key==='export'){errorSummary.current?.focus();return;}const target=stepForField(key);if(target!==step)go(target);setTimeout(()=>document.getElementById(fieldId(key))?.focus(),0);}}>{message}</button></li>)}</ul></div>}
 {step===0&&<CoupleStep {...props}/>}{step===1&&<VenuesStep {...props}/>}{step===2&&<ContentStep {...props} fileControls={controls}/>}{step===3&&<CelebrationStep {...props}/>}{step===4&&<PreferencesStep {...props}/>}{step===5&&<ReviewStep draft={draft} onEdit={go} reviewed={reviewed} onReviewed={value=>{setReviewed(value);setErrors(current=>{const next={...current};delete next.review;return next;});}}/>}
 <div className="request-form-navigation"><button className="request-button request-button--secondary" type="button" disabled={step===0||busy} onClick={()=>go(step-1)}>← Anterior</button><button className="request-button" type="submit" disabled={busy}>{busy?'Comprobando fotos…':step===5?'Descargar solicitud JSON':'Siguiente →'}</button></div>
 <p className="request-download-status" role="status" aria-live="polite">{status}</p>
 </form><aside className="request-privacy"><span aria-hidden="true">◇</span><p><strong>Sus datos se preparan localmente.</strong> No se envían ni se guardan automáticamente. Al cerrar o recargar esta pestaña se perderá lo escrito. Descargar el JSON no significa enviarlo a maap00.world.</p></aside>
 </main><footer className="request-footer"><p>Una celebración única. Una invitación que la acompañe.</p><span>Convete · maap00.world</span></footer></div></div>;
}
