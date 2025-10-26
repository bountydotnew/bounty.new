import { registry } from '@bounty/api';
import { toNextHandler } from 'rivetkit';

export const maxDuration = 300;

export const { GET, POST } = toNextHandler(registry);
