import {parseArgs} from 'node:util';
import {generateInvitation} from '../src/features/invitation-generator/generate.ts';
try{
 const {values}=parseArgs({options:{input:{type:'string'},assets:{type:'string'},slug:{type:'string'},'dry-run':{type:'boolean'},help:{type:'boolean'},fixture:{type:'boolean'}},strict:true,allowPositionals:false});
 if(values.help){console.log('Convete · generador local\n\nnpm run invitation:create -- --input ./solicitud.json [--assets ./fotografias] [--slug pareja] [--dry-run] [--fixture]\n\n--dry-run valida y prepara sin escribir. No sobrescribe invitaciones.\nTras crear: reinicia desarrollo o reconstruye y abre la ruta indicada. No publica en Internet.');}
 else{
  if(!values.input)throw new Error('input: indica --input ./solicitud.json. Usa --help para ver opciones.');
  const report=await generateInvitation({input:values.input,assets:values.assets,slug:values.slug,dryRun:values['dry-run'],fixture:values.fixture});
  console.log(JSON.stringify(report,null,2));
 }
}catch(error){console.error(`ERROR: ${error instanceof Error?error.message:'No se pudo generar la invitación.'}\nEstado: fallido. No se sobrescribieron invitaciones existentes. Consulta el motivo y cualquier archivo pendiente de limpieza indicado arriba.`);process.exitCode=1;}
