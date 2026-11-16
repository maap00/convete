import type { ReactNode } from 'react';
export function ActionLink({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
 return <a className={`action-link${primary ? ' action-link--primary' : ''}`} href={href}>{children}</a>;
}
