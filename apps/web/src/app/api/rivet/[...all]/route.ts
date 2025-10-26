import { registry } from '@bounty/api';
import { toNextHandler } from "@rivetkit/next-js";

export const maxDuration = 300;

export const { GET, POST } = toNextHandler(registry);
