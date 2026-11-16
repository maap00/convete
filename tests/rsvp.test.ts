import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWhatsAppPhone, validateRSVPInput, getRSVPAvailability, buildWhatsAppRSVPMessage, buildWhatsAppRSVPUrl, prepareWhatsAppRSVP } from '../src/features/rsvp/whatsapp.ts';
import { getInvitation } from '../src/features/invitations/repository.ts';
import { validateInvitation } from '../src/features/invitations/validation.ts';
import type { RSVPConfig, RSVPInput } from '../src/features/rsvp/types.ts';
// NANP 202-555-0123: reserved fictional fixture. Never navigated to or contacted by tests.
const fictionalPhone = '12025550123';
const now = new Date('2027-01-01T00:00:00Z');
const config: RSVPConfig = { enabled:true, phone:fictionalPhone, message:'Prueba local', maxCompanions:2 };
const context = {eventLabel:'Laura y Martín'};
const guest: RSVPInput = {name:'Juan Pérez',attendance:'yes',companions:0};
function validated(input: RSVPInput = guest, max=2) {
 const result = validateRSVPInput(input,max); assert.equal(result.valid,true);
 if (!result.valid) throw new Error('fixture inválido');
 return result.data;
}
test('RSVP rejects an empty guest name',()=>{
 for(const name of ['', '   ', '\t\n']) { const result=validateRSVPInput({...guest,name});assert.equal(result.valid,false);if(!result.valid)assert.match(result.errors.name!,/nombre/); }
});
test('RSVP accepts a valid guest name',()=>assert.equal(validated().name,'Juan Pérez'));
test('RSVP trims and collapses unnecessary name whitespace',()=>assert.equal(validated({...guest,name:'  Juan   Pérez  '}).name,'Juan Pérez'));
test('RSVP rejects more than 100 characters and accepts the boundary',()=>{
 assert.equal(validateRSVPInput({...guest,name:'a'.repeat(101)}).valid,false);
 assert.equal(validateRSVPInput({...guest,name:'a'.repeat(100)}).valid,true);
});
test('RSVP requires explicit attendance and rejects unexpected answers',()=>{
 for(const attendance of ['', 'maybe']) {const result=validateRSVPInput({...guest,attendance});assert.equal(result.valid,false);if(!result.valid)assert.ok(result.errors.attendance);}
});
test('positive response without companions counts the primary guest',()=>{
 const message=buildWhatsAppRSVPMessage(validated(),context);
 assert.match(message,/Acompañantes: 0\nTotal de personas: 1/);
 assert.match(message,/Asistencia: Sí, asistiré\./);
});
test('positive response with companions calculates the total',()=>{
 assert.match(buildWhatsAppRSVPMessage(validated({...guest,companions:2}),context),/Acompañantes: 2\nTotal de personas: 3/);
});
test('negative response contains no companion or total fields',()=>{
 const message=buildWhatsAppRSVPMessage(validated({...guest,attendance:'no'}),context);
 assert.match(message,/Gracias por la invitación/);assert.match(message,/No podré asistir/);
 assert.doesNotMatch(message,/Acompañantes|Total de personas/);
});
test('declining attendance normalizes stale or invalid companions to zero',()=>{
 for(const companions of [2,99,-1,NaN]) assert.equal(validated({...guest,attendance:'no',companions}).companions,0);
});
test('companion limit is independent and defaults to two',()=>{
 for(const companions of [-1,3,1.5,NaN,Infinity]) assert.equal(validateRSVPInput({...guest,companions}).valid,false);
 assert.equal(validateRSVPInput({...guest,companions:2}).valid,true);
 assert.equal(validateRSVPInput({...guest,companions:1},0).valid,false);
 assert.equal(validateRSVPInput({...guest,companions:4},4).valid,true);
});
test('WhatsApp phone normalizes allowed international formatting',()=>{
 assert.equal(normalizeWhatsAppPhone('+1 (202) 555-0123'),fictionalPhone);
 assert.equal(normalizeWhatsAppPhone(fictionalPhone),fictionalPhone);
});
test('missing and malformed WhatsApp recipients never prepare URLs',()=>{
 for(const phone of [undefined,'','00000000','123','abc','1e123456789','12025550123?text=x','+1-202-555-0123 ext 2','1234567890123456']) {
  assert.equal(normalizeWhatsAppPhone(phone),undefined);
  assert.notEqual(prepareWhatsAppRSVP(guest,{...config,phone},context,now).status,'ready');
 }
 assert.equal(getRSVPAvailability({...config,phone:undefined},now),'missing-phone');
 assert.equal(getRSVPAvailability({...config,phone:'wrong'},now),'invalid-phone');
});
test('special characters and multiline Spanish messages round-trip through URL encoding',()=>{
 const name='María & José + Ana / #1?';
 const message=buildWhatsAppRSVPMessage(validated({...guest,name}),context);
 const url=new URL(buildWhatsAppRSVPUrl(fictionalPhone,message));
 assert.equal(url.searchParams.get('text'),message);assert.match(message,/Nombre: María & José/);
 assert.equal([...url.searchParams.keys()].join(','),'text');assert.equal(url.hash,'');
});
test('WhatsApp URL uses a fixed HTTPS host and digits-only recipient',()=>{
 const url=new URL(buildWhatsAppRSVPUrl('+1 (202) 555-0123','Hola'));
 assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,`/${fictionalPhone}`);assert.equal(url.searchParams.get('text'),'Hola');
 assert.throws(()=>buildWhatsAppRSVPUrl('javascript:alert(1)','Hola'));
});
test('messages use the correct couple and configurable copy',()=>{
 assert.match(buildWhatsAppRSVPMessage(validated(),context),/^Hola, Laura y Martín\./);
 assert.match(buildWhatsAppRSVPMessage(validated(),{eventLabel:'Ana y Carlos'}),/^Hola, Ana y Carlos\./);
 const result=prepareWhatsAppRSVP(guest,{...config,texts:{greeting:'Queridos {event}',acceptIntro:'Celebremos juntos.',totalLabel:'Personas'}},{eventLabel:'Ana y Carlos'},now);
 assert.equal(result.status,'ready');if(result.status==='ready') {assert.match(result.message,/Queridos Ana y Carlos/);assert.match(result.message,/Personas: 1/);assert.match(result.message,/Celebremos juntos\./);}
});
test('disabled RSVP cannot prepare a WhatsApp link',()=>{
 assert.equal(getRSVPAvailability({...config,enabled:false},now),'disabled');
 assert.deepEqual(prepareWhatsAppRSVP(guest,{...config,enabled:false},context,now),{status:'unavailable',reason:'disabled'});
});
test('expired deadlines and malformed deadline configurations block opening',()=>{
 assert.equal(getRSVPAvailability({...config,deadline:'2026-12-31T23:59:59Z'},now),'expired');
 assert.equal(getRSVPAvailability({...config,deadline:'not-a-date'},now),'invalid-deadline');
 assert.notEqual(prepareWhatsAppRSVP(guest,{...config,deadline:'2026-12-31T23:59:59Z'},context,now).status,'ready');
});
test('future, inclusive and absent deadlines allow preparation',()=>{
 for(const deadline of [undefined,'2027-01-01T00:00:00Z','2027-02-01T00:00:00-04:00']) assert.equal(getRSVPAvailability({...config,deadline},now),'ready');
});
test('existing demo configurations stay safe and independent; optional deadline validates',()=>{
 const laura=getInvitation('laura-martin')!,ana=getInvitation('ana-carlos')!;
 assert.equal(laura.rsvp.phone,undefined);assert.equal(ana.rsvp.phone,undefined);
 assert.equal(laura.rsvp.enabled,false);assert.equal(ana.rsvp.enabled,false);
 assert.equal(ana.rsvp.maxCompanions,2);
 assert.notEqual(laura.rsvp.deadline,ana.rsvp.deadline);
 delete laura.rsvp.deadline;assert.doesNotThrow(()=>validateInvitation(laura));
 laura.rsvp.phone='bad';assert.throws(()=>validateInvitation(laura),/rsvp.phone/);
 laura.rsvp.phone=fictionalPhone;laura.rsvp.buttonText='Abrir mi respuesta';assert.doesNotThrow(()=>validateInvitation(laura));
});
test('preparation has no automatic sending or network side effects',()=>{
 const original=globalThis.fetch;
 globalThis.fetch=()=>{throw new Error('No network allowed');};
 try {
  const before=structuredClone(guest);const result=prepareWhatsAppRSVP(guest,config,context,now);
  assert.equal(result.status,'ready');assert.deepEqual(guest,before);
  if(result.status==='ready') {assert.equal(new URL(result.url).searchParams.get('text'),result.message);assert.equal('sent' in result,false);}
 } finally {globalThis.fetch=original;}
});
