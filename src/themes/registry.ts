import { resolvePersonalization, type ThemePersonalization } from "./personalization.ts";
import type { ThemeId } from '../features/invitations/types';
export interface InvitationTheme {
 className: string;
 assets: { ornament: string; corner: string; background?: string };
 variants: { section: 'plain' | 'outlined' };
}
export const themes = {
 botanical: { className: 'theme-botanical', assets: { ornament: '/themes/botanical/sprig.svg', corner: '/themes/botanical/floral-corner.webp' }, variants: { section: 'plain' } }
} satisfies Record<ThemeId, InvitationTheme>;

/** Pure resolver; default options preserve the approved botanical design. */
export function resolveTheme(id: ThemeId, personalization?: ThemePersonalization) {
 if (!Object.hasOwn(themes,id)) throw new Error(`theme: tema desconocido «${id}»`);
 const base = themes[id];
 const options = resolvePersonalization(personalization);
 const assets = { ...base.assets, ...(options.ornament === 'minimal' ? { corner: '/themes/botanical/sprig.svg' } : {}), ...options.assets };
 const style: Record<`--${string}`, string> = {
  '--theme-primary': options.colors.primary, '--theme-muted': options.colors.secondary,
  '--theme-background': options.colors.background, '--theme-surface': options.colors.surface,
  '--theme-text': options.colors.text, '--theme-border': options.colors.border,
  '--theme-accent': options.colors.accent, '--theme-canvas': options.colors.canvas,
  '--font-heading': options.fonts.heading, '--font-body': options.fonts.body, '--font-script': options.fonts.script
 };
 return { ...base, assets, style, icons: options.icons, variants: { section: options.variant } };
}
