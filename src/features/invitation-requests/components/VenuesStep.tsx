import {BoundField,Toggle,type StepProps} from './Field';
export function VenuesStep(props:StepProps){const {draft,setField}=props;return <><p className="request-lead">Indiquen las ubicaciones reales. Todos los horarios usan {draft.event.timeZone||'la zona horaria del paso 1'}.</p>
 <Toggle label="Ceremonia y recepción en el mismo lugar" checked={draft.venues.sameLocation} onChange={value=>setField('venues.sameLocation',value)} help="Se reutiliza la ubicación de la ceremonia, conservando la hora de recepción. Los datos de un lugar distinto se mantienen si desmarcas esta opción."/>
 {(['ceremony','reception'] as const).map(kind=><fieldset className="request-group" key={kind}><legend>{kind==='ceremony'?'Ceremonia':'Recepción'}</legend><div className="request-grid">
 {kind==='reception'&&draft.venues.sameLocation?<p className="request-callout request-field--wide">Misma ubicación: {draft.venues.ceremony.name||'completa la ceremonia'}. La fecha y la hora son independientes.</p>:<>
 <BoundField {...props} path={`venues.${kind}.name`} label="Nombre del lugar" required maxLength={160}/>
 <BoundField {...props} path={`venues.${kind}.address`} label="Dirección" required maxLength={500}/>
 <BoundField {...props} path={`venues.${kind}.city`} label="Ciudad" required maxLength={160}/>
 <BoundField {...props} path={`venues.${kind}.country`} label="País" required maxLength={160}/>
 <BoundField {...props} path={`venues.${kind}.googleMapsUrl`} label="URL de Google Maps (opcional)" type="url" help="Enlace HTTPS oficial que señale el lugar; no hace falta abrirlo para completar la solicitud."/>
 <BoundField {...props} path={`venues.${kind}.latitude`} label="Latitud (opcional)" help="Decimal con punto, entre −90 y 90. Completa ambas coordenadas o déjalas vacías."/>
 <BoundField {...props} path={`venues.${kind}.longitude`} label="Longitud (opcional)" help="Decimal con punto, entre −180 y 180."/>
 <BoundField {...props} path={`venues.${kind}.directions`} label="Indicaciones para llegar (opcional)" type="textarea" maxLength={2000}/>
 </>}
 <BoundField {...props} path={`venues.${kind}.localDateTime`} label={`Fecha y hora de ${kind==='ceremony'?'ceremonia':'recepción'}`} type="datetime-local" required help="Si la recepción empieza después de medianoche, elige el día siguiente."/>
 </div></fieldset>)}
 </>;}
