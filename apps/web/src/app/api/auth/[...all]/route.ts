import { auth } from "@bounty/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { grim } from "@bounty/dev-logger";

const { log } = grim();

export const { GET, POST } = toNextJsHandler(auth.handler);
log(auth.handler);
log("the jawn has been hitted");
