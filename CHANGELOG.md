# Changelog — Security, Admin & UI Overhaul

## 🔒 Critical security fixes

1. **`/api/admin/register` was completely open** — anyone could POST to it
   and create themselves an admin account with full access to your store.
   Now it only works to create the very first admin (bootstrap), and after
   that requires an existing admin session.
2. **The admin panel's page-level auth check was commented out** in the old
   `app/admin/layout.js` — visiting any `/admin/*` page rendered the
   dashboard shell for anyone, logged in or not. Restructured into
   `app/admin/(protected)/layout.js`, which actually redirects unauthenticated
   visitors, plus `middleware.js` now covers `/admin/*` too (it didn't
   before).
3. **Order totals/prices were trusted from the browser.** A shopper could
   edit cart data in devtools/localStorage and check out for any price they
   wanted. `/api/orders` now re-prices every line item from the `products`
   table and recomputes any coupon discount server-side.
4. **Razorpay "payment succeeded" was trusted from the client**, with no
   server-side verification before the order was recorded as paid. `/api/orders`
   now re-verifies the payment signature itself (with a timing-safe
   comparison) before marking anything paid.
5. **Image uploads had a path-traversal risk** (the original filename was
   used directly) and no type/size validation. `lib/upload.js` now
   generates random filenames, validates MIME type, and caps size at 5MB.
6. **Hardcoded login credentials** were sitting in the login page's source,
   pre-filling a real account's email and password for every visitor.
   Removed.
7. **A public `/api/test-db` route** exposed database connectivity/error
   info to anyone. Removed.
8. **An unauthenticated product-edit endpoint** (`PUT /api/products/[id]`)
   let anyone change any product's price/name/etc. Removed (the admin
   version at `/api/admin/products/[id]` already covers this, properly
   authenticated).
9. Cookies didn't set `secure`/`sameSite` flags. Fixed on all auth cookies.
10. Login/register/admin-login had no rate limiting. Added a lightweight
    in-memory limiter (see the note in `lib/rateLimit.js` about scaling this
    to Redis if you deploy multiple instances).
11. Passwords and full DB rows (including password hashes) were being
    logged to the server console. Removed.

## 🧹 Dead code removed

- `/api/menu` — exact duplicate of `/api/products`, unused
- `/api/orders/user` — duplicate of `/api/orders` GET, unused
- `/api/orders/[id]` — an empty file
- `/api/orders/confirm` — leftover, never-reachable Stripe integration
  (checkout only ever used Razorpay)
- Unused npm packages: `axios`, `jose`, `nodemailer`, `pdfkit`,
  `react-hot-toast`, `socket.io`, `socket.io-client`, `stripe`
- ~10 copies of the same admin-auth-check boilerplate, collapsed into
  `lib/adminAuth.js`
- A stale `TODO.md` describing a fix that had already been applied
- `jsconfig.json` — a leftover duplicate of the `@/*` path alias that
  `tsconfig.json` already defines (this project has TypeScript files, so
  Next.js uses `tsconfig.json`; the jsconfig was dead weight)
- A stale entry in `tsconfig.json`'s `include` list pointing at
  `app/api/test-db/route.js` — a file removed earlier in the security
  cleanup

## 🐛 Correctness bugs fixed along the way

- User logout was silently broken — `/api/auth/logout` didn't exist, so the
  session cookie was never cleared
- The cart badge in the navbar only updated after a full page reload
  within the same tab (it relied on the `storage` event, which doesn't fire
  in the tab that made the change)
- The admin products list expected pagination fields (`page`, `totalPages`)
  the API never returned
- Checkout collected delivery address, payment method, and coupon
  info that the old `/api/orders` silently discarded
- Missing `.env.example` — there was no documentation of which environment
  variables the app needs
- **The Profile page showed hardcoded fake data** ("John Doe",
  `user@pizza.com`) for every single user instead of their real account —
  editing and "saving" it never touched the database. Added real
  `phone`/`address` columns, a `/api/profile` GET/PATCH route, and wired
  the page to actual user data. Checkout now pre-fills from it too.
- The admin coupon form let you pick "Flat (₹)", which sent `type: "flat"` —
  a value the backend has never accepted (only `"percent"`/`"fixed"`), so
  creating a fixed-amount coupon silently failed every time. Fixed the
  dropdown value.
