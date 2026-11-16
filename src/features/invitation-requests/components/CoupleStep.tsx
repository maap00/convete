import {BoundField,type StepProps} from './Field';
export function CoupleStep(props:StepProps){return <><p className="request-lead">Empecemos por ustedes y por la fecha que quieren celebrar.</p><div className="request-grid">
 <BoundField {...props} path="couple.first" label="Nombre de la primera persona" required maxLength={100}/>
 <BoundField {...props} path="couple.second" label="Nombre de la segunda persona" required maxLength={100}/>
 <BoundField {...props} path="event.date" label="Fecha de la boda" type="date" required/>
 <BoundField {...props} path="event.timeZone" label="Zona horaria del evento" required help="Zona IANA, como America/Caracas, America/Bogota o Europe/Madrid. No asumimos la zona de tu dispositivo."/>
 <BoundField {...props} path="contact.email" label="Correo de contacto" type="email" required maxLength={254}/>
 <BoundField {...props} path="contact.whatsapp" label="WhatsApp de contacto comercial" type="tel" required maxLength={30} help="Incluye el código de país. Este contacto no se usará automáticamente para recibir confirmaciones RSVP."/>
 </div></>;}
