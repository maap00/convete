import {publicDemoMode} from './public-policy.ts';
import {builtInInvitations} from './builtins.ts';
import {discoverInvitations} from './discovery.ts';
import type { WeddingInvitation } from './types';
/** Built-in demos plus generated configurations discovered on server/build startup. */
export const invitationRegistry: readonly WeddingInvitation[] = [...builtInInvitations,...(publicDemoMode(process.env)?[]:discoverInvitations())];
