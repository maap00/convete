import type { SectionId, ThemeId } from '../invitations/types';
import type { Coordinates } from '../locations/types';
import type { ThemePersonalization } from '../../themes/personalization';
export type ResourceDestination = 'main' | 'gallery' | 'ceremony' | 'reception';
export interface ResourceManifestEntry {
 id: string; filename: string; mimeType: string; size: number; destination: ResourceDestination;
}
export interface VenueDraft {
 name: string; address: string; city: string; country: string; localDateTime: string;
 googleMapsUrl: string; latitude: string; longitude: string; directions: string;
}
export interface RequestDraft {
 couple: {first:string;second:string};
 event: {date:string;timeZone:string};
 contact: {email:string;whatsapp:string};
 venues: {sameLocation:boolean;ceremony:VenueDraft;reception:VenueDraft};
 content: {cover:string;welcome:string;story:string;closing:string;specialInstructions:string};
 resources: ResourceManifestEntry[];
 celebration: {dressCode:string;colors:string;giftsMessage:string;giftsUrl:string;itinerary:{id:string;title:string;localDateTime:string;description:string}[]};
 preferences: {theme:ThemeId;palette:NonNullable<ThemePersonalization['palette']>;sections:Record<SectionId,boolean>};
 rsvp: {enabled:boolean;phone:string;maxCompanions:string;deadlineLocal:string};
}
export interface RequestedVenue {
 location: {name:string;address:string;city:string;country:string;googleMapsUrl?:string;coordinates?:Coordinates;directions?:string};
 startsAt:string;
}
/** Commercial intake, deliberately separate from the publishable invitation contract. */
export interface WeddingInvitationRequest {
 schemaVersion:1; id:string;createdAt:string;
 commercial:{contact:{email:string;whatsapp:string}};
 couple:RequestDraft['couple'];
 event:{date:string;timeZone:string};
 venues:{sameLocation:boolean;ceremony:RequestedVenue;reception:RequestedVenue};
 content:{cover:string;welcome?:string;closing:string;story?:string;specialInstructions?:string};
 resources:ResourceManifestEntry[];
 celebration:{dressCode?:string;colors?:string;giftsMessage?:string;giftsUrl?:string;itinerary:{id:string;title:string;startsAt:string;description?:string}[]};
 preferences:RequestDraft['preferences'];
 rsvp:{enabled:false}|{enabled:true;phone:string;maxCompanions:number;deadline:string};
 completeness:{dataValidated:true;originalFilesDelivery:'pending';requiredResourceIds:string[];note:string};
}
export type FieldErrors=Record<string,string>;
