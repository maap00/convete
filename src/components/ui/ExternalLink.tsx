import type { ReactNode } from 'react';
import { isHttpsUrl } from '@/lib/urls';
/** Defense in depth: invalid URLs produce no action, even outside the renderer. */
export function ExternalLink({href,children,className='action-link',label}:{href:string;children:ReactNode;className?:string;label:string}) {
 if (!isHttpsUrl(href)) return null;
 return <a href={href} className={className} target="_blank" rel="noopener noreferrer" aria-label={`${label} (se abre en otra pestaña)`}>{children}</a>;
}
