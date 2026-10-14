# ANILyfe V1 Frontend

ANILyfe is a Nigeria-first anime/futuristic e-commerce marketplace. V1 is marketplace-only: no social feeds, followers, DMs, timelines, or community features inside the product.

## Architecture

The frontend is a hash-routed HTML/CSS/JavaScript SPA. Marketplace, seller, order, payment, verification and admin records are backend-owned.

- Frontend: HTML, JavaScript, Tailwind CSS + existing ANILyfe custom CSS
- Backend: Node.js / Express / PostgreSQL / Prisma
- Auth: backend session cookie
- Payments: Paystack-ready backend flow
- Runtime API base: the `anilyfe-api` meta tag or `window.ANILyfeConfig.apiBaseUrl`. If left empty, the frontend uses `http://localhost:4000` only on localhost; production must set the deployed API origin and the API must allow the frontend origin through CORS.

## Tailwind CSS

Tailwind v3.4 drives the UI. The charcoal, purple and gold theme and shared component classes are defined in `tailwind.config.js` and `src/tailwind.css`. The app loads the compiled `css/tailwind.css`; it does not use the Tailwind CDN runtime.

Build from this directory after changing Tailwind source or configuration:

```bash
npm install
npm run build:css
```

Commit the generated `css/tailwind.css` with the frontend.

Legacy custom CSS (`css/style.css`, `components.css`, `animations.css`, `responsive.css`, about 12 KB) is still loaded. It holds the logo gradient, glass effects, keyframes, the marquee and the older `.btn`, `.card`, `.inp` classes used across the admin and seller screens. Migrating those to Tailwind is listed in POST_MVP.md.

## Images and loaders

Most supplied artwork is PNG in `assets/images/`. Broken image URLs fall back to the local `assets/images/placeholder.svg`. Category metadata and image paths are configured in `js/categories.js`; the Gaming Products image uses the placeholder until its artwork is supplied.

Loaders: a full-screen anime splash on first load, and the same mascot loader on every route, tab and section change (buyer, seller, admin), with a blink animation and area-specific messages.

## Shared UI

`js/components.js` provides:

- `AnimeLoader`
- `Skeleton`
- `EmptyState`
- `ErrorState`
- `Badge`
- `Button`
- `Card`
- Original ANILyfe mascot SVG

## Routes

Buyer/public:

- `#/`
- `#/marketplace`
- `#/product/:slug-or-id`
- `#/store/:slug-or-id`
- `#/auth`
- `#/login`
- `#/signup`
- `#/buyer/signup`
- `#/seller/signup`
- `#/search?category=<category-id>`
- `#/wishlist`
- `#/cart`
- `#/checkout`
- `#/orders`
- `#/profile`
- `#/help`
- `#/faq`
- `#/buyer-protection`
- `#/payment-security`
- `#/shipping`
- `#/returns`
- `#/seller-policy`
- `#/marketplace-rules`
- `#/kyc`
- `#/cancellation`
- `#/privacy`
- `#/terms`
- `#/contact`

Seller:

- `#/seller`
- `#/seller/dashboard`
- `#/seller/verification`
- `#/seller/products`
- `#/seller/products/new`
- `#/seller/inventory`
- `#/seller/orders`
- `#/seller/reviews`
- `#/seller/earnings`
- `#/seller/payouts` via Seller Center payout controls
- `#/seller/analytics`
- `#/seller/delivery`
- `#/seller/store`
- `#/seller/store/preview`
- `#/seller/settings`

Admin:

- `#/admin-login`
- `#/admin`
- `#/admin/dashboard`
- `#/admin-dashboard`

Unknown routes render the ANILyfe 404 state.

## Data rules

No marketplace users, sellers, products, orders, balances, ratings, reports, or payments are seeded into the frontend. Prisma seed only contains system configuration.

Browser storage is reserved for UI preferences such as region selection, announcement dismissal and the current V1 wishlist limitation. Server-owned marketplace records are read through the API layer.

## Local development

Serve the frontend through a local HTTP server rather than `file://`:

```bash
npx --yes http-server . -p 5500
```

Open `http://localhost:5500`.

Start the backend separately from `backend/anilyfe_backend_build` with its configured `.env`.

Do not commit `.env`, database passwords, JWT secrets or payment secrets.

## QA documents

- `BRAND_SYSTEM.md`
- `ERROR_AUDIT_REPORT.md`
- `QA_CHECKLIST.md`
- `POST_MVP.md`
- `ASSET_CREDITS.md`
"# Myanilyfe-frontend-V1" 
