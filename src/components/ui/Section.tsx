import type { ReactNode } from 'react';
import { Sprig } from './BotanicalDecoration';
import { Icon } from './Icon';
export function Section({ id, title, variant, ornament, children }: { id: string; title: string; variant: 'plain' | 'outlined'; ornament: string; children: ReactNode }) {
 return <section id={id} aria-labelledby={`${id}-heading`} className={`section section--${variant} section--${id}`}><div className="section-heading">{id === 'rsvp' ? <Icon name="calendar"/> : id === 'gifts' ? <Icon name="gift"/> : <Sprig src={ornament}/>}<h2 id={`${id}-heading`}>{title}</h2></div>{children}</section>;
}
