import { auth } from '@bounty/auth/server';
import { grim } from '@bounty/dev-logger';
import { toNextJsHandler } from 'better-auth/next-js';

const { log } = grim();

export const { GET, POST } = toNextJsHandler(auth.handler);
log(auth.handler);
log('the jawn has been hitted');
