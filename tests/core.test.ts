import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInstant, formatEventDate, formatEventTime } from '../src/lib/dates.ts';
import { isRsvpOpen } from '../src/features/rsvp/deadline.ts';
import type { WeddingInvitation } from '../src/features/invitations/types.ts';
import { lauraMartin } from '../src/features/invitations/config/laura-martin.ts';
import { isInvitationSlug, validateInvitation, validateInvitationRegistry } from '../src/features/invitations/validation.ts';
const sample = (): WeddingInvitation => structuredClone(lauraMartin);
test('formats in event timezone, including a different calendar day', () => {
  assert.equal(formatEventDate('2027-04-18T02:00:00Z', 'America/Caracas'), 'sábado, 17 de abril de 2027');
  assert.match(formatEventTime('2027-04-18T02:00:00Z', 'America/Caracas'), /10:00/);
});
test('rejects ambiguous, impossible and normalized dates', () => {
  for (const value of ['2027-04-17', '2027-04-17T16:00:00', '2027-02-30T16:00:00-04:00', '2027-04-17T24:00:00Z', 'invalid']) assert.throws(() => parseInstant(value));
  assert.throws(() => formatEventDate('2027-04-17T16:00:00Z', 'Invalid/Zone'));
});
test('accepts leap dates and respects explicit offsets', () => {
  assert.equal(parseInstant('2028-02-29T16:00:00-04:00').toISOString(), '2028-02-29T20:00:00.000Z');
});
test('RSVP deadline is inclusive', () => {
  const deadline = '2027-04-01T23:59:00-04:00';
  assert.equal(isRsvpOpen(deadline, new Date('2027-04-02T03:59:00Z')), true);
  assert.equal(isRsvpOpen(deadline, new Date('2027-04-02T03:59:01Z')), false);
  assert.throws(() => isRsvpOpen(deadline, new Date('invalid')));
});
test('demo is valid and supports another configuration', () => {
  const another = sample(); another.id = 'another'; another.slug = 'otra-pareja';
  const movePhoto = (photo: NonNullable<WeddingInvitation['storyPhoto']>) => ({ ...photo, src: photo.src.replace('/laura-martin/', '/otra-pareja/') });
  another.photos = another.photos.map(movePhoto);
  if (another.storyPhoto) another.storyPhoto = movePhoto(another.storyPhoto);
  for (const venue of [another.ceremony, another.reception]) if (venue.photo) venue.photo = movePhoto(venue.photo);
  assert.doesNotThrow(() => validateInvitationRegistry([sample(), another]));
});
test('slugs reject traversal and unsupported characters', () => {
  assert.equal(isInvitationSlug('laura-martin'), true);
  for (const slug of ['../demo', 'Laura', '', 'a/b', '-demo', 'a--b']) assert.equal(isInvitationSlug(slug), false);
});
test('rejects duplicate invitations and section entries', () => {
  assert.throws(() => validateInvitationRegistry([sample(), sample()]));
  const value = sample(); value.sections = [...value.sections, value.sections[0]];
  assert.throws(() => validateInvitation(value));
});
test('rejects invalid timezone, deadline and itinerary', () => {
  const zone = sample(); zone.event.timeZone = 'Unknown/Zone'; assert.throws(() => validateInvitation(zone));
  const deadline = sample(); deadline.rsvp.deadline = '2028-01-01T00:00:00Z'; assert.throws(() => validateInvitation(deadline));
  const itinerary = sample(); itinerary.itinerary = [...itinerary.itinerary].reverse(); assert.throws(() => validateInvitation(itinerary));
});
test('rejects unsafe URLs and photo paths', () => {
  const link = sample(); link.gifts.url = 'javascript:alert(1)'; assert.throws(() => validateInvitation(link));
  const photo = sample(); photo.photos = [{ src: '/invitations/other/a.jpg', alt: 'Retrato', width: 800, height: 600 }]; assert.throws(() => validateInvitation(photo));
});

test('countdown clamps expired dates and splits days and time correctly', async () => {
 const { getCountdown } = await import('../src/lib/countdown.ts');
 const event = '2027-04-17T16:00:00-04:00';
 const instant = parseInstant(event).getTime();
 assert.deepEqual(getCountdown(event, instant - 90061000), { days: 1, hours: 1, minutes: 1, seconds: 1, expired: false });
 assert.deepEqual(getCountdown(event, instant + 1000), { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
 assert.equal(getCountdown(event, instant).expired, true);
 for (const now of [NaN, Infinity, -Infinity]) assert.throws(() => getCountdown(event, now));
});
