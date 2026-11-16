import assert from 'node:assert/strict';
const base = process.argv[2] ?? 'http://127.0.0.1:3100';
for (const [slug,name,primary,sections] of [
 ['laura-martin','Laura','#596B3B',['welcome','countdown','venues','itinerary','gallery','dressCode','gifts','rsvp']],
 ['ana-carlos','Ana','#854E59',['welcome','countdown','venues','gallery','dressCode']]
]) {
 const response = await fetch(`${base}/invitacion/${slug}`);
 assert.equal(response.status,200);
 const html = await response.text();
 assert.match(html,new RegExp(`<title>${name} y `));
 assert.ok(html.includes(`--theme-primary:${primary}`));
 for (const id of ['welcome','countdown','venues','itinerary','gallery','dressCode','gifts','rsvp']) assert.equal(html.includes(`id="${id}"`),sections.includes(id),`${slug}: ${id}`);
 assert.ok(html.includes('id="closing"')); assert.ok(html.includes('class="invitation-header"'));
 assert.ok(!html.includes('class="location-link"'),`${slug}: no active fictitious map links`);
 assert.ok(!html.includes('>Ver lista de regalos<'),`${slug}: no fictitious registry action`);
 assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
 assert.ok(html.includes('property="og:locale" content="es_VE"'));
 assert.ok(html.includes('noindex'));  assert.ok(!html.includes('https://wa.me/'));
 assert.equal(html.includes('<form'),slug==='laura-martin');
 if(slug==='laura-martin') { assert.ok(!/type="radio"[^>]*checked/.test(html)); assert.ok(html.includes('maxLength="100"')); }
 if (slug==='ana-carlos') { assert.ok(!html.includes('laura-martin')); assert.ok(!html.includes('>Recepción<')); assert.ok(!html.includes('href="#rsvp"')); assert.ok(html.includes('paper.svg')); }
 else { assert.ok(html.includes('>Recepción<')); assert.ok(html.includes('Confirmar por WhatsApp')); }
 const preview = await fetch(`${base}/invitations/${slug}/social.jpg`); assert.equal(preview.status,200); assert.match(preview.headers.get('content-type')??'',/image\/jpeg/);
 console.log(`PASS /invitacion/${slug}: SEO, tema, contenido y secciones`);
}
const missing = await fetch(`${base}/invitacion/no-existe`); assert.equal(missing.status,404); console.log('PASS slug inexistente: 404');

const intake = await fetch(`${base}/solicitar-invitacion`); assert.equal(intake.status,200);
const intakeHTML = await intake.text();
assert.match(intakeHTML, /Creemos su invitación/);assert.match(intakeHTML, /request-step-title/);
assert.match(intakeHTML, /noindex/);assert.match(intakeHTML, /Correo de contacto/);
assert.match(intakeHTML, /Sus datos se preparan localmente/);assert.ok(!/action="https?:/.test(intakeHTML));
console.log('PASS /solicitar-invitacion: formulario local, SEO y privacidad');
