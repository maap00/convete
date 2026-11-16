import {activeInvitation} from './active-view.ts';
import { realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { getInvitationPhotos } from './validation.ts';
import { resolveTheme } from '../../themes/registry.ts';
import type { WeddingInvitation } from './types';
/** Server/build-only check, separate from pure validation and UI components. */
export function validateInvitationAssets(invitation: WeddingInvitation, publicRoot = resolve('public'),options:{previewOptional?:boolean}={}): void {
 invitation=activeInvitation(invitation);
 const root = realpathSync(publicRoot);
 const assets = [...getInvitationPhotos(invitation).map(photo=>photo.src), ...Object.values(resolveTheme(invitation.theme,invitation.personalization).assets), ...(options.previewOptional?[]:[invitation.seo.image ?? `/invitations/${invitation.slug}/social.jpg`])].filter((path): path is string=>Boolean(path));
 for (const path of new Set(assets)) {
  try {
   const file = realpathSync(resolve(root,`.${path}`));
   if (!file.startsWith(root+sep) || !statSync(file).isFile()) throw new Error('no es archivo local');
  } catch { throw new Error(`[${invitation.slug}] assets: recurso local inexistente o fuera de public: ${path}`); }
 }
}
