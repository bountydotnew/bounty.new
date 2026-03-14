/**
 * Convex auth config — required by Convex for JWT validation.
 *
 * This tells Convex how to verify the JWTs issued by Better Auth.
 * The @convex-dev/better-auth component handles the actual auth logic.
 *
 * To generate JWKS, run your Better Auth server and fetch:
 *   curl https://your-app.com/api/auth/.well-known/jwks.json
 * Then set it as a Convex env var:
 *   npx convex env set JWKS '{"keys":[...]}'
 */
export default {
  providers: [],
};
