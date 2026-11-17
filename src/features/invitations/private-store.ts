import {resolve} from 'node:path';
/** Server/CLI data, deliberately outside public. publicRoot remains the existing API boundary. */
export function privateInvitationRoot(publicRoot=resolve('public')):string{return resolve(publicRoot,'..','data','invitations');}
