import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:3100',slug=process.argv[3];
assert.ok(slug&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),'Indica el slug generado: node scripts/verify-generated-http.mjs BASE SLUG. La fixture histórica fue archivada.');
const config=JSON.parse(await readFile(`data/invitations/${slug}/invitation.json`,'utf8'));
const response=await fetch(`${base}/invitacion/${slug}`);assert.equal(response.status,200);const html=await response.text();
for(const name of [config.couple.first,config.couple.second])assert.ok(html.includes(name));
for(const s of config.sections)if(s.id!=='gallery'||config.photos.length)assert.equal(html.includes(`id="${s.id}"`),s.enabled,s.id);
assert.ok(html.includes('id="closing"'));assert.ok(!html.includes('pareja@example.com'));
if(config.mode==='demo'){assert.ok(html.includes('disabled'));if(config.rsvp.phone)assert.ok(!html.includes(config.rsvp.phone));}
if(config.storyPhoto){const image=await fetch(base+config.storyPhoto.src);assert.equal(image.status,200);assert.match(image.headers.get('content-type')??'',/image\//);}
for(const file of ['invitation.json','preparation-report.json'])assert.equal((await fetch(`${base}/invitations/${slug}/${file}`)).status,404);
console.log(`PASS ${slug}: registro privado, ruta, motor, secciones, recursos y modo demo sin acción real.`);
