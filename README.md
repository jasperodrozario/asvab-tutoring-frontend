This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### ASVAB preparation resources

The app includes five authored resource pages: `/military-asvab-test`,
`/asvab-math-practice-test`, `/asvab-prep-classes`, `/asvab-study-guide`, and
`/asvab-tutor`. Their copy lives in each route's `page.tsx`; shared presentation
is in `components/asvab/`. `lib/asvab-resources.ts` supplies resource links to
the existing course, service, package, and tutor pages and both sitemaps.

The ASVAB course overview is rendered from
`components/asvab/AsvabCourseOverview.tsx`, including the official CAT-ASVAB
question counts and timing reviewed November 5, 2026. Other course overviews
continue to use backend content. Review the cited official sources when updating
the test facts. ASVAB curriculum, packages, pricing, and policy text still come
from the backend: reconcile the previously identified prediction-test label,
package subject lists, subscription prices, and continued-tutoring conditions
in that maintained content before repeating those details elsewhere. The new
resource pages link to those destinations without duplicating prices or policies.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Google sign-in with Firebase

Google registration uses two steps. For **Not yet** purchases, the Google button
appears above the email registration fields and does not require mobile or
checkbox input. The login page also offers Google sign-in above its email/password
fields. Existing Google accounts sign in immediately; new users continue
to `/user-registration/complete` to enter their mobile number and explicitly
accept the Terms of Service and Privacy Policy.

The Google identity is verified before the PHP lookup and again on completion.
An encrypted, HTTP-only onboarding cookie expires after 10 minutes and grants no
application access. No database user, subscription, or application session is
created until completion. Cancellation, logout, or successful completion clears
that temporary cookie. Abandoning setup simply lets it expire.

1. Copy the blank Firebase entries from `.env.example` into `.env.local` and fill
   them using your Firebase web app configuration and service account. Preserve
   your existing PHP API and session settings. Keep Admin credentials server-only.
2. Enable Google in Firebase Authentication's sign-in providers and add your
   local/production hosts under Authentication > Settings > Authorized domains.
3. Update the backend website API (`asvab-api.php` on the server) using the
   updated `social-register` case in `artifacts/server_api/live-asvab-api.php`.
   The core validation, account lookup, database inserts, registration email, and
   response logic remain inside that case. Also copy the Firebase-specific HTTP
   status block immediately before the final `echo json_encode($response)`.
   The mobile reference `live-app-api-v1.php` does not need changes.
4. Add `server-api/firebase-social-identity.php` beside the deployed website API.
   Keep the existing `social-auth.php` in the same directory; the API already
   includes it for name/token/payment/response helpers. A local copy is at
   `artifacts/server_api/social-auth.php` if the server is missing it.
   `artifacts/` is ignored by Git; keep your backend deployment copy separately.
   The earlier `server-api/social-register.php` wrapper is no longer needed.
   Remove its old include/call if you deployed it. Remove the earlier `google-login`
   case/helper too if you deployed the first implementation.

5. Set `INTERNAL_API_SECRET` in the PHP server environment to the same nonempty
   secret as the Next.js server. The Firebase path rejects requests unless that
   shared secret matches. It trusts only the server-verified identity supplied by
   Next.js; never expose this secret to browsers.
6. Restart after changing environment variables and rebuild for production:
   Next.js embeds `NEXT_PUBLIC_` values at build time.

The server uses the app's `action=social-register` contract with `provider=google`
and `id_token`. Firebase ID tokens differ from native Google ID tokens, so the
server adds `verification=firebase`, `firebase_uid`, `provider_subject`, verified
`email`, `first_name`, `last_name`, and an intent. `intent=begin` only looks up
existing accounts: unknown identities receive `needs_onboarding=true` without
inserting records. Completion sends `intent=register`, `terms_accepted=1`, and a
required, validated 10-digit US `mobile` number. PHP accepts these verified fields
only with the matching server secret; direct clients retain the existing Google token validation path.

The database flow inside the API action follows the app's social-register action:

- Look up `login` by **both** `provider` and `social_token` (the original Google
  subject, not the Firebase UID); existing app accounts reuse the same user.
- Save new registrations in **user**, **login**, and **subscription**, including
  names/email/mobile, provider identity, application auth token, and a free subscription.
- Reuse the website's registration email, token issuance, payment status, and
  portal response helpers. Return website session fields rather than mobile
  `userDetails` fields. No schema migration is needed.

Existing password accounts require email/password login and are not silently
linked; that conflict is shown before onboarding. Purchased-course registration
continues through the existing form, which does not offer Google registration.
The completion screen requires a valid US mobile number and an unchecked consent
checkbox that the user must select. Its profile comes from the protected
onboarding identity. When Google supplies no name, completion requires a full
name from the user; the server accepts it only when the verified name is missing.
Email and provider identity always come from the verified token. The mobile number is
validated by the browser and Next.js, checked again before PHP creates an account,
and stored in `user.mobile`. Existing-account Google login does not ask for mobile
or overwrite the saved number. The mobile API source remains unchanged.

Deployment requires the latest `social-register` case **and** the updated
`firebase-social-identity.php` helper, which now accepts `intent=begin`. Keep core
action/database logic in the API case; the helper only checks the trusted identity
handoff. No extra secrets or database schema changes are required for onboarding.

The PHP identity adapter and database flow accept either `google` or `apple` as a
provider. Apple is not exposed in the website yet: it still needs a Firebase
provider flow, server token verification, and a button. When adding Apple, use its
verified provider subject and preserve the name from initial consent. Check Apple
App ID/Services ID grouping and existing subjects before promising app/web account
matching; Apple identifiers can differ across configurations. Never use the app's
JWT payload decoding alone as token verification.

Blank Firebase settings produce a friendly error and leave email login available.
Verify existing-account Google login, new-account registration with terms
acceptance, cancellation/blocked popups, paid-user portal redirects, and logout
followed by an account switch after deploying and filling in credentials.

Firebase references: [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
and [server token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
