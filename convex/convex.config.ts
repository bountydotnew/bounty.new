import { defineApp } from 'convex/server';
import betterAuth from '@convex-dev/better-auth/convex.config.js';
import stripe from '@convex-dev/stripe/convex.config.js';
import resend from '@convex-dev/resend/convex.config.js';
import autumn from '@useautumn/convex/convex.config';

const app = defineApp();

app.use(betterAuth);
app.use(stripe);
app.use(resend);
app.use(autumn);

export default app;
