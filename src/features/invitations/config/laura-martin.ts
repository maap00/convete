import { weddingAssets } from "./assets.ts";
import type { WeddingInvitation } from "../types";
export const lauraMartin = {
  id: "demo-laura-martin", slug: "laura-martin",
  couple: { first: "Laura", second: "Martín" },
  event: { startsAt: "2027-04-17T16:00:00-04:00", timeZone: "America/Caracas" },
  messages: { title: "Jardín Eterno", welcome: "Nos ilusiona compartir este día contigo.", closing: "Gracias por acompañarnos en esta nueva etapa.", romantic: "Te invitamos a compartir con nosotros este día tan especial", story: "Un camino que comenzó con una gran amistad, se convirtió en amor y hoy nos lleva a este nuevo capítulo.", thankYou: "Por ser parte de nuestra historia y acompañarnos en este día inolvidable." },
  ceremony: { name: "Jardín de los Olivos (ficticio)", address: "Avenida de las Flores, Caracas · dirección ficticia", startsAt: "2027-04-17T16:00:00-04:00", photo: weddingAssets.ceremony },
  reception: { name: "Casa Botánica (ficticia)", address: "Camino del Jardín, Caracas · dirección ficticia", startsAt: "2027-04-17T18:00:00-04:00", photo: weddingAssets.reception },
  storyPhoto: weddingAssets.couple,
  photos: [weddingAssets.bouquet, weddingAssets.rings, weddingAssets.cake, weddingAssets.reception, weddingAssets.ceremony, weddingAssets.couple],
  itinerary: [
    { id: "ceremony", icon: "rings", title: "Ceremonia", startsAt: "2027-04-17T16:00:00-04:00" },
    { id: "reception", icon: "camera", title: "Recepción", startsAt: "2027-04-17T18:00:00-04:00" },
    { id: "dinner", icon: "dinner", title: "Cena", startsAt: "2027-04-17T19:00:00-04:00" },
    { id: "party", icon: "music", title: "Fiesta y celebración", startsAt: "2027-04-17T21:00:00-04:00" },
    { id: "cake", icon: "cake", title: "Corte de la torta", startsAt: "2027-04-18T00:00:00-04:00" }
  ],
  dressCode: { title: "Formal / Elegante", description: "Te sugerimos calzado cómodo para caminar sobre césped.", palette: [{ name: "Verde oliva", color: "#596B3B" }, { name: "Champagne", color: "#C9B58A" }, { name: "Marfil", color: "#EADCC2" }] },
  gifts: { message: "Tu presencia es nuestro mejor regalo, pero si deseas hacernos un obsequio, lo recibiremos con mucho cariño." },
  rsvp: { enabled: false, deadline: "2027-04-01T23:59:00-04:00", message: "La confirmación por WhatsApp estará disponible próximamente." },
  theme: "botanical",
  sections: [
    { id: "welcome", enabled: true }, { id: "countdown", enabled: true }, { id: "venues", enabled: true },
    { id: "itinerary", enabled: true }, { id: "gallery", enabled: true },
    { id: "dressCode", enabled: true }, { id: "gifts", enabled: true }, { id: "rsvp", enabled: true }
  ],
  seo: { title: "Laura y Martín · Jardín Eterno", description: "Demostración técnica de una invitación de boda reutilizable. Datos ficticios.", noIndex: true },
  demoNotice: "Invitación de demostración · Datos ficticios y fotografías ilustrativas. RSVP sin envíos."
} satisfies WeddingInvitation;
