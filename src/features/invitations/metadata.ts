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
export function invitationMetadata(invitation: WeddingInvitation, configuredOrigin?: string): Metadata {
 const origin = publicOrigin(configuredOrigin);
 const {title,description,noIndex} = invitation.seo;
 const imagePath = invitation.seo.image ?? `/invitations/${invitation.slug}/social.jpg`;
 // Omit URL-bearing social tags locally; Next must not invent localhost as public origin.
 const images = origin ? [{url: new URL(imagePath,origin).href, ...(invitation.seo.image ? {} : {width:1200,height:630}),alt:`${invitation.couple.first} y ${invitation.couple.second} · Nuestra boda`}] : undefined;
 const canonical = origin ? `${origin}/invitacion/${invitation.slug}` : undefined;
 return {title,description,robots:{index:!noIndex,follow:!noIndex},
  ...(canonical ? {alternates:{canonical}} : {}),
  openGraph:{type:'website',locale:'es_VE',title,description,...(canonical ? {url:canonical} : {}),...(images ? {images} : {})},
  twitter:{card:'summary_large_image',title,description,...(images ? {images} : {})}};
}
