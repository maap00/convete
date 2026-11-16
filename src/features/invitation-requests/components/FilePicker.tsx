'use client';
import {useEffect,useRef,useState} from 'react';
import {acceptedImages,MAX_GALLERY_PHOTOS,MAX_TOTAL_BYTES,validateImageFile,checkImageHeader,createManifestEntry} from '../files';
import {fieldId} from './Field';
import type {ResourceDestination,ResourceManifestEntry} from '../types';
function PhotoPreview({file}:{file:File}){
 const image=useRef<HTMLImageElement>(null);
 useEffect(()=>{const url=URL.createObjectURL(file);const element=image.current;if(element)element.src=url;return()=>{URL.revokeObjectURL(url);element?.removeAttribute('src');};},[file]);
 // Blob URLs stay local and cannot be passed through the Next image optimizer.
 // eslint-disable-next-line @next/next/no-img-element
 return <img ref={image} alt={`Vista previa de ${file.name}`} width={112} height={84}/>;
}
export interface FilePickerProps {
 destination:ResourceDestination;label:string;resources:ResourceManifestEntry[];files:Record<string,File>;
 onAdd:(entries:ResourceManifestEntry[],files:File[])=>void;onRemove:(id:string)=>void;
 busy:boolean;setBusy:(busy:boolean)=>void;error?:string;
}
export function FilePicker({destination,label,resources,files,onAdd,onRemove,busy,setBusy,error}:FilePickerProps){
 const [localError,setLocalError]=useState('');const selected=resources.filter(r=>r.destination===destination);const max=destination==='gallery'?MAX_GALLERY_PHOTOS:1;
 async function select(input:HTMLInputElement){
  const chosen=Array.from(input.files??[]);input.value='';if(!chosen.length)return;
  setBusy(true);setLocalError('');
  try{
   if(selected.length+chosen.length>max)throw new Error(`Retira una foto antes de añadir otra. Máximo: ${max}.`);
   if(resources.reduce((sum,r)=>sum+r.size,0)+chosen.reduce((sum,f)=>sum+f.size,0)>MAX_TOTAL_BYTES)throw new Error('El total de fotografías no puede superar 80 MiB.');
   const names=new Set(resources.map(r=>r.filename));
   for(const file of chosen){const problem=validateImageFile(file);if(problem)throw new Error(problem);if(names.has(file.name))throw new Error('Ya hay un archivo con ese nombre. Renómbralo para evitar confusiones en la entrega.');names.add(file.name);
    if(!await checkImageHeader(file))throw new Error(`${file.name}: el contenido no coincide con un JPEG, PNG o WebP.`);
    const bitmap=await createImageBitmap(file);const pixels=bitmap.width*bitmap.height;bitmap.close();if(pixels>40000000)throw new Error('Usa fotografías de hasta 40 megapíxeles.');
   }
   onAdd(chosen.map(file=>createManifestEntry(file,destination,crypto.randomUUID())),chosen);
  }catch(reason){setLocalError(reason instanceof Error?reason.message:'No se pudo leer la fotografía. Selecciona una imagen válida.');}finally{setBusy(false);}
 }
 const id=fieldId(`resources.${destination}`);const message=localError||error;
 return <fieldset className="request-file-picker"><legend>{label}</legend><label htmlFor={id} className="request-file-label">Seleccionar {destination==='gallery'?'fotografías':'fotografía'}</label>
 <input id={id} name={`resources.${destination}`} type="file" accept={acceptedImages} multiple={destination==='gallery'} disabled={busy} onChange={e=>void select(e.currentTarget)} aria-invalid={Boolean(message)} aria-describedby={`${id}-help${message?` ${id}-error`:''}`}/>
 <p className="request-help" id={`${id}-help`}>JPEG, PNG o WebP · hasta 8 MiB y 40 MP por foto · {max===1?'1 archivo':`hasta ${max} archivos`}. Total: 80 MiB.</p>
 {message&&<p className="request-error" id={`${id}-error`} role="alert">{message}</p>}
 <ul className="request-files">{selected.map(resource=><li key={resource.id}>{files[resource.id]&&<PhotoPreview file={files[resource.id]}/>}<div><strong>{resource.filename}</strong><p>{(resource.size/1024/1024).toFixed(2)} MiB · {resource.mimeType}</p><button type="button" className="request-text-button" disabled={busy} onClick={()=>{setLocalError('');onRemove(resource.id);}} aria-label={`Retirar ${resource.filename}`}>Retirar archivo</button></div></li>)}</ul>
 </fieldset>;
}
