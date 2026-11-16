/** Wall-clock time + IANA zone -> unambiguous instant. Never use the browser's zone. */
export function isTimeZone(value:string):boolean {
 if(!value.trim())return false;
 try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}
}
export function isCalendarDate(value:string):boolean {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(`${value}T00:00:00Z`);
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value&&Number(value.slice(0,4))>=1900;
}
export function localDateTimeToISO(value:string,zone:string):string {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)||!isCalendarDate(value.slice(0,10))||!isTimeZone(zone)||Number(value.slice(11,13))>23||Number(value.slice(14,16))>59)throw new Error('Indica fecha, hora y zona horaria válidas.');
 const nominal=Date.parse(`${value}:00Z`);
 const format=new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const wall=(instant:number)=>{const p=Object.fromEntries(format.formatToParts(new Date(instant)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;};
 // Offsets sampled on both sides of a transition, including half-hour/quarter-hour zones.
 const offsets=new Set([-36,-12,0,12,36].map(hours=>{const t=nominal+hours*3600000;return Date.parse(wall(t)+'Z')-t;}));
 const candidates=[...offsets].map(offset=>nominal-offset).filter(t=>wall(t)===value+':00');
 if(candidates.length!==1)throw new Error(candidates.length?'Esta hora se repite por cambio de horario. Elige una hora inequívoca.':'Esta hora no existe en la zona elegida.');
 return new Date(candidates[0]).toISOString();
}
