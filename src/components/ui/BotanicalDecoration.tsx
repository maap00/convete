import Image from 'next/image';
export function BotanicalDecoration({ src, className = '', eager = false }: { src: string; className?: string; eager?: boolean }) {
 return <Image className={`botanical-decoration ${className}`} src={src} loading={eager ? "eager" : "lazy"} alt="" aria-hidden="true" width={600} height={600} sizes="(min-width: 768px) 380px, 240px"/>;
}
export function Sprig({ src }: { src: string }) { return <Image className="sprig" src={src} width={64} height={44} alt="" aria-hidden="true"/>; }
