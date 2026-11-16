import type { WeddingInvitation } from './types';
/** Preserve configured order, suppress disabled and empty groups before rendering. */
export function getVisibleSections(invitation: WeddingInvitation) {
 return invitation.sections.filter(section => {
  if (!section.enabled) return false;
  if (section.id === 'venues') return section.ceremony !== false || section.reception !== false;
  if (section.id === 'gallery') return invitation.photos.length > 0;
  if (section.id === 'itinerary') return invitation.itinerary.length > 0;
  return true;
 });
}
export function getVenueVisibility(invitation: WeddingInvitation) {
 const section = invitation.sections.find(section => section.id === 'venues');
 return { ceremony: Boolean(section?.enabled && section.ceremony !== false), reception: Boolean(section?.enabled && section.reception !== false) };
}
