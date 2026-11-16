import { botanicalIcons, type BotanicalIcon } from '@/themes/botanical/icons';
export function Icon({ name, className = '' }: { name: BotanicalIcon; className?: string }) {
 return <svg className={`icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={botanicalIcons[name]}/></svg>;
}
