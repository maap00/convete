import type { Metadata } from 'next';
import type { WeddingInvitation } from './types';
/** Only an explicitly configured public HTTPS origin may become a canonical. */
export function publicOrigin(value?: string): string | undefined {
 if (!value) return undefined;
 if (value !== value.trim()) throw new Error('CONVETE_PUBLIC_ORIGIN no debe contener espacios.');
 const url = new URL(value);
 if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash || (/^(localhost|\[|[\d.]+$)/i.test(url.hostname) || /\.(?:local|localhost|internal)$/i.test(url.hostname)) || !url.hostname.includes('.')) throw new Error('CONVETE_PUBLIC_ORIGIN debe ser un origen HTTPS público sin ruta, credenciales ni puerto.');
 return url.origin;
}
export interface OriginEnvironment {[name:string]:string|undefined;VERCEL_ENV?:string;CONVETE_PUBLIC_ORIGIN?:string;CONVETE_PREVIEW_ORIGIN?:string;VERCEL_URL?:string}
/** Preview never silently reuses the production origin. No origin is invented locally. */
export function resolveMetadataOrigin(env:OriginEnvironment):string|undefined {
 if(env.VERCEL_ENV==='preview'){
  if(env.CONVETE_PREVIEW_ORIGIN)return publicOrigin(env.CONVETE_PREVIEW_ORIGIN);
  if(env.VERCEL_URL){if(!/^[a-z0-9.-]+$/i.test(env.VERCEL_URL))throw new Error('VERCEL_URL debe contener solo el hostname del deployment.');return publicOrigin(`https://${env.VERCEL_URL}`);}
  throw new Error('Preview requiere CONVETE_PREVIEW_ORIGIN o VERCEL_URL; no se reutilizará el dominio Production.');
 }
 if(env.VERCEL_ENV==='production'&&!env.CONVETE_PUBLIC_ORIGIN)throw new Error('Production requiere CONVETE_PUBLIC_ORIGIN explícito.');
 return publicOrigin(env.CONVETE_PUBLIC_ORIGIN);
}
export function invitationMetadata(invitation: WeddingInvitation, configuredOrigin?: string): Metadata {
 const origin = publicOrigin(configuredOrigin);
 const {title,description,noIndex} = invitation.seo;
 const imagePath = invitation.seo.image ?? `/invitations/${invitation.slug}/social.jpg`;
 // Omit URL-bearing social tags locally; Next must not invent localhost as public origin.
 const images = origin ? [{url: new URL(imagePath,origin).href, ...(invitation.seo.image ? {} : {width:1200,height:630}),alt:`${invitation.couple.first} y ${invitation.couple.second} · Nuestra boda`}] : undefined;
 const canonical = origin ? `${origin}/invitacion/${invitation.slug}` : undefined;
 return {title,description,...(origin?{metadataBase:new URL(origin)}:{}),robots:{index:!noIndex,follow:!noIndex},
  ...(canonical ? {alternates:{canonical}} : {}),
  openGraph:{type:'website',locale:'es_VE',title,description,...(canonical ? {url:canonical} : {}),...(images ? {images} : {})},
  twitter:{card:'summary_large_image',title,description,...(images ? {images} : {})}};
}

export function metadataForEnvironment(invitation:WeddingInvitation,env:OriginEnvironment):Metadata {
 const metadata=invitationMetadata(invitation,resolveMetadataOrigin(env));
 return env.VERCEL_ENV==='preview'?{...metadata,robots:{index:false,follow:false}}:metadata;
}
