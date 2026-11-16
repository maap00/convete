import {BoundField,Field,Toggle,type StepProps} from './Field';
export function CelebrationStep(props:StepProps){const {draft,setField,errors}=props;const items=draft.celebration.itinerary;return <><p className="request-lead">Los detalles que ayudarán a sus invitados a disfrutar el día.</p>
 <Toggle label="Incluir código de vestimenta" checked={draft.preferences.sections.dressCode} onChange={value=>setField('preferences.sections.dressCode',value)}/>
 {draft.preferences.sections.dressCode&&<div className="request-grid"><BoundField {...props} path="celebration.dressCode" label="Código de vestimenta" required={draft.preferences.sections.dressCode} maxLength={500} help="Por ejemplo: Formal, con calzado cómodo para el jardín."/>
 <BoundField {...props} path="celebration.colors" label="Colores sugeridos (opcional)" maxLength={300} help="Describe los colores por nombre; no hace falta un código técnico."/></div>}
 <fieldset className="request-group"><legend>Itinerario</legend><Toggle label="Mostrar itinerario en la invitación" checked={draft.preferences.sections.itinerary} onChange={value=>setField('preferences.sections.itinerary',value)}/>
 <p className="request-help">Ordenen las actividades por fecha y hora. Zona: {draft.event.timeZone}. Máximo 20 actividades.</p>
 {draft.preferences.sections.itinerary&&items.map((item,index)=><fieldset className="request-activity" key={item.id}><legend>Actividad {index+1}</legend><div className="request-grid">
 <Field path={`itinerary.${item.id}.title`} label="Actividad" value={item.title} required maxLength={160} errors={errors} onChange={value=>setField('celebration.itinerary',items.map(i=>i.id===item.id?{...i,title:value}:i))}/>
 <Field path={`itinerary.${item.id}.localDateTime`} label="Fecha y hora de la actividad" value={item.localDateTime} type="datetime-local" required errors={errors} onChange={value=>setField('celebration.itinerary',items.map(i=>i.id===item.id?{...i,localDateTime:value}:i))}/>
 <Field path={`itinerary.${item.id}.description`} label="Descripción (opcional)" value={item.description} type="textarea" maxLength={500} errors={errors} onChange={value=>setField('celebration.itinerary',items.map(i=>i.id===item.id?{...i,description:value}:i))}/>
 </div><button type="button" className="request-text-button" onClick={()=>setField('celebration.itinerary',items.filter(i=>i.id!==item.id))}>Eliminar actividad {index+1}</button></fieldset>)}
 {errors['celebration.itinerary']&&<p className="request-error">{errors['celebration.itinerary']}</p>}
 <button type="button" className="request-button request-button--secondary" disabled={!draft.preferences.sections.itinerary||items.length>=20} onClick={()=>setField('celebration.itinerary',[...items,{id:crypto.randomUUID(),title:'',localDateTime:'',description:''}])}>+ Añadir actividad</button></fieldset>
 <Toggle label="Incluir información de regalos" checked={draft.preferences.sections.gifts} onChange={value=>setField('preferences.sections.gifts',value)}/>
 {draft.preferences.sections.gifts&&<div className="request-grid"><BoundField {...props} path="celebration.giftsMessage" label="Información de regalos" type="textarea" required={draft.preferences.sections.gifts} maxLength={2000} help="Pueden indicar que su presencia es el mejor regalo."/>
 <BoundField {...props} path="celebration.giftsUrl" label="URL de lista de regalos (opcional)" type="url" help="Usa HTTPS. No añadas contraseñas ni datos bancarios."/></div>}<div className="request-grid">
 <BoundField {...props} path="content.specialInstructions" label="Indicaciones especiales para invitados (opcional)" type="textarea" maxLength={3000} wide/>
 </div></>;}
