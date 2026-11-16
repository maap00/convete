import test from 'node:test';
import assert from 'node:assert/strict';
import {requestFixture} from './request-fixture.ts';
import {createRequestDraft} from '../src/features/invitation-requests/config.ts';
import {validateRequest,validateRequestStep,effectiveReception,isContactEmail,stepForField} from '../src/features/invitation-requests/validation.ts';
import {localDateTimeToISO,isCalendarDate} from '../src/features/invitation-requests/dates.ts';
import {MAX_FILE_BYTES,MAX_TOTAL_BYTES,MAX_GALLERY_PHOTOS,createManifestEntry,validateImageFile,checkImageHeader} from '../src/features/invitation-requests/files.ts';
import {serializeRequest,requestJSON} from '../src/features/invitation-requests/serialization.ts';
import {getInvitation} from '../src/features/invitations/repository.ts';
const identity={id:'request-12345678',createdAt:'2026-11-15T12:00:00Z'};
test('empty couple step reports required fields and accepts international names',()=>{
 const empty=validateRequestStep(createRequestDraft(),0);assert.equal(Object.keys(empty).length,6);
 const d=requestFixture();d.couple={first:"李 小龍",second:"O’Connor García-Smith"};assert.deepEqual(validateRequestStep(d,0),{});
 d.couple.first='x'.repeat(101);assert.ok(validateRequestStep(d,0)['couple.first']);
});
test('contact email accepts common formats and rejects malformed addresses',()=>{
 for(const email of ['nombre+bodas@example.com','user.name@sub.example.org','persona@ejemplo.es'])assert.equal(isContactEmail(email),true);
 for(const email of ['name','a@@b.com','a b@c.com','a@.com','a@domain','a..b@example.com','<a>@example.com'])assert.equal(isContactEmail(email),false);
});
test('commercial phone is validated independently of RSVP receiver',()=>{
 const d=requestFixture();d.rsvp={enabled:true,phone:'+34 612 345 678',maxCompanions:'2',deadlineLocal:'2027-04-01T12:00'};d.preferences.sections.rsvp=true;
 const result=serializeRequest(d,identity);assert.equal(result.commercial.contact.whatsapp,'584125550100');assert.equal(result.rsvp.enabled&&result.rsvp.phone,'34612345678');
 for(const phone of ['123','00012345678','tel:+584125550100','+58 abc']){d.contact.whatsapp=phone;assert.ok(validateRequestStep(d,0)['contact.whatsapp']);}
});
test('calendar validation rejects normalized dates and unknown zones',()=>{
 for(const date of ['2027-02-29','2027-04-31','2027-13-01','2027-4-1'])assert.equal(isCalendarDate(date),false);
 assert.equal(isCalendarDate('2028-02-29'),true);
 const d=requestFixture();d.event.timeZone='Unknown/Zone';assert.ok(validateRequestStep(d,0)['event.timeZone']);
});
test('wall-clock conversion uses the event zone, including fractional offsets and midnight',()=>{
 assert.equal(localDateTimeToISO('2027-04-17T23:30','America/Caracas'),'2027-04-18T03:30:00.000Z');
 assert.equal(localDateTimeToISO('2027-04-17T12:00','Asia/Kathmandu'),'2027-04-17T06:15:00.000Z');
 assert.throws(()=>localDateTimeToISO('2027-04-17T24:01','UTC'));
});
test('ambiguous and nonexistent daylight-saving times are rejected explicitly',()=>{
 assert.throws(()=>localDateTimeToISO('2027-03-14T02:30','America/New_York'),/no existe/);
 assert.throws(()=>localDateTimeToISO('2027-11-07T01:30','America/New_York'),/se repite/);
 assert.equal(localDateTimeToISO('2027-11-07T03:30','America/New_York'),'2027-11-07T08:30:00.000Z');
});
test('independent locations and ceremony/reception chronology are preserved',()=>{
 const d=requestFixture();assert.deepEqual(validateRequest(d),{});
 const result=serializeRequest(d,identity);assert.notEqual(result.venues.ceremony.location.name,result.venues.reception.location.name);
 d.venues.reception.localDateTime='2027-04-17T15:59';assert.ok(validateRequestStep(d,1)['venues.reception.localDateTime']);
 d.venues.ceremony.localDateTime='2027-04-18T16:00';assert.ok(validateRequestStep(d,1)['venues.ceremony.localDateTime']);
});
test('same location reuses all location fields but keeps reception time and original draft',()=>{
 const d=requestFixture();d.venues.sameLocation=true;d.venues.reception.localDateTime='2027-04-18T00:30';
 const before=structuredClone(d);const result=serializeRequest(d,identity);
 assert.deepEqual(result.venues.ceremony.location,result.venues.reception.location);assert.notEqual(result.venues.ceremony.startsAt,result.venues.reception.startsAt);
 assert.equal(effectiveReception(d).name,d.venues.ceremony.name);assert.deepEqual(d,before);
});
test('maps use the existing official-domain destination policy',()=>{
 const d=requestFixture();for(const url of ['https://maps.app.goo.gl/abcdef12','https://www.google.com/maps/search/?api=1&query=Caracas']){d.venues.ceremony.googleMapsUrl=url;assert.deepEqual(validateRequestStep(d,1),{});}
 for(const url of ['javascript:alert(1)','http://google.com/maps/place/Caracas','https://google.com.evil.test/maps/place/Caracas','https://google.com/maps']){d.venues.ceremony.googleMapsUrl=url;assert.ok(validateRequestStep(d,1)['venues.ceremony.googleMapsUrl']);}
});
test('coordinates allow zero and boundaries and reject partial or out-of-range pairs',()=>{
 const d=requestFixture();for(const [lat,lng] of [['0','0'],['-90','180'],['90','-180']]){d.venues.ceremony.latitude=lat;d.venues.ceremony.longitude=lng;assert.deepEqual(validateRequestStep(d,1),{});}
 for(const [lat,lng] of [['91','0'],['0','181'],['1',''],['NaN','4'],['1,5','2'],['1e1','2']]){d.venues.ceremony.latitude=lat;d.venues.ceremony.longitude=lng;assert.ok(validateRequestStep(d,1)['venues.ceremony.latitude']);}
});
test('optional copy is omitted and multiline text is normalized without stripping accents',()=>{
 const result=serializeRequest(requestFixture(),identity);assert.equal(result.content.story,undefined);assert.equal(result.content.specialInstructions,undefined);assert.equal(result.content.welcome,'Primera línea\nSegunda línea');assert.equal(result.couple.first,'María Luz');
 const d=requestFixture();d.content.story='x'.repeat(6001);assert.ok(validateRequestStep(d,2)['content.story']);
});
test('photo requirements follow gallery activation without discarding the draft',()=>{
 const d=requestFixture();d.resources=d.resources.filter(r=>r.destination==='main');assert.ok(validateRequestStep(d,2)['resources.gallery']);d.preferences.sections.gallery=false;assert.deepEqual(validateRequestStep(d,2),{});
 d.resources=[];assert.ok(validateRequestStep(d,2)['resources.main']);assert.throws(()=>serializeRequest(d,identity));
});
test('only implemented themes and compatible palettes validate',()=>{
 const d=requestFixture();d.preferences.palette='rose';assert.deepEqual(validateRequestStep(d,4),{});
 Object.assign(d.preferences,{theme:'future'});assert.ok(validateRequestStep(d,4)['preferences.theme']);
 Object.assign(d.preferences,{theme:'botanical',palette:'unknown'});assert.ok(validateRequestStep(d,4)['preferences.theme']);
});
test('disabled RSVP ignores stale fields and excludes them from the export',()=>{
 const d=requestFixture();d.rsvp={enabled:false,phone:'not-a-phone',deadlineLocal:'invalid',maxCompanions:'-1'};
 assert.deepEqual(validateRequestStep(d,4),{});assert.deepEqual(serializeRequest(d,identity).rsvp,{enabled:false});
});
test('enabled RSVP requires receiver, companion bounds and a deadline before the ceremony',()=>{
 const d=requestFixture();d.rsvp.enabled=true;d.preferences.sections.rsvp=true;assert.equal(Object.keys(validateRequestStep(d,4)).length,2);
 d.rsvp={enabled:true,phone:'+1 202 555 0100',maxCompanions:'20',deadlineLocal:'2027-04-17T16:00'};assert.deepEqual(validateRequestStep(d,4),{});
 for(const max of ['-1','21','1.5','']){d.rsvp.maxCompanions=max;assert.ok(validateRequestStep(d,4)['rsvp.maxCompanions']);}
 d.rsvp.maxCompanions='0';d.rsvp.deadlineLocal='2027-04-17T16:01';assert.ok(validateRequestStep(d,4)['rsvp.deadlineLocal']);
});
test('RSVP section cannot silently disagree with its activation',()=>{
 const d=requestFixture();d.preferences.sections.rsvp=true;assert.ok(validateRequestStep(d,4)['rsvp.enabled']);
});
test('itinerary validates title, chronological order, uniqueness and midnight dates',()=>{
 const d=requestFixture();d.preferences.sections.itinerary=true;assert.ok(validateRequestStep(d,3)['celebration.itinerary']);
 d.celebration.itinerary=[{id:'dinner-1',title:'Cena',localDateTime:'2027-04-17T20:00',description:''},{id:'dance-2',title:'Baile',localDateTime:'2027-04-18T00:30',description:''}];assert.deepEqual(validateRequestStep(d,3),{});
 d.celebration.itinerary.reverse();assert.ok(Object.keys(validateRequestStep(d,3)).some(k=>k.endsWith('localDateTime')));
 d.celebration.itinerary[0].title='';assert.ok(Object.keys(validateRequestStep(d,3)).some(k=>k.endsWith('title')));
});
test('optional gift URLs still reject unsafe schemes and absent gift sections need no message',()=>{
 const d=requestFixture();d.preferences.sections.gifts=true;d.celebration.giftsMessage='Su presencia';d.celebration.giftsUrl='https://example.com/lista';assert.deepEqual(validateRequestStep(d,3),{});
 for(const url of ['data:image/png;base64,abc','javascript:alert(1)','http://example.com']){d.celebration.giftsUrl=url;assert.ok(validateRequestStep(d,3)['celebration.giftsUrl']);}
 d.celebration.giftsUrl='';d.celebration.giftsMessage='';d.preferences.sections.gifts=true;assert.ok(validateRequestStep(d,3)['celebration.giftsMessage']);
});
test('supported images enforce MIME, extension, nonempty size and exact maximum',()=>{
 for(const [type,name] of [['image/jpeg','a.JPG'],['image/png','a.png'],['image/webp','a.webp']])assert.equal(validateImageFile({type,name,size:MAX_FILE_BYTES}),undefined);
 for(const f of [{type:'image/svg+xml',name:'a.svg',size:1},{type:'image/jpeg',name:'a.png',size:1},{type:'image/jpeg',name:'a.jpg',size:0},{type:'image/png',name:'a.png',size:MAX_FILE_BYTES+1}])assert.ok(validateImageFile(f));
});
test('manifest contains only file metadata, and image signatures must match MIME',async()=>{
 const file={name:'fotografía.jpg',type:'image/jpeg',size:1234,temporaryURL:'blob:ignored'};
 assert.deepEqual(createManifestEntry(file,'main','photo-1234'),{id:'photo-1234',filename:'fotografía.jpg',mimeType:'image/jpeg',size:1234,destination:'main'});
 const fake=(bytes:number[],type:string)=>Object.assign(new Blob([new Uint8Array(bytes)],{type}),{name:'test.jpg'}) as File;
 assert.equal(await checkImageHeader(fake([255,216,255,0],'image/jpeg')),true);assert.equal(await checkImageHeader(fake([0,0,0],'image/jpeg')),false);
});
test('resource count, aggregate size and duplicate filenames/IDs cannot bypass export validation',()=>{
 const d=requestFixture();d.resources.push({...d.resources[0]});assert.ok(validateRequestStep(d,2).resources);
 const many=requestFixture();many.resources=[many.resources[0],...Array.from({length:MAX_GALLERY_PHOTOS+1},(_,i)=>({id:`gallery-${i}`,filename:`g${i}.jpg`,mimeType:'image/jpeg',size:MAX_FILE_BYTES,destination:'gallery' as const}))];
 const errors=validateRequestStep(many,2);assert.ok(errors['resources.gallery']);assert.ok(errors.resources);assert.ok(many.resources.reduce((s,r)=>s+r.size,0)>MAX_TOTAL_BYTES);
});
test('versioned serialization excludes File, preview URLs, base64 and UI properties without mutating state',()=>{
 const d=requestFixture();Object.assign(d,{step:5,errors:{name:'bad'},files:[{name:'private'}],preview:'blob:abc',image:'data:image/png;base64,ABC'});Object.assign(d.resources[0],{file:{name:'fake'},url:'blob:abc',base64:'data:image/png;base64,ABC'});
 const before=structuredClone(d);const result=serializeRequest(d,identity),json=requestJSON(result);assert.deepEqual(d,before);
 assert.equal(JSON.parse(json).schemaVersion,1);assert.equal(result.completeness.originalFilesDelivery,'pending');assert.deepEqual(result.completeness.requiredResourceIds,['resource-main','resource-gallery']);
 for(const token of ['blob:','base64','preview','"files"','"errors"','"step"'])assert.ok(!json.includes(token));assert.equal(result.commercial.contact.email,'pareja@example.com');
 assert.throws(()=>serializeRequest(d,{...identity,id:'../bad'}));assert.throws(()=>serializeRequest(d,{...identity,createdAt:'invalid'}));
});
test('draft defaults and new request changes preserve existing independent invitations',()=>{
 const laura=getInvitation('laura-martin'),ana=getInvitation('ana-carlos');const d=createRequestDraft();d.couple.first='Nueva pareja';d.preferences.palette='rose';assert.deepEqual(getInvitation('laura-martin'),laura);assert.deepEqual(getInvitation('ana-carlos'),ana);
 const second=createRequestDraft();assert.equal(second.couple.first,'');assert.equal(second.preferences.palette,'olive');assert.equal(stepForField('content.specialInstructions'),3);assert.equal(stepForField('resources.main'),2);
});

