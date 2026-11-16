import type { WeddingInvitation } from '../types';
const mainPhoto = { src: '/invitations/ana-carlos/photos/main.webp', alt: 'Mesa de boda con flores, fotografía ilustrativa de la demo.', width: 1000, height: 667 };
export const anaCarlos = {
 id: 'demo-ana-carlos', slug: 'ana-carlos', couple: { first: 'Ana', second: 'Carlos' },
 event: { startsAt: '2027-09-25T17:30:00-04:00', timeZone: 'America/Caracas' },
 messages: {
  title: 'Jardín Eterno · Una tarde entre flores', welcome: 'Queremos celebrar contigo todo lo que está por venir.',
  romantic: 'Entre flores y nuevos comienzos, elegimos caminar juntos.', story: 'Una conversación inesperada nos trajo hasta aquí. Hoy comienza nuestra aventura más bonita.',
  closing: 'Gracias por celebrar el amor con nosotros.', thankYou: 'Hay días que se vuelven inolvidables gracias a quienes los comparten. Gracias por ser parte del nuestro.'
 },
 storyPhoto: mainPhoto,
 ceremony: { name: 'Jardín de las Rosas (ficticio)', address: 'Caracas · dirección ficticia', startsAt: '2027-09-25T17:30:00-04:00', photo: { src: '/invitations/ana-carlos/photos/ceremony.webp', alt: 'Ramo blanco de demostración para la ceremonia.', width: 800, height: 533 } },
 reception: { name: 'Terraza Magnolia (ficticia)', address: 'Caracas · dirección ficticia', startsAt: '2027-09-25T19:00:00-04:00', photo: mainPhoto },
 photos: [mainPhoto, { src: '/invitations/ana-carlos/photos/celebration.webp', alt: 'Pastel con flores, fotografía de demostración.', width: 800, height: 1200 }],
 itinerary: [{ id: 'ceremony', title: 'Ceremonia al atardecer', startsAt: '2027-09-25T17:30:00-04:00', icon: 'rings' }],
 dressCode: { title: 'Elegancia entre flores', description: 'Tonos suaves y calzado cómodo para el jardín.', palette: [{name:'Rosa antiguo',color:'#854E59'},{name:'Champagne',color:'#C9B58A'}] },
 gifts: { message: 'Compartir este día contigo es nuestro mejor regalo.' },
 rsvp: { enabled: false, deadline: '2027-09-01T23:59:00-04:00', message: 'Esta invitación es una demostración sin envío de respuestas.', maxCompanions: 2 },
 theme: 'botanical',
 personalization: { palette: 'rose', typography: 'classic', ornament: 'minimal', icons: 'soft', variant: 'outlined', assets: { corner: '/invitations/ana-carlos/ornaments/sprig.svg', ornament: '/invitations/ana-carlos/ornaments/sprig.svg', background: '/invitations/ana-carlos/backgrounds/paper.svg' } },
 sections: [
  {id:'welcome',enabled:true},{id:'countdown',enabled:true},
  {id:'venues',enabled:true,ceremony:true,reception:false},
  {id:'itinerary',enabled:false},{id:'gallery',enabled:true},
  {id:'dressCode',enabled:true},{id:'gifts',enabled:false},{id:'rsvp',enabled:false}
 ],
 seo: {title:'Ana y Carlos · Una tarde entre flores',description:'Segunda demostración de Convete: una boda ficticia en tonos rosa antiguo.',noIndex:true},
 demoNotice:'Invitación de demostración · Ana y Carlos, lugares y fechas ficticios. Fotografías ilustrativas.'
} satisfies WeddingInvitation;
