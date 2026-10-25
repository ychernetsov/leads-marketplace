# UX traps / navigation confusions — audit & fixes

Scope: client-facing navigation/auth UX in `dev:mocks` mode (SQLite + mocked
R2/Stripe, happy path only). No test files were added or modified, and no
3rd-party integration behavior was changed — Stripe/R2 remain fully mocked,
only local SQLite data is used.

All items below were reproduced against a running `npm run dev:mocks`
instance (server on `:3000`, client on `:4200`) using the seeded accounts
(`admin@dev.local`, `buyer1@dev.local`, `buyer2@dev.local`, password
`devpassword1`) before being fixed.

## 1. Originally reported traps

| # | Trap | Root cause | Fix |
|---|------|-----------|-----|
| 1 | On `/orders` there was no way back to the main page | `OrdersPage` rendered its own ad-hoc header that happened to include a `CATALOG` button in this build, but `AdminUploadPage` and the logged-out/blank states did not — navigation was inconsistent page to page, and (see #6 below) was actually crash-prone for admins | Introduced one shared `<Header />` component (`client/src/components/Header.tsx`) used by **every** page. It always renders a clickable `CSV ARCHIVE` wordmark that routes to `/`, plus a `CATALOG` link, so there is always a one-click way back to the main page from anywhere in the app. |
| 2 | No logout button when admin is logged in (on catalog) | `CatalogPage`'s header only rendered `UPLOAD` for admins, no logout action at all | Shared `<Header />` always renders `LOG OUT` for any authenticated user, admin or not. |
| 3 | No logout on `/admin/upload` | `AdminUploadPage` header only had `CATALOG` + a static `UPLOAD` label, no logout | Same shared `<Header />` fix as above — `/admin/upload` now has `CATALOG`, `UPLOAD` (active), and `LOG OUT`. |
| 4 | Logged-in user visiting `/login` still sees the login form | `LoginSignupPage` never checked auth state | Added a `useAuth()`-driven redirect: if already logged in, `/login` and `/signup` immediately `navigate('/', { replace: true })` instead of rendering the form. |
| 5 | No indication on the main page of who is logged in | Header never surfaced the current user | Shared `<Header />` shows `<email> · ADMIN` (or just `<email>` for regular buyers) next to the nav links whenever a session is active. |

## 2. Additional traps found during review

| # | Trap | Root cause | Fix |
|---|------|-----------|-----|
| 6 | **App-crashing bug**: an admin who navigates directly to `/orders` (bookmark, typed URL, browser back/forward) gets a blank white screen instead of being redirected | `OrdersPage` called `return null` for admins **before** calling `useState`/`useQuery` for the non-admin render path. React requires the same hooks to be called in the same order on every render; going from "loading" (hooks called) to "admin, early-return" (hooks skipped) throws `Error: Rendered fewer hooks than during the previous render.`, and there is no error boundary, so the app goes blank. Verified by rendering the same hook pattern with `react-dom/client` + `act()` in isolation — it reliably reproduces the React error. | Reordered `OrdersPage` so **all hooks run unconditionally first**, and the redirect/early-return happens only after every hook has already been called (same fix pattern used for the new "redirect if logged out" behavior, see #7). Re-verified with Playwright: admin hitting `/orders` now lands cleanly on `/admin/upload`, no crash, no blank screen. |
| 7 | Logged-out visitor navigating directly to `/orders` gets a permanent "COULDN'T LOAD PURCHASES / CHECK YOUR CONNECTION" error (the `RELOAD` button just repeats the same 401 forever) instead of being sent to log in | `/files/orders/mine` requires auth; the page queried it unconditionally regardless of auth state | `OrdersPage` now redirects logged-out visitors to `/login` (same effect used for the admin redirect) and disables the orders query (`enabled: !authLoading && isLoggedIn && !isAdmin`) until we know who's asking, so it never fires a doomed request. |
| 8 | No 404 page: any unknown URL (typo, stale bookmark, etc.) rendered a completely blank page (`<Routes>` simply matches nothing) | No catch-all route | Added `<Route path="*" element={<NotFoundPage />} />` with a clear "PAGE NOT FOUND" message, full header/nav, and a "BACK TO CATALOG" button. |
| 9 | `/admin/upload` for a logged-in-but-non-admin user, or a fully logged-out user, showed only the generic "ADMIN ACCESS REQUIRED" message with **no navigation at all** — a dead end | `AdminUploadPage`'s gate rendered a bare wordmark with no links | Now renders the shared `<Header />` (so you can always get to the catalog/login/logout) and a context-aware message + CTA: "log in with an admin account" + `GO TO LOGIN` for logged-out visitors, or "you're signed in, but this account isn't an admin" + `BACK TO CATALOG` for regular users. |
| 10 | **Catalog data-integrity trap**: `GET /files` returned files of *any* status (`uploading`, `processing`, `failed`, `ready`). A file that failed processing (e.g. a CSV with a header but no data rows) stayed visible in the public catalog forever, with no sample link and a `BUY` button that always failed with a confusing 404 ("File not available") — a dead end for customers, and a file a storefront admin has no way to clean up. Reproduced by uploading a header-only CSV as `admin@dev.local` and observing it listed on `/` for every visitor. | `filesRouter.get('/')` had no `where` filter on `status` | Added `where: { status: 'ready' }` to the catalog query, so only successfully processed files are ever shown to shoppers. |
| 11 | Admin upload flow reported **false success**: if `/files/:id/process` failed server-side (e.g. bad CSV) the client ignored the response status entirely, still showed "File uploaded and ready in catalog", cleared the form, and invalidated the catalog cache — the admin had no idea the file actually ended up in a `failed` state. Reproduced with the same header-only CSV above. | `AdminUploadPage.handleSubmit` called `fetch(.../process)` and never checked `res.ok` | Now checks the response status; on failure it surfaces the real server error (e.g. "Processing failed: CSV has no data rows beyond the header") via the existing toast + `failed` status UI, and leaves the form populated so the admin can fix and retry instead of silently losing their input. |
| 12 | Visiting `/signup` directly always showed the **LOG IN** tab pre-selected (mode state was hardcoded to `'login'` regardless of the URL), and switching tabs never updated the URL, so refreshing or sharing a `/signup` link didn't behave as expected | `LoginSignupPage`'s `mode` state ignored `location.pathname` | `mode` is now initialized from, and kept in sync with, `location.pathname` (via `useLocation` + an effect), and the tab buttons/"switch mode" links now call `navigate('/login')` / `navigate('/signup')` so the URL and visible tab always agree. |
| 13 | No consistent way to get back to the catalog from `/login`, `/signup`, `/checkout/success`, or `/checkout/cancel` — the `CSV ARCHIVE` wordmark on those pages was static text, not a link | Wordmark rendered as a plain `<span>` with no handler | Wordmark is now clickable (and keyboard-activatable) on every page and navigates to `/`. |
| 14 | `npm install` fails on a fresh clone (breaking the README's documented "fresh machine" quick start) | `package.json` pinned `@prisma/adapter-better-sqlite3` to `^7.10.1`, a version that was never published (latest published is `7.10.0`) | Repinned to `^7.8.0` (matches the other `@prisma/*` packages already in the project), which resolves to the latest real `7.10.0` release. Regenerated `package-lock.json` against the real npm registry so the whole tree installs cleanly end to end (verified with a from-scratch `npm install`, then a full `dev:mocks` run). |
| 15 | `server:build` failed to compile (`apiVersion` literal type error) once dependencies were reinstalled | `stripe.ts` hardcoded `apiVersion: '2026-06-24.dahlia'`, which isn't a valid literal for the `stripe` version that actually installs from the (fixed) lockfile (it expects `'2026-08-26.dahlia'`) | Updated the literal to match. This is a type-only change with zero behavioral effect in `dev:mocks` — `getStripe()` is never invoked in mocks mode (`createCheckoutSession` short-circuits and returns a fully mocked session), so Stripe itself is untouched. |

## 3. Things reviewed and confirmed **not** to be traps

- Clicking "SAMPLE" on the catalog triggers a real file download (server sends `text/csv`, and the browser treats that as a download) rather than navigating away from the SPA.
- The full happy-path purchase flow (login → buy → mocked Stripe checkout → `/checkout/success` → auto-download → `/orders` showing the purchase) works end-to-end after all fixes above, verified with Playwright screenshots.
- Logging out from any page (catalog, orders, admin upload) cleanly returns to a logged-out catalog view with no stale admin/buyer-only UI left over.

## 4. How this was verified

Because this is a headless sandbox, the flows above were exercised with a
scripted Chromium (Playwright) session driving the real `dev:mocks` client
and server (not a mocked/synthetic DOM) — covering: anonymous catalog visit,
direct `/orders` visit while logged out, login, `/login` revisit while
logged in, `/orders` as a buyer, logout, admin login, direct `/orders` visit
as admin (previously crashed), `/admin/upload` as admin and as a non-admin,
a full buy → download flow, a bad CSV upload, and an unknown URL.