test('dress code can be disabled before advancing, preserves draft and exports only active content',()=>{
 const d=requestFixture();d.celebration.dressCode='';
 assert.ok(validateRequestStep(d,3)['celebration.dressCode']);
 d.preferences.sections.dressCode=false;
 assert.deepEqual(validateRequestStep(d,3),{});assert.deepEqual(validateRequestStep(d,4),{});
 assert.equal(serializeRequest(d,identity).celebration.dressCode,undefined);
 d.preferences.sections.dressCode=true;d.celebration.dressCode='Formal';d.celebration.colors='Verde';
 assert.deepEqual(validateRequest(d),{});
 d.preferences.sections.dressCode=false;const before=structuredClone(d);
 const output=serializeRequest(d,identity);assert.equal(output.preferences.sections.dressCode,false);
 assert.equal(output.celebration.dressCode,undefined);assert.equal(output.celebration.colors,undefined);assert.deepEqual(d,before);
 d.preferences.sections.dressCode=true;assert.equal(d.celebration.dressCode,'Formal');assert.equal(serializeRequest(d,identity).celebration.dressCode,'Formal');
});
test('disabled sections ignore hidden invalid data and omit it from the JSON without losing it',()=>{
 const d=requestFixture();Object.assign(d.preferences.sections,{dressCode:false,welcome:false,gifts:false,itinerary:false});
 d.celebration.dressCode='x'.repeat(501);d.celebration.colors='x'.repeat(301);d.content.welcome='';d.content.story='\u0000';
 d.celebration.giftsMessage='\u0000';d.celebration.giftsUrl='javascript:bad';d.celebration.itinerary=[{id:'a',title:'',localDateTime:'bad',description:''}];
 const before=structuredClone(d);assert.deepEqual(validateRequest(d),{});
 const result=serializeRequest(d,identity);assert.equal(result.content.welcome,undefined);assert.equal(result.content.story,undefined);
 assert.equal(result.celebration.giftsMessage,undefined);assert.equal(result.celebration.giftsUrl,undefined);assert.deepEqual(result.celebration.itinerary,[]);assert.deepEqual(d,before);
 d.preferences.sections.dressCode=true;assert.ok(validateRequestStep(d,3)['celebration.dressCode']);
});
test('required cover, conditional welcome and optional closing agree between steps and export',()=>{
 const d=requestFixture();d.content.cover='';assert.ok(validateRequestStep(d,2)['content.cover']);d.content.cover='Nos elegimos';
 d.content.welcome='';assert.ok(validateRequestStep(d,2)['content.welcome']);d.preferences.sections.welcome=false;
 d.content.closing='  ';d.content.story='';d.content.specialInstructions='';assert.deepEqual(validateRequestStep(d,2),{});assert.deepEqual(validateRequest(d),{});
 const result=serializeRequest(d,identity);assert.equal(result.content.closing,'Gracias por acompañarnos en este nuevo comienzo.');assert.equal(result.content.welcome,undefined);
 d.preferences.sections.welcome=true;assert.ok(validateRequest(d)['content.welcome']);
});
test('personalized optional messages preserve accents, normalization and validation limits',()=>{
 const d=requestFixture();d.content.story=' Nuestra historia ';d.content.closing=' Hasta pronto, con ilusión ';d.content.specialInstructions=' Lleguen con tiempo ';
 const result=serializeRequest(d,identity);assert.equal(result.content.story,'Nuestra historia');assert.equal(result.content.closing,'Hasta pronto, con ilusión');assert.equal(result.content.specialInstructions,'Lleguen con tiempo');
 d.content.closing='x'.repeat(2001);assert.ok(validateRequestStep(d,2)['content.closing']);assert.throws(()=>serializeRequest(d,identity));
 d.content.closing='\u0000';assert.ok(validateRequestStep(d,2)['content.closing']);
 d.content.closing='';d.content.specialInstructions='x'.repeat(3001);assert.ok(validateRequestStep(d,3)['content.specialInstructions']);
});
