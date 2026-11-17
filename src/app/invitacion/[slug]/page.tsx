import type { Metadata } from "next";
import { metadataForEnvironment } from "@/features/invitations/metadata";
import { notFound } from "next/navigation";
import { getInvitation, getInvitationSlugs } from "@/features/invitations/repository";
import { InvitationRenderer } from "@/features/invitations/InvitationRenderer";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return getInvitationSlugs().map(slug => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invitation = getInvitation((await params).slug);
  if (!invitation) notFound();
  return metadataForEnvironment(invitation, process.env);
}
export default async function InvitationPage({ params }: Props) {
  const invitation = getInvitation((await params).slug);
  if (!invitation) notFound();
  return <InvitationRenderer invitation={invitation}/>;
}
