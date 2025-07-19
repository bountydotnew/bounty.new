import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { grim } from "@/lib/use-dev-log";

const { log } = grim();



export const { GET, POST } = toNextJsHandler(auth.handler);
log(auth.handler);
log("the jawn has been hitted");