- `lib/auth.js`'s `getUserFromToken`/`getAdminFromToken` were dead code and
  also broken (called `cookies()` without `await`, which this Next.js
  version requires). Fixed and put `getUserFromToken` to use in
  `/api/profile`; removed the now-redundant `getAdminFromToken` in favor of
  `lib/adminAuth.js`.
- Two leftover `window.dispatchEvent(new Event("storage"))` calls in the
  menu pages were a workaround for the cart-badge bug above; removed now
  that `lib/cart.js` handles it properly.
- Admin orders view had no way to see the customer's name/delivery address
  when fulfilling an order — only line items. Added.

## ✨ New: admin can now control

- **Settings** (`/admin/settings`) — homepage hero text, promo banner,
  which homepage sections show, delivery fee, free-delivery threshold,
  minimum order, tax %, opening hours, contact info, social links. All
  live on the site immediately via `/api/settings`.
- **Users** (`/admin/users`) — search customers, block/unblock accounts,
  add new admin/staff accounts (replacing the old wide-open registration
  page)
- **Featured/available products** — mark items as homepage-featured or
  temporarily unavailable without deleting them

## 🎨 UI & responsiveness

- Navbar rebuilt with a working mobile menu (previously had zero mobile
  support — fixed pixel padding, no hamburger)
- New Footer with contact/social info pulled from Settings
- Homepage now reads its hero copy, banner, and featured products from
  Settings/Products instead of being hardcoded
- Admin panel restyled with a responsive, collapsible sidebar
- Admin Dashboard, Coupons, and Orders pages all rewritten in Tailwind to
  match the rest of the panel (previously plain inline styles); Orders
  now also shows the customer's name/delivery address when you open an
  order, which it never did before
- Login/register/admin-login pages restyled for visual consistency
- Checkout page rewritten (was inline-styled, non-responsive, and out of
  sync with the API) — now responsive, matches the new order API, and
  pre-fills from the customer's saved profile
- Fixed non-responsive two-column layouts on the Cart and Orders pages that
  forced horizontal squeezing on phone-width screens

## 🚨 A latent bug the cleanup surfaced

`app/order-success/` had **two** files defining the same route —
`page.js` and `page.jsx`. Next.js was silently resolving to the older,
simpler `page.js`, which is why a real requirement (`useSearchParams()`
needs a Suspense boundary) never surfaced as a build error even though
`page.jsx` violated it. Removing the duplicate exposed this immediately;
fixed by wrapping the search-params-dependent part in `<Suspense>`. Worth
being aware this class of bug (duplicate route files silently shadowing
each other) can hide real errors indefinitely — always worth checking for
stray `page.js`/`page.jsx`/`page.tsx` siblings in the same folder.

## 🚨 A build-breaking bug in this update itself

`app/api/razorpay/create-order/route.js` instantiated the Razorpay SDK
client at **module load time** (`const razorpay = new Razorpay(...)` at
the top of the file, outside the handler). Next.js evaluates route modules
during `next build`'s page-data collection step — not just at request
time — so if `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` weren't set in the
environment `npm run build` ran in, the SDK constructor threw immediately
and took the whole build down with
`Error: key_id or oauthToken is mandatory`, even though no order was
actually being created yet. Fixed by moving the client instantiation
inside the `POST` handler (with a clear 500 + log message if the keys are
genuinely missing at request time) so the build no longer depends on
secrets being present. Verified by building both with and without those
two env vars set.

## ⚠️ Known gaps / things to look at next

- The Profile, Orders, Cart, and product-detail pages still use their
  original inline-style approach rather than Tailwind. They're already
  reasonably modern-looking and responsive (checked specifically for
  fixed-width layouts that would break on phones), so this is a cosmetic
  consistency item, not a functional one — the whole admin panel and all
  auth/checkout pages are now Tailwind-based.
- A handful of pre-existing lint warnings remain (calling `setState`
  directly in a `useEffect` body, `Date.now()` used during render) — these
  don't affect correctness or block the build, just React's newer
  strict-mode linting preferences.
- `middleware.js` uses Next's deprecated-but-still-supported "middleware"
  convention (a soft deprecation warning appears at build time); consider
  migrating to `proxy.js` when you upgrade Next.js further
- Rate limiting is in-memory — fine for a single instance, but swap in a
  shared store (Redis/Upstash) if you ever run multiple instances
