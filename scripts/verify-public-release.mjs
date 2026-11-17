import assert from 'node:assert/strict';
const base=process.argv[2]??'http://127.0.0.1:3102',origin=process.argv[3]??'https://convete.vercel.app';
for(const slug of ['laura-martin','ana-carlos']){
 const response=await fetch(`${base}/invitacion/${slug}`);assert.equal(response.status,200);const html=await response.text();
 assert.ok(html.includes(`rel="canonical" href="${origin}/invitacion/${slug}"`));assert.ok(html.includes(`property="og:image" content="${origin}/invitations/${slug}/social.jpg"`));assert.ok(html.includes(`property="og:url" content="${origin}/invitacion/${slug}"`));assert.ok(html.includes('noindex'));
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('x-frame-options'),'SAMEORIGIN');console.log(`PASS ${slug}: 200, canonical, OG propios, noindex y cabeceras`);
 const photo=await fetch(`${base}/invitations/${slug}/social.jpg`);assert.equal(photo.status,200);assert.match(photo.headers.get('content-type')??'',/image\/jpeg/);
}
const home=await (await fetch(base)).text();assert.ok(!home.includes('fixture-generador-local'));
for(const path of ['/invitacion/fixture-generador-local','/invitacions/no-existe','/invitacion/no-existe','/invitations/fixture-generador-local/photos/main-01.webp','/invitations/fixture-generador-local/invitation.json','/invitations/fixture-generador-local/preparation-report.json','/invitations/laura-martin/README.md','/.convete/approvals/laura-martin','/_next/image?url=%2Finvitations%2Ffixture-generador-local%2Fphotos%2Fmain-01.webp&w=640&q=75']){const response=await fetch(base+path);assert.equal(response.status,404,path);console.log(`PASS bloqueo/404 ${path}`);}
const form=await fetch(`${base}/solicitar-invitacion`);assert.equal(form.status,200);assert.match(await form.text(),/Creemos su invitación/);
console.log('PASS formulario 200 y fixture ausente de portada. Solo verificación, sin publicación.');
