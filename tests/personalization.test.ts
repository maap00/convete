import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getInvitation, getInvitationSlugs } from '../src/features/invitations/repository.ts';
import { validateInvitation, validateInvitationRegistry, isSafeUrl } from '../src/features/invitations/validation.ts';
import { validateInvitationAssets } from '../src/features/invitations/validate-assets.ts';
import { getVisibleSections, getVenueVisibility } from '../src/features/invitations/sections.ts';
import { resolveTheme } from '../src/themes/registry.ts';
import { resolvePersonalization, palettes } from '../src/themes/personalization.ts';
import type { WeddingInvitation } from '../src/features/invitations/types.ts';
const laura = () => getInvitation('laura-martin')!;
const ana = () => getInvitation('ana-carlos')!;

test('registry resolves both slugs and returns undefined for unknown or unsafe paths', () => {
 assert.deepEqual(getInvitationSlugs().slice(0,2),['laura-martin','ana-carlos']);
 assert.equal(new Set(getInvitationSlugs()).size,getInvitationSlugs().length);
 assert.equal(ana().couple.first,'Ana');
 for (const slug of ['unknown','../laura-martin','Laura-Martin','constructor','__proto__']) assert.equal(getInvitation(slug),undefined);
});
test('registry rejects duplicate slugs and duplicate ids independently', () => {
 assert.throws(()=>validateInvitationRegistry([laura(),{...laura(),id:'other'}]),/registry/);
 const other = ana(); other.id = laura().id;
 assert.throws(()=>validateInvitationRegistry([laura(),other]),/registry/);
});
test('approved Laura configuration remains unchanged from phase 1', () => {
 const {mode,...approvedContent}=laura();assert.equal(mode,'demo');assert.deepEqual(approvedContent,JSON.parse(readFileSync(new URL('./fixtures/laura-martin.json',import.meta.url),'utf8')));
 const theme = resolveTheme('botanical');
 assert.equal(theme.style['--theme-primary'],'#596B3B');
 assert.equal(theme.style['--theme-background'],'#F8F5EF');
 assert.equal(theme.assets.corner,'/themes/botanical/floral-corner.webp');
 assert.equal(theme.variants.section,'plain');
 assert.deepEqual(getVisibleSections(laura()).map(s=>s.id),['welcome','countdown','venues','itinerary','gallery','dressCode','gifts','rsvp']);
});
test('configurations and each repository result remain independent', () => {
 const first = laura(); first.couple.first='Changed'; first.ceremony.name='Changed';
 assert.equal(laura().couple.first,'Laura'); assert.notEqual(laura().ceremony.name,'Changed');
 assert.equal(ana().couple.first,'Ana'); assert.equal(laura().personalization,undefined);
 const result = resolveTheme(ana().theme,ana().personalization); result.style['--theme-primary']='#000000';
 assert.equal(resolveTheme('botanical',ana().personalization).style['--theme-primary'],'#854E59');
});
test('visibility omits disabled sections and independently selects ceremony/reception', () => {
 const invitation = ana();
 assert.deepEqual(getVisibleSections(invitation).map(s=>s.id),['welcome','countdown','venues','gallery','dressCode']);
 assert.deepEqual(getVenueVisibility(invitation),{ceremony:true,reception:false});
 invitation.sections=[{id:'venues',enabled:true,ceremony:false,reception:true}];
 assert.deepEqual(getVenueVisibility(invitation),{ceremony:false,reception:true});
 invitation.sections=[{id:'venues',enabled:true,ceremony:false,reception:false}];
 assert.deepEqual(getVisibleSections(invitation),[]);
 invitation.sections=[{id:'gallery',enabled:true},{id:'itinerary',enabled:true}]; invitation.photos=[]; invitation.itinerary=[];
 assert.deepEqual(getVisibleSections(invitation),[]);
});
test('disabled fields and malformed section settings are diagnosed', () => {
 const value = ana();
 value.sections=[{id:'invalid',enabled:true}] as unknown as WeddingInvitation['sections'];
 assert.throws(()=>validateInvitation(value),/\[ana-carlos\] sections/);
 value.sections=[{id:'venues',enabled:true,ceremony:'yes'}] as unknown as WeddingInvitation['sections'];
 assert.throws(()=>validateInvitation(value),/sections.venues.ceremony/);
});
test('theme defaults, presets, typography, ornaments, icons, backgrounds and colors resolve', () => {
 for (const palette of ['olive','rose'] as const) assert.doesNotThrow(()=>resolvePersonalization({palette}));
 const theme = resolveTheme('botanical',ana().personalization);
 assert.equal(theme.style['--theme-primary'],palettes.rose.primary);
 assert.equal(theme.style['--font-heading'],'Georgia, serif');
 assert.equal(theme.icons,'soft'); assert.equal(theme.variants.section,'outlined');
 assert.match(theme.assets.background!,/ana-carlos\/backgrounds/);
 assert.equal(resolveTheme('botanical',{colors:{primary:'#445533'}}).style['--theme-primary'],'#445533');
 const invalid = {theme:'unknown'} as unknown as WeddingInvitation;
 assert.throws(()=>resolveTheme(invalid.theme),/desconocido/);
 for (const value of [{palette:'unknown'},{typography:'unknown'},{icons:'unknown'},{variant:'unknown'},{ornament:'unknown'}]) assert.throws(()=>resolvePersonalization(value as never),/desconocida/);
});
test('theme validation rejects unreadable combinations and arbitrary CSS payloads', () => {
 for (const colors of [{primary:'#FFFFFF'},{text:'#F8F5EF'},{background:'#000000'},{primary:'red'},{border:'url(https://example.com)'},{text:'#123'}]) assert.throws(()=>resolvePersonalization({colors}));
});
test('all registered asset references exist; missing resources and cross-invitation paths fail', () => {
 for (const invitation of [laura(),ana()]) assert.doesNotThrow(()=>validateInvitationAssets(invitation));
 const value=ana(); value.storyPhoto={...value.storyPhoto!,src:'/invitations/ana-carlos/photos/missing.webp'};
 assert.throws(()=>validateInvitationAssets(value),/ana-carlos.*missing.webp/);
 for (const src of ['/invitations/laura-martin/photos/couple.webp','/invitations/ana-carlos/../secret.webp','/invitations/ana-carlos/%2e%2e/file.webp','https://example.com/a.webp']) {
  value.storyPhoto={...value.storyPhoto!,src}; assert.throws(()=>validateInvitation(value),/photos/);
 }
});
test('mandatory fields, dates, URLs, quantities, SEO and graphic references are validated', () => {
 const badDate=ana();badDate.event.startsAt='2027-02-29T12:00:00-04:00';assert.throws(()=>validateInvitation(badDate),/event.startsAt/);
 const badName=ana();badName.couple.second=' ';assert.throws(()=>validateInvitation(badName),/couple.second/);
 const badTimeZone=ana();badTimeZone.event.timeZone='';assert.throws(()=>validateInvitation(badTimeZone),/event.timeZone/);
 for (const value of [-1,1.5,21,NaN,Infinity]) { const invalid=ana();invalid.rsvp.maxCompanions=value;assert.throws(()=>validateInvitation(invalid),/rsvp.maxCompanions/); }
 for (const url of ['javascript:alert(1)','http://example.com','https://user:password@example.com','https://example.com/a b']) { assert.equal(isSafeUrl(url),false);const invalid=ana();invalid.gifts.url=url;assert.throws(()=>validateInvitation(invalid),/gifts.url/); }
 assert.equal(isSafeUrl('https://example.com/list?event=wedding'),true);
 const badSeo=ana();badSeo.seo.image='/invitations/other/image.webp';assert.throws(()=>validateInvitation(badSeo),/seo.image/);
 const badAsset=ana();badAsset.personalization={assets:{corner:'https://example.com/a.svg'}};assert.throws(()=>validateInvitation(badAsset),/assets.corner/);
 const badPhoto=ana();badPhoto.storyPhoto={...badPhoto.storyPhoto!,width:NaN};assert.throws(()=>validateInvitation(badPhoto),/photos/);
});
