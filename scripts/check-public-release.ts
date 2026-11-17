import {assertPublicTree} from '../src/features/invitations/release-artifact.ts';
import {resolveMetadataOrigin} from '../src/features/invitations/metadata.ts';
import {validateReleaseEnvironment,publicDemoMode} from '../src/features/invitations/public-policy.ts';
try{validateReleaseEnvironment(process.env);assertPublicTree(process.cwd(),publicDemoMode(process.env));console.log(`Preflight: ${publicDemoMode(process.env)?'demo pública (solo demos incluidas)':'preparación local/entrega configurada'}. ${resolveMetadataOrigin(process.env)?'Origen HTTPS del entorno validado.':'Sin origen: no se emiten URLs sociales públicas.'}`);}
catch(error){console.error(error instanceof Error?error.message:'Configuración de publicación inválida.');process.exitCode=1;}
