# ANILyfe V1 QA Checklist

Legend: PASS = statically verified or directly enforced by source. NOT RUN = requires a real browser/backend environment.

| Journey | Loading | Success | Empty | Error | Unauthorized | Mobile | Status |
|---|---|---|---|---|---|---|---|
| Homepage | PASS | PASS | PASS | PASS for product API state | N/A | NOT RUN | Partial |
| Register | PASS via splash/route loader | PASS via `/api/auth/register` | N/A | PASS structured API toast | N/A | NOT RUN | Partial |
| Login | PASS via route loader | PASS via `/api/auth/login` | N/A | PASS structured API error | PASS | NOT RUN | Partial |
| Marketplace | PASS | PASS when products exist | PASS: `No products to display` | PASS: API error state | PASS | NOT RUN | Partial |
| Product | PASS | PASS via API product lookup | PASS seller store/product state | PASS 404/error state | PASS for private products | NOT RUN | Partial |
| Cart | PASS | PASS via `/api/cart` | PASS mascot empty state | PASS API error state | PASS redirects to auth | NOT RUN | Partial |
| Checkout | PASS | PASS order → payment initialization | PASS empty-cart state | PASS backend error | PASS | NOT RUN | Partial |
| Payment | PASS route/return handling | PASS Paystack verification path | N/A | PASS pending/verification message | PASS | NOT RUN | Partial |
| Orders/tracking | PASS | PASS via `/api/orders` | PASS: `No orders to display` | PASS API error state | PASS | NOT RUN | Partial |
| Become Seller | PASS | PASS `/api/sellers/apply` | N/A | PASS backend validation | PASS | NOT RUN | Partial |
| KYC | PASS | PASS backend status flow | PASS Not Started | PASS submission error | PASS seller role required | NOT RUN | Partial |
| Seller approval | PASS waiting route | PASS admin approval endpoint | PASS no products/orders | PASS backend error | PASS protected | NOT RUN | Partial |
| Seller Center | PASS | PASS API adapters | PASS section empty states | PASS `Seller Center unavailable` | PASS | NOT RUN | Partial |
| Product creation | PASS | PASS backend product create | PASS draft state | PASS API validation | PASS seller role + approval enforced | NOT RUN | Partial |
| Product approval | PASS | PASS admin approval endpoint | PASS no pending products | PASS rejection/error | PASS admin role required | NOT RUN | Partial |
| Admin login | PASS session restore architecture | PASS backend admin login | N/A | PASS backend error | PASS | NOT RUN | Partial |
| Admin dashboard | PASS | PASS API-backed dashboard | PASS real empty records | PASS dashboard error state | PASS | NOT RUN | Partial |
| Admin users/sellers/products/orders | PASS | PASS API mutations | PASS real empty labels | PASS structured API errors | PASS role middleware | NOT RUN | Partial |
| Admin support | PASS | PASS `/api/support` + admin inbox | PASS no tickets | PASS API error | PASS | NOT RUN | Partial |
| Announcements | PASS | PASS backend create/delete | PASS no announcements | PASS upload/API error | PASS admin role | NOT RUN | Partial |
| Shareable product/store links | PASS | PASS slug/id routing | N/A | PASS 404 | Public published data only | NOT RUN | Partial |

## Static gate completed
- Frontend JavaScript syntax: PASS.
- Backend source JavaScript syntax: PASS.
- Removed frontend mock JSON marketplace datasets: PASS.
- Removed social-media feature scripts/routes: PASS.
- No marketplace records seeded by Prisma seed: PASS.
