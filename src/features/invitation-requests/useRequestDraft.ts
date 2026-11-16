'use client';
import {useEffect,useState} from 'react';
import {createRequestDraft} from './config';
import type {ResourceManifestEntry} from './types';
export function useRequestDraft(){
 const [draft,setDraft]=useState(createRequestDraft);const [files,setFiles]=useState<Record<string,File>>({});const [dirty,setDirty]=useState(false);
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 function setField(path:string,value:unknown){setDirty(true);setDraft(current=>{const next=structuredClone(current);const parts=path.split('.');let target=next as unknown as Record<string,unknown>;for(const part of parts.slice(0,-1))target=target[part] as Record<string,unknown>;target[parts.at(-1)!]=value;if(path==='rsvp.enabled')next.preferences.sections.rsvp=Boolean(value);return next;});}
 function addFiles(entries:ResourceManifestEntry[],chosen:File[]){setDirty(true);setDraft(current=>({...current,resources:[...current.resources,...entries]}));setFiles(current=>({...current,...Object.fromEntries(entries.map((entry,index)=>[entry.id,chosen[index]]))}));}
 function removeFile(id:string){setDirty(true);setDraft(current=>({...current,resources:current.resources.filter(r=>r.id!==id)}));setFiles(current=>{const next={...current};delete next[id];return next;});}
 return {draft,files,setField,addFiles,removeFile};
}
