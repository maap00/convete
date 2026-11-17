import type {WeddingInvitation} from './types';
export function effectiveRsvp(invitation:WeddingInvitation):WeddingInvitation['rsvp'] {
 return invitation.mode==='demo'||invitation.rsvp.demoMode?{...invitation.rsvp,enabled:false,demoMode:true,phone:undefined}:{...invitation.rsvp};
}
