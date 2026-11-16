import type {Metadata} from 'next';
import {InvitationRequestWizard} from '@/features/invitation-requests/components/InvitationRequestWizard';
import './request.css';
export const metadata:Metadata={title:'Creemos su invitación · Convete',description:'Prepara localmente los datos y fotografías de tu boda y descarga una solicitud de invitación digital.',robots:{index:false,follow:false}};
export default function RequestPage(){return <InvitationRequestWizard/>;}
