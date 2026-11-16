import type { EventLocation } from "../locations/types";
import type { RSVPConfig } from "../rsvp/types";
import type { ThemePersonalization } from "../../themes/personalization";
export type ThemeId = "botanical";
export type SectionId = "countdown" | "welcome" | "venues" | "gallery" | "itinerary" | "dressCode" | "gifts" | "rsvp";
export type InvitationSection =
 | { id: "venues"; enabled: boolean; ceremony?: boolean; reception?: boolean }
 | { id: Exclude<SectionId, "venues">; enabled: boolean; ceremony?: never; reception?: never };
export interface Photo { src: string; alt: string; width: number; height: number }
export interface Venue extends EventLocation { startsAt: string; photo?: Photo }
export interface WeddingInvitation {
  id: string;
  slug: string;
  couple: { first: string; second: string };
  event: { startsAt: string; timeZone: string };
  messages: { title: string; welcome: string; closing: string; romantic?: string; story?: string; thankYou?: string };
  ceremony: Venue;
  reception: Venue;
  guestInstructions?: string;
  storyPhoto?: Photo;
  photos: readonly Photo[];
  itinerary: readonly { id: string; title: string; startsAt: string; description?: string; icon?: "rings" | "camera" | "dinner" | "music" | "cake" }[];
  dressCode: { title: string; description: string; suggestedColors?: string; palette?: readonly { name: string; color: string }[] };
  gifts: { message: string; url?: string; buttonText?: string };
  rsvp: RSVPConfig;
  theme: ThemeId;
  personalization?: ThemePersonalization;
  sections: readonly InvitationSection[];
  seo: { title: string; description: string; image?: string; noIndex: boolean };
  demoNotice?: string;
}
