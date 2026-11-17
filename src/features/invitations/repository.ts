import {canExposeInvitation} from './public-policy.ts';
import { invitationRegistry } from './registry.ts';
import type { WeddingInvitation } from './types';
import { isInvitationSlug, validateInvitationRegistry } from './validation.ts';
import { validateInvitationAssets } from './validate-assets.ts';
validateInvitationRegistry(invitationRegistry,{activeOnly:true});
invitationRegistry.forEach(invitation=>validateInvitationAssets(invitation,undefined,{previewOptional:!process.env.CONVETE_PUBLIC_ORIGIN}));
export function getInvitation(slug: string): WeddingInvitation | undefined {
 // Return independent copies so one consumer cannot mutate another request's config.
 const value = isInvitationSlug(slug) && canExposeInvitation(slug,process.env) ? invitationRegistry.find(invitation=>invitation.slug === slug) : undefined;
 return value ? structuredClone(value) : undefined;
}
export function getInvitationSlugs(): string[] { return invitationRegistry.filter(invitation=>canExposeInvitation(invitation.slug,process.env)).map(invitation=>invitation.slug); }
