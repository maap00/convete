import {requestJSON} from './serialization';
import type {WeddingInvitationRequest} from './types';
export function downloadRequest(request:WeddingInvitationRequest):void {
 const url=URL.createObjectURL(new Blob([requestJSON(request)],{type:'application/json;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=`solicitud-invitacion-${request.id}.json`;
 document.body.append(link);link.click();link.remove();
 // Give the browser time to consume the download before releasing the temporary resource.
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
