export interface Coordinates { latitude: number; longitude: number }
/** Venue extends this data without repeating event time or photograph. */
export interface EventLocation {
 name: string;
 address?: string;
 city?: string;
 country?: string;
 coordinates?: Coordinates;
 googleMapsUrl?: string;
 /** Legacy Google Maps URL; prefer googleMapsUrl for new configurations. */
 mapUrl?: string;
 wazeUrl?: string;
 directions?: string;
 navigationEnabled?: boolean;
}
