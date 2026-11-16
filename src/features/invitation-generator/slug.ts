import {isInvitationSlug} from '../invitations/validation.ts';
const reserved=new Set(['api','admin','public','themes','photos','assets','solicitar-invitacion','invitacion','index','new','create','favicon','robots','sitemap']);
export function validateSlug(slug:string):string {
 if(typeof slug!=='string'||slug.length<3||slug.length>80||!isInvitationSlug(slug)||reserved.has(slug))throw new Error('slug: usa 3–80 caracteres ASCII en minúsculas, números y guiones; no se permiten rutas ni nombres reservados.');
 return slug;
}
export function createSlug(first:string,second:string):string {
 return validateSlug(`${first} ${second}`.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
}
