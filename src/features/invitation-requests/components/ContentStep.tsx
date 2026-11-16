import {BoundField,Toggle,type StepProps} from './Field';
import {defaultClosing} from '../config';
import {FilePicker,type FilePickerProps} from './FilePicker';
export type FileControls=Omit<FilePickerProps,'destination'|'label'|'error'>;
export function ContentStep(props:StepProps&{fileControls:FileControls}){return <><p className="request-lead">Su historia, con sus propias palabras. Las sugerencias son solo una guía; no se guardan como respuestas.</p><Toggle label="Incluir historia y bienvenida" checked={props.draft.preferences.sections.welcome} onChange={value=>props.setField('preferences.sections.welcome',value)}/><div className="request-grid">
 <BoundField {...props} path="content.cover" label="Frase de portada" type="textarea" required maxLength={500} help="Por ejemplo: Nos elegimos para toda la vida."/>
 {props.draft.preferences.sections.welcome&&<><BoundField {...props} path="content.welcome" label="Mensaje de bienvenida" type="textarea" required maxLength={2000} help="Por ejemplo: Nos ilusiona compartir este día contigo."/>
 <BoundField {...props} path="content.story" label="Historia de la pareja (opcional)" type="textarea" maxLength={6000} help="Pueden contar cómo se conocieron o qué hace especial su historia."/></>}
 <BoundField {...props} path="content.closing" label="Mensaje de cierre (opcional)" type="textarea" maxLength={2000} help={`Si lo dejan vacío, se usará: ${defaultClosing}`}/>
 </div><div className="request-callout"><strong>Las fotos no se suben.</strong> Solo se conservan en esta pestaña para preparar su manifiesto. Entreguen los originales junto con el JSON; la descarga no los incluye.</div>
 <FilePicker {...props.fileControls} destination="main" label="Fotografía principal · obligatoria" error={props.errors['resources.main']}/>
 <Toggle label="Incluir galería de fotografías" checked={props.draft.preferences.sections.gallery} onChange={value=>props.setField('preferences.sections.gallery',value)}/>
 {props.draft.preferences.sections.gallery&&<FilePicker {...props.fileControls} destination="gallery" label="Galería · al menos una fotografía" error={props.errors['resources.gallery']}/>}
 <FilePicker {...props.fileControls} destination="ceremony" label="Fotografía de ceremonia · opcional" error={props.errors['resources.ceremony']}/>
 <FilePicker {...props.fileControls} destination="reception" label="Fotografía de recepción · opcional" error={props.errors['resources.reception']}/>
 {props.errors.resources&&<p className="request-error" role="alert">{props.errors.resources}</p>}</>;}
