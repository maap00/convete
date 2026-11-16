import type { EventLocation } from '@/features/locations/types';
import { resolveLocationActions } from '@/features/locations/navigation';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Icon } from '@/components/ui/Icon';
export function LocationActions({location,eventTitle}:{location:EventLocation;eventTitle:string}) {
 const actions=resolveLocationActions(location);
 if (!actions.googleMaps && !actions.waze) return null;
 return <nav className="location-actions" aria-label={`Cómo llegar a ${eventTitle.toLowerCase()}: ${location.name}`}>
  {actions.googleMaps && <ExternalLink className="location-link" href={actions.googleMaps} label={`Abrir Google Maps para ${eventTitle.toLowerCase()} en ${location.name}`}><Icon name="pin"/>Google Maps<Icon name="arrow"/></ExternalLink>}
  {actions.waze && <ExternalLink className="location-link" href={actions.waze} label={`Abrir Waze para ${eventTitle.toLowerCase()} en ${location.name}`}><Icon name="pin"/>Waze<Icon name="arrow"/></ExternalLink>}
 </nav>;
}
