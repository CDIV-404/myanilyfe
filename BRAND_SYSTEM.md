# ANILyfe V1 Brand System

## Identity
ANILyfe is a Nigerian anime/futuristic e-commerce marketplace. V1 is marketplace-only: no feeds, followers, communities, DMs, or social timelines inside the product.

## Palette
- Primary blue: `#334EAC`
- Deep navy: `#081F5C`
- Supporting blue: `#708BD1`
- Light blue: `#E7F1FF`
- Border blue: `#D0E3FF`
- Background: `#F6FCFF`
- White: `#FFFFFF`
- Success: `#1F9D55`
- Warning: `#B7791F`
- Error: `#B42318`
- Info: `#2563EB`

## Typography
- Display: Sora
- UI/body: Manrope
- Technical labels: Chakra Petch

## Logo
Until the supplied logo image variants are added, the shared wordmark uses blue with navy lettering on light surfaces and blue with white lettering on dark surfaces.

## Components
Tailwind component primitives are defined in `src/tailwind.css` and `tailwind.config.js`.
Shared runtime primitives are in `js/components.js`:
Button, Card, Badge, Input styling, AnimeLoader, Skeleton, EmptyState and ErrorState.

## Motion
Motion is short and functional: page entrance, loader pulse/blink, product hover and lightweight feedback. `prefers-reduced-motion` is respected by the existing animation layer.

## Mascot
The ANILyfe mascot is original inline SVG artwork. No copyrighted anime character artwork is used in the loader or empty/error states.
