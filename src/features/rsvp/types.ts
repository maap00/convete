export interface RSVPMessages {
 greeting: string;
 acceptIntro: string;
 declineIntro: string;
 nameLabel: string;
 attendanceLabel: string;
 companionsLabel: string;
 totalLabel: string;
 acceptAnswer: string;
 declineAnswer: string;
 acceptClosing: string;
 declineClosing: string;
}
export interface RSVPConfig {
 demoMode?: boolean;
 enabled: boolean;
 phone?: string;
 deadline?: string;
 message: string;
 maxCompanions?: number;
 intro?: string;
 buttonText?: string;
 eventLabel?: string;
 texts?: Partial<RSVPMessages>;
}
export interface RSVPInput { name: string; attendance: string; companions: number }
export type ValidatedRSVP = { name: string; attendance: 'yes' | 'no'; companions: number };
export type RSVPFieldErrors = Partial<Record<keyof RSVPInput,string>>;
export type RSVPAvailability = 'ready' | 'disabled' | 'missing-phone' | 'invalid-phone' | 'expired' | 'invalid-deadline';
export interface RSVPMessageContext { eventLabel: string; texts?: Partial<RSVPMessages> }
