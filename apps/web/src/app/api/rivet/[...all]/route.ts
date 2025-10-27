import { toNextHandler } from "@rivetkit/next-js";
import { registry } from "@bounty/api";

export const maxDuration = 300;

console.log("RIVET ROUTE LOADED", { registry: !!registry });

export const { GET, POST, PUT, PATCH, HEAD, OPTIONS } = toNextHandler(registry);
