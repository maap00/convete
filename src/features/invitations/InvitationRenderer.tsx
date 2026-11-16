import Image from 'next/image';
import type { ReactNode } from 'react';
import type { WeddingInvitation, SectionId } from './types';
import { validateInvitation } from './validation';
import { resolveTheme } from '@/themes/registry';
import { getVisibleSections, getVenueVisibility } from './sections';
import { formatEventDate } from '@/lib/dates';
import { Section } from '@/components/ui/Section';
import { Welcome, Venues, Gallery, Itinerary, DressCode, Gifts } from '@/components/wedding/Sections';
import { Rsvp } from '@/components/wedding/Rsvp';
import { Countdown } from '@/components/wedding/Countdown';
import { Reveal } from '@/components/wedding/Reveal';
import { BotanicalDecoration, Sprig } from '@/components/ui/BotanicalDecoration';
import { ActionLink } from '@/components/ui/ActionLink';
import { Icon } from '@/components/ui/Icon';
export function InvitationRenderer({ invitation }: { invitation: WeddingInvitation }) {
 validateInvitation(invitation,{activeOnly:true});
 const theme = resolveTheme(invitation.theme, invitation.personalization);
 const visibleSections = getVisibleSections(invitation);
 const venueVisibility = getVenueVisibility(invitation);
 const { timeZone } = invitation.event;
 const hasRsvp = visibleSections.some(section => section.id === 'rsvp');
 const sections: Record<SectionId, { title: string; content: ReactNode }> = {
  welcome: { title: 'Nuestra historia', content: <Welcome messages={invitation.messages} photo={invitation.storyPhoto}/> },
  countdown: { title: 'Falta para nuestra boda', content: <Countdown startsAt={invitation.event.startsAt}/> },
  venues: { title: 'La celebración', content: <Venues ceremony={invitation.ceremony} reception={invitation.reception} timeZone={timeZone} visibility={venueVisibility}/> },
  gallery: { title: 'Galería', content: <Gallery photos={invitation.photos}/> },
  itinerary: { title: 'Itinerario del día', content: <Itinerary items={invitation.itinerary} timeZone={timeZone}/> },
  dressCode: { title: 'Código de vestimenta', content: <DressCode dressCode={invitation.dressCode}/> },
  gifts: { title: 'Lista de regalos', content: <Gifts gifts={invitation.gifts}/> },
  rsvp: { title: 'Confirma tu asistencia', content: <Rsvp rsvp={invitation.rsvp} eventLabel={invitation.rsvp.eventLabel ?? `${invitation.couple.first} y ${invitation.couple.second}`}/> }
 };
 return <div className={theme.className} style={theme.style} data-icons={theme.icons}>
  <a className="skip-link" href="#invitation-content">Saltar al contenido</a>
  <main id="invitation-content" className="invitation-paper">
   {theme.assets.background && <Image className="invitation-background" src={theme.assets.background} fill sizes="(min-width: 768px) 760px, 100vw" alt="" aria-hidden="true"/>}
   <header className="invitation-header">
    <BotanicalDecoration src={theme.assets.corner} className="cover-floral-top" eager/>
    <BotanicalDecoration src={theme.assets.corner} className="cover-floral-bottom"/>
    <div className="cover-content"><p className="eyebrow">NUESTRA BODA</p><div className="heart-divider"><Icon name="heart"/></div>
    <h1 className="couple-names"><span>{invitation.couple.first} <span className="ampersand">&amp;</span></span><span>{invitation.couple.second}</span></h1>
    <p className="romantic-copy">{invitation.messages.romantic ?? invitation.messages.welcome}</p>
    <div className="wedding-date"><Icon name="calendar"/><time dateTime={invitation.event.startsAt}>{formatEventDate(invitation.event.startsAt, timeZone).replace(',', ' ·')}</time></div>
    {hasRsvp && <ActionLink href="#rsvp" primary><Icon name="check"/>Confirmar asistencia</ActionLink>}
    <a className="scroll-indicator" href={visibleSections[0] ? `#${visibleSections[0].id}` : '#closing'} aria-label="Descubrir la invitación"><Icon name="chevron"/></a>
    </div>
   </header>
   <div className="invitation-sections">{visibleSections.map(({ id }) => <Section key={id} id={id} title={sections[id].title} ornament={theme.assets.ornament} variant={theme.variants.section}>{sections[id].content}</Section>)}</div>
   <footer className="invitation-footer" id="closing">
    <BotanicalDecoration src={theme.assets.corner} className="footer-floral-left"/><BotanicalDecoration src={theme.assets.corner} className="footer-floral-right"/>
    <div className="heart-divider"><Icon name="heart"/></div><p className="thank-you">¡Gracias!</p><p className="closing-copy">{invitation.messages.thankYou ?? invitation.messages.closing}</p>{invitation.guestInstructions&&<p className="fine-copy">{invitation.guestInstructions}</p>}<p className="signature">{invitation.couple.first} &amp; {invitation.couple.second}</p><Sprig src={theme.assets.ornament}/>
    <p className="brand-credit"><span>un diseño de</span><a href="https://maap00.world">maap00.world</a></p>
    {invitation.demoNotice && <aside className="demo-notice">{invitation.demoNotice}</aside>}
   </footer><Reveal/>
  </main>
 </div>;
}
