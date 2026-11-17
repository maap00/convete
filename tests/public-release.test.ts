import test from 'node:test';
import assert from 'node:assert/strict';
import {publicDemoMode,publicPathAllowed,publicRequestAllowed,canExposeInvitation,validateReleaseEnvironment} from '../src/features/invitations/public-policy.ts';
import {invitationMetadata} from '../src/features/invitations/metadata.ts';
import {builtInInvitations} from '../src/features/invitations/builtins.ts';
import nextConfig from '../next.config.ts';
const prod={VERCEL_ENV:'production',CONVETE_PUBLIC_ORIGIN:'https://convete.vercel.app'};
test('Vercel Production and Preview limit public demo routes to the included demos without changing local fixtures',()=>{
 for(const env of [prod,{VERCEL_ENV:'preview'},{CONVETE_PUBLIC_DEMO:'true'}]){assert.equal(publicDemoMode(env),true);for(const i of builtInInvitations)assert.equal(canExposeInvitation(i.slug,env),true);assert.equal(canExposeInvitation('fixture-generador-local',env),false);assert.equal(canExposeInvitation('cliente-real',env),false);}
 assert.equal(canExposeInvitation('fixture-generador-local',{}),true);assert.equal(canExposeInvitation('cliente-real',{...prod,CONVETE_PUBLIC_DEMO:'false'}),true);
});
test('configuration, reports, checklists and approvals cannot be downloaded even in local mode',()=>{
 for(const env of [{},prod])for(const path of ['/invitations/laura-martin/invitation.json','/invitations/fixture-generador-local/preparation-report.json','/invitations/laura-martin/README.md','/invitations/laura-martin/handoff.txt','/.convete/approvals/demo/a.json'])assert.equal(publicPathAllowed(path,env),false,path);
});
test('normal demo photos and decorations stay public; production fixture photos and routes do not',()=>{
 for(const path of ['/invitacion/laura-martin','/invitacion/ana-carlos','/invitations/laura-martin/photos/couple.webp','/themes/botanical/sprig.svg','/solicitar-invitacion'])assert.equal(publicPathAllowed(path,prod),true);
 assert.equal(publicPathAllowed('/invitacion/fixture-generador-local',prod),false);assert.equal(publicPathAllowed('/invitations/fixture-generador-local/photos/main-01.webp',prod),false);assert.equal(publicPathAllowed('/invitations/fixture-generador-local/photos/main-01.webp',{}),true);
});
test('encoded paths and image optimisation cannot bypass the public asset policy',()=>{
 for(const path of ['/invitations/laura-martin/%69nvitation.json','/invitations/laura-martin/%2569nvitation.json','/invitations/laura-martin/../secret.webp','/invitations/laura-martin/%5csecret.webp','/invitations/laura-martin/%00.webp'])assert.equal(publicPathAllowed(path,prod),false);
 for(const url of ['/invitations/fixture-generador-local/photos/main-01.webp','https://convete.vercel.app/invitations/fixture-generador-local/photos/main-01.webp','/invitations/laura-martin/invitation.json'])assert.equal(publicRequestAllowed('/_next/image',url,prod),false);
 assert.equal(publicRequestAllowed('/_next/image','/invitations/laura-martin/photos/couple.webp',prod),true);
});
test('Production requires an explicit valid HTTPS origin; local builds never invent it',()=>{
 assert.throws(()=>validateReleaseEnvironment({VERCEL_ENV:'production'}),/CONVETE_PUBLIC_ORIGIN/);validateReleaseEnvironment({});validateReleaseEnvironment(prod);
 for(const origin of ['http://convete.vercel.app','https://user:secret@convete.vercel.app','https://convete.vercel.app/path'])assert.throws(()=>validateReleaseEnvironment({...prod,CONVETE_PUBLIC_ORIGIN:origin}));
 assert.throws(()=>validateReleaseEnvironment({CONVETE_PUBLIC_DEMO:'yes'}));
});
test('public metadata uses separate absolute social images, canonical and noindex for each demo',()=>{
 for(const i of builtInInvitations){const m=invitationMetadata(i,prod.CONVETE_PUBLIC_ORIGIN);assert.equal(m.alternates?.canonical,`${prod.CONVETE_PUBLIC_ORIGIN}/invitacion/${i.slug}`);assert.match(JSON.stringify(m.openGraph),new RegExp(`https://convete.vercel.app/invitations/${i.slug}/social.jpg`));assert.deepEqual(m.robots,{index:false,follow:false});assert.ok(!JSON.stringify(m).includes(i.slug==='laura-martin'?'ana-carlos':'laura-martin'));}
});
test('security headers add MIME, referrer, frame and permission restrictions without a speculative CSP',async()=>{
 const groups=await nextConfig.headers!();const headers=Object.fromEntries(groups[0].headers.map(h=>[h.key,h.value]));assert.equal(headers['X-Content-Type-Options'],'nosniff');assert.equal(headers['Referrer-Policy'],'strict-origin-when-cross-origin');assert.equal(headers['X-Frame-Options'],'SAMEORIGIN');assert.match(headers['Permissions-Policy'],/geolocation=\(\)/);assert.equal(headers['Content-Security-Policy'],undefined);
});
