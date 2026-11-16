import Image from 'next/image';
import type { WeddingInvitation, Venue, Photo } from '@/features/invitations/types';
import { formatEventTime } from '@/lib/dates';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { LocationActions } from './LocationActions';
import { Icon } from '@/components/ui/Icon';
export function Welcome({ messages, photo }: { messages: WeddingInvitation['messages']; photo?: Photo }) {
 return <><p className="story-copy">{messages.story ?? messages.welcome}</p>{photo && <Image className="story-photo" {...photo} sizes="(min-width: 768px) 680px, 100vw" alt={photo.alt}/>}</>;
}
function VenueDetails({ venue, timeZone, title, icon }: { venue: Venue; timeZone: string; title: string; icon: 'church' | 'glasses' }) {
 return <article className="venue">{venue.photo && <Image {...venue.photo} sizes="(min-width: 768px) 240px, 38vw" alt={venue.photo.alt}/>}<div><h3><Icon name={icon}/>{title}</h3><p className="venue-name">{venue.name}</p><time dateTime={venue.startsAt}>{formatEventTime(venue.startsAt, timeZone, false)} hs</time>{venue.address && <small className="venue-address">{venue.address}{(venue.city || venue.country) && <span className="venue-region">{[venue.city,venue.country].filter(Boolean).join(', ')}</span>}</small>}{!venue.address && (venue.city || venue.country) && <small className="venue-address">{[venue.city,venue.country].filter(Boolean).join(', ')}</small>}{venue.directions && <p className="venue-directions">{venue.directions}</p>}<LocationActions location={venue} eventTitle={title}/></div></article>;
}
export function Venues({ ceremony, reception, timeZone, visibility = { ceremony: true, reception: true } }: { ceremony: Venue; reception: Venue; timeZone: string; visibility?: { ceremony: boolean; reception: boolean } }) {
 return <div className="venue-grid">{visibility.ceremony && <VenueDetails venue={ceremony} title="Ceremonia" icon="church" timeZone={timeZone}/>}{visibility.reception && <VenueDetails venue={reception} title="Recepción" icon="glasses" timeZone={timeZone}/>}</div>;
}
function PhotoGrid({ photos }: { photos: readonly Photo[] }) { return <div className="photo-grid">{photos.map(photo => <Image key={photo.src} {...photo} sizes="(min-width: 768px) 300px, 45vw" alt={photo.alt}/>)}</div>; }
export function Gallery({ photos }: { photos: readonly Photo[] }) {
 return <><PhotoGrid photos={photos.slice(0,4)}/>{photos.length > 4 && <details className="more-photos"><summary className="action-link"><Icon name="image"/>Ver más fotos</summary><PhotoGrid photos={photos.slice(4)}/></details>}</>;
}
export function Itinerary({ items, timeZone }: { items: WeddingInvitation['itinerary']; timeZone: string }) {
 return <ol className="timeline">{items.map(item => <li key={item.id}><Icon name={item.icon ?? 'rings'}/><div><time dateTime={item.startsAt}>{formatEventTime(item.startsAt, timeZone, false)} hs</time><p>{item.title}</p>{item.description && <small>{item.description}</small>}</div></li>)}</ol>;
}
export function DressCode({ dressCode }: { dressCode: WeddingInvitation['dressCode'] }) {
 return <><div className="dress-icons"><Icon name="suit"/><Icon name="dress"/></div><p className="dress-title">{dressCode.title}</p><p className="fine-copy">{dressCode.description}</p>{dressCode.suggestedColors&&<p className="fine-copy">Colores sugeridos: {dressCode.suggestedColors}</p>}{dressCode.palette && <ul className="dress-palette" aria-label="Paleta de colores sugerida">{dressCode.palette.map(color => <li key={color.name}><span style={{ backgroundColor: color.color }} aria-hidden="true"/><span className="sr-only">{color.name}</span></li>)}</ul>}</>;
}
export function Gifts({ gifts }: { gifts: WeddingInvitation['gifts'] }) {
 return <><p className="gift-copy">{gifts.message}</p>{gifts.url && <ExternalLink href={gifts.url} label={gifts.buttonText ?? "Ver lista de regalos"}>{gifts.buttonText ?? "Ver lista de regalos"}<Icon name="arrow"/></ExternalLink>}</>;
}
