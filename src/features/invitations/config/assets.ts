import type { Photo } from '../types';
const photo = (name: string, alt: string, width = 1000, height = 1000): Photo => ({ src: `/invitations/laura-martin/photos/${name}.webp`, alt, width, height });
export const weddingAssets = {
  couple: photo('couple', 'Pareja de novios abrazándose al atardecer. Fotografía de demostración.', 1400, 689),
  ceremony: photo('ceremony-garden', 'Jardín preparado para una ceremonia de boda. Fotografía ilustrativa.', 800, 1200),
  reception: photo('reception', 'Mesas preparadas para una recepción de boda al aire libre.', 1000, 667),
  bouquet: photo('bouquet-white', 'Ramo de flores blancas y follaje de boda.', 800, 533),
  rings: photo('rings', 'Alianzas de boda sobre un soporte de joyería.', 800, 533),
  cake: photo('cake', 'Pastel de boda decorado con flores.', 800, 1200)
};
