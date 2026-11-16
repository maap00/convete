import Link from "next/link";
import { getInvitationSlugs } from "@/features/invitations/repository";
export default function Home() { return <main className="container"><h1>Invitaciones digitales</h1><p>Base técnica de maap00.world. Vista preliminar sin diseño final.</p><ul>{getInvitationSlugs().map(slug => <li key={slug}><Link className="action-link" href={`/invitacion/${slug}`}>Ver demostración: {slug}</Link></li>)}</ul></main>; }
