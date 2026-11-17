import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isHttpUrl,isHttpsUrl,isGiftRegistryUrl } from '../src/lib/urls.ts';
import { isGoogleMapsUrl,isWazeUrl,isValidCoordinates,hasSpecificAddress,buildGoogleMapsUrl,buildWazeUrl,resolveLocationActions } from '../src/features/locations/navigation.ts';
import type { EventLocation } from '../src/features/locations/types.ts';
import { getInvitation } from '../src/features/invitations/repository.ts';
import { validateInvitation } from '../src/features/invitations/validation.ts';
import { getVisibleSections } from '../src/features/invitations/sections.ts';
// Synthetic coordinates and address for pure URL construction only; not demo venues.
const coordinates={latitude:10.5,longitude:-66.9};
const location:EventLocation={name:'Lugar de prueba',coordinates};
const address:EventLocation={name:'Ejemplo de pruebas',address:'Calle de Prueba 123',city:'Ciudad de Prueba',country:'País de Prueba'};
const maps='https://www.google.com/maps/dir/?api=1&destination=10.5%2C-66.9';
test('valid official Google Maps URL forms are accepted',()=>{
 for(const url of [maps,'https://maps.google.com/?q=10.5,-66.9','https://maps.app.goo.gl/Abcd1234','https://goo.gl/maps/Abcd1234','https://www.google.com/maps/place/Location']) assert.equal(isGoogleMapsUrl(url),true,url);
});
test('invalid Maps domains, protocols, redirects and parameters are rejected',()=>{
 for(const url of ['https://www.google.com.evil.test/maps/place/X','https://google.com/url?q=https://evil.test','https://maps.google.com@evil.test/','http://www.google.com/maps/place/X','https://www.google.com/maps','https://www.google.com/maps/dir/?api=2&destination=10,20','https://www.google.com/maps/dir/?destination=10,20','https://www.google.com/maps/dir/?api=1&destination=99,999','https://maps.google.com/?q=place&redirect=https://evil.test','https://maps.google.com/?q=a&q=b','https://maps.google.com/?q=abc&travelmode=fly','https://maps.google.com/?ll=wrong']) assert.equal(isGoogleMapsUrl(url),false,url);
});
test('valid coordinates include zero and geographic boundaries',()=>{
 for(const value of [coordinates,{latitude:0,longitude:0},{latitude:-90,longitude:180},{latitude:90,longitude:-180}]) assert.equal(isValidCoordinates(value),true);
});
test('latitude outside range or non-finite is invalid',()=>{
 for(const latitude of [-90.1,90.1,NaN,Infinity]) assert.equal(isValidCoordinates({latitude,longitude:0}),false);
});
test('longitude outside range or non-finite is invalid',()=>{
 for(const longitude of [-180.1,180.1,NaN,Infinity]) assert.equal(isValidCoordinates({latitude:0,longitude}),false);
});
test('Google Maps directions are built with encoded coordinates',()=>{
 const url=new URL(buildGoogleMapsUrl(location)!);
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.pathname,'/maps/dir/');assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('destination'),'10.5,-66.9');assert.equal(url.searchParams.has('origin'),false);
});
test('Google Maps directions use a sufficiently specific full address',()=>{
 const value={...address,address:'Calle Libertad 123',city:'Ciudad Central',country:'Venezuela'};
 assert.equal(hasSpecificAddress(value),true);
 assert.equal(new URL(buildGoogleMapsUrl(value)!).searchParams.get('destination'),'Calle Libertad 123, Ciudad Central, Venezuela');
});
test('explicit validated Maps URL takes priority over coordinates and legacy URL remains supported',()=>{
 const explicit='https://maps.app.goo.gl/Abcd1234';
 assert.equal(buildGoogleMapsUrl({...location,googleMapsUrl:explicit}),explicit);
 assert.equal(buildGoogleMapsUrl({name:'Lugar',mapUrl:explicit}),explicit);
});
test('insufficient or fictitious addresses never become destinations',()=>{
 for(const value of [{name:'El Jardín'},{name:'Lugar',address:'Caracas'},{...address,address:'Calle sin número'},{...address,address:'Calle ficticia 123'},{...address,address:'Calle Real 123',country:undefined}]) {assert.equal(hasSpecificAddress(value),false);assert.equal(buildGoogleMapsUrl(value),undefined);}
});
test('Waze navigation uses official HTTPS URL and coordinates',()=>{
 const url=new URL(buildWazeUrl(location)!);assert.equal(url.origin,'https://www.waze.com');assert.equal(url.pathname,'/ul');assert.equal(url.searchParams.get('ll'),'10.5,-66.9');assert.equal(url.searchParams.get('navigate'),'yes');assert.equal(isWazeUrl(url.toString()),true);
});
test('Waze without coordinates stays hidden unless an explicit validated destination exists',()=>{
 assert.equal(buildWazeUrl({name:'Lugar',googleMapsUrl:maps}),undefined);
 const explicit='https://www.waze.com/ul/habc123';assert.equal(buildWazeUrl({name:'Lugar',wazeUrl:explicit}),explicit);
 assert.notEqual(buildWazeUrl({...location,wazeUrl:explicit}),explicit);
 for(const url of ['waze://?ll=10,20','https://waze.com.evil.test/ul?ll=10,20','https://www.waze.com/ul?ll=99,999','https://www.waze.com/ul?q=Jardin','https://www.waze.com/ul?ll=10,20&navigate=maybe']) assert.equal(isWazeUrl(url),false);
});
test('gift registry URLs allow arbitrary HTTPS providers',()=>{
 assert.equal(isGiftRegistryUrl('https://registry.example.org/list?couple=123'),true);
 assert.equal(isHttpUrl('http://example.org/list'),true);assert.equal(isHttpsUrl('http://example.org/list'),false);
});
test('unsafe gift URLs and malformed URLs are rejected',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,x','https:example.org','https:///example.org','https://example.org/\u0000','file:///tmp/a','//example.org/list','http://example.org/list','https://user:secret@example.org','https://example.org/a b','https://example.org/\\evil','https://example.org/%zz','https://example.org/%0a']) assert.equal(isGiftRegistryUrl(url),false,url);
});
test('special characters round-trip through native parameter encoding',()=>{
 const value={name:'Lugar',address:'Avenida Ávila & Sol 45 #2',city:'San José',country:'México'};
 const destination=new URL(buildGoogleMapsUrl(value)!).searchParams.get('destination');
 assert.equal(destination,'Avenida Ávila & Sol 45 #2, San José, México');
 assert.equal(new URL(buildGoogleMapsUrl(value)!).hash,'');
});
test('location without sufficient data has no actions',()=>assert.deepEqual(resolveLocationActions({name:'Lugar'}),{googleMaps:undefined,waze:undefined}));
test('location can expose Google Maps alone',()=>assert.deepEqual(resolveLocationActions({name:'Lugar',googleMapsUrl:maps}),{googleMaps:maps,waze:undefined}));
test('location can expose both Maps and Waze and can disable navigation',()=>{
 const result=resolveLocationActions(location);assert.ok(result.googleMaps);assert.ok(result.waze);
 assert.deepEqual(resolveLocationActions({...location,navigationEnabled:false}),{googleMaps:undefined,waze:undefined});
});
test('ceremony and reception destinations are independent',()=>{
 const value=getInvitation('laura-martin')!;value.ceremony.coordinates={...coordinates};value.reception.coordinates={latitude:11,longitude:-67};
 assert.notEqual(buildGoogleMapsUrl(value.ceremony),buildGoogleMapsUrl(value.reception));assert.doesNotThrow(()=>validateInvitation(value));
});
test('same location data can be shared while event times remain independent',()=>{
 const shared={name:'Lugar de prueba',address:'Dirección descriptiva',coordinates};
 const ceremony={...shared,startsAt:'2027-04-17T16:00:00-04:00'},reception={...shared,startsAt:'2027-04-17T18:00:00-04:00'};
 assert.equal(buildGoogleMapsUrl(ceremony),buildGoogleMapsUrl(reception));assert.notEqual(ceremony.startsAt,reception.startsAt);
});
test('disabled gifts are omitted by the existing section configuration',()=>{
 const value=getInvitation('laura-martin')!;value.sections=value.sections.map(section=>section.id==='gifts'?{...section,enabled:false}:section);assert.equal(getVisibleSections(value).some(section=>section.id==='gifts'),false);
});
test('gifts without URL retain their valid message and no URL is synthesized',()=>{
 const value=getInvitation('laura-martin')!;assert.ok(value.gifts.message);assert.equal(value.gifts.url,undefined);assert.doesNotThrow(()=>validateInvitation(value));
});
test('invitations keep independent location and gift configurations',()=>{
 const laura=getInvitation('laura-martin')!,ana=getInvitation('ana-carlos')!;
 laura.ceremony.coordinates={...coordinates};laura.gifts.url='https://registry.example.org/list';laura.gifts.buttonText='Nuestros regalos';
 assert.equal(ana.ceremony.coordinates,undefined);assert.equal(ana.gifts.url,undefined);assert.equal(getInvitation('laura-martin')!.gifts.url,undefined);
});
test('approved Laura configuration is preserved and Ana stays fictitious',()=>{
 const {mode,...approvedContent}=getInvitation('laura-martin')!;assert.equal(mode,'demo');assert.deepEqual(approvedContent,JSON.parse(readFileSync(new URL('./fixtures/laura-martin.json',import.meta.url),'utf8')));
 assert.match(getInvitation('ana-carlos')!.demoNotice!,/fictici/);
});
test('existing config validation reports invalid navigation and gift settings by field',()=>{
 const value=getInvitation('laura-martin')!;
 value.ceremony.googleMapsUrl='https://evil.test';assert.throws(()=>validateInvitation(value),/ceremony.googleMapsUrl/);delete value.ceremony.googleMapsUrl;
 value.reception.wazeUrl='https://evil.test';assert.throws(()=>validateInvitation(value),/reception.wazeUrl/);delete value.reception.wazeUrl;
 value.ceremony.coordinates={latitude:91,longitude:0};assert.throws(()=>validateInvitation(value),/ceremony.coordinates/);delete value.ceremony.coordinates;
 value.gifts.url='data:text/html,x';assert.throws(()=>validateInvitation(value),/gifts.url/);delete value.gifts.url;
 value.gifts.buttonText=' ';assert.throws(()=>validateInvitation(value),/gifts.buttonText/);
});
test('both shipped demos have no active fictitious navigation or gift links',()=>{
 for(const slug of ['laura-martin','ana-carlos']){const value=getInvitation(slug)!;for(const venue of [value.ceremony,value.reception]) assert.deepEqual(resolveLocationActions(venue),{googleMaps:undefined,waze:undefined});assert.equal(value.gifts.url,undefined);}
});
