import test from 'node:test';
import type { WeddingInvitation } from '../src/features/invitations/types';
import assert from 'node:assert/strict';
import { invitationMetadata, publicOrigin } from '../src/features/invitations/metadata.ts';
import { lauraMartin } from '../src/features/invitations/config/laura-martin.ts';
import { anaCarlos } from '../src/features/invitations/config/ana-carlos.ts';
test('local metadata never invents a public origin or social image URL',()=>{
 const result=invitationMetadata(lauraMartin);
 assert.equal(result.alternates,undefined); assert.equal(result.openGraph?.images,undefined);
 assert.match(JSON.stringify(result.twitter),/summary_large_image/); assert.deepEqual(result.robots,{index:false,follow:false});
});
test('public metadata has independent canonical, preview and title per invitation',()=>{
 for(const invitation of [lauraMartin,anaCarlos]) {
 const result=invitationMetadata(invitation,'https://invitaciones.example.com');
 assert.equal(result.title,invitation.seo.title);
 assert.deepEqual(result.alternates,{canonical:`https://invitaciones.example.com/invitacion/${invitation.slug}`});
 assert.match(JSON.stringify(result.openGraph),new RegExp(`${invitation.slug}/social.jpg`));
 assert.match(JSON.stringify(result.twitter),/1200/);
 }
});
test('indexing can be enabled independently without mutating private demos',()=>{
 const invitation: WeddingInvitation=structuredClone(anaCarlos);invitation.seo.noIndex=false;
 assert.deepEqual(invitationMetadata(invitation).robots,{index:true,follow:true});
 assert.deepEqual(invitationMetadata(lauraMartin).robots,{index:false,follow:false});
});
test('public origin rejects local, insecure and ambiguous configuration',()=>{
 for(const value of ['http://example.com','https://localhost','https://127.0.0.1','https://192.168.0.1','https://host.local',' https://example.com','https://example.com/path','https://user:pass@example.com','https://example.com?x=1','invalid']) assert.throws(()=>publicOrigin(value));
 assert.equal(publicOrigin('https://example.com/'),'https://example.com');
});

test('an explicitly empty social asset is a configuration error',async()=>{
 const {validateInvitation}=await import('../src/features/invitations/validation.ts');
 const invitation: WeddingInvitation=structuredClone(lauraMartin);invitation.seo.image='';
 assert.throws(()=>validateInvitation(invitation),/seo.image/);
});
