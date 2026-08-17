/**
 * Vinyl Cut brand tokens for transactional emails. Colors are hex, converted
 * from the site's real oklch theme (apps/storefront/src/styles/themes/vinyl-cut.css)
 * since oklch() isn't reliably supported by email clients. Fonts include
 * web-safe fallback stacks since custom @font-face fonts are unreliable in
 * email (Outlook desktop especially) — the Google-Fonts name is a
 * best-effort first choice, not a guarantee.
 *
 * Shared by every template under emails/ so brand values live in one place.
 */
const colors = {
  base100: '#0F172A',
  base200: '#0C1425',
  base300: '#0A1120',
  primary: '#FFD6A7',
  secondary: '#9D6044',
  accent: '#FF8904',
  neutral: '#1E293B',
  rust: '#B33736',
};

const fonts = {
  script: '"Lobster", "Brush Script MT", cursive',
  heading: '"Bungee", Impact, "Arial Black", sans-serif',
  body: '"Outfit", -apple-system, "Helvetica Neue", Arial, sans-serif',
};

const brandCopy = {
  copyrightName: 'The Vinyl Cut',
  supportEmail: 'vinylcut@narcisolobo.com',
};

/**
 * No logo asset exists yet — the user is creating one. Once it's exported
 * as a PNG (SVG support is unreliable in email clients) and uploaded to the
 * `vinyl-cut` Supabase Storage bucket under `brand/`, set this to the
 * resulting public URL to swap it into order-placed.tsx's header.
 */
const assets = {
  logoUrl:
    'http://127.0.0.1:54321/storage/v1/object/public/vinyl-cut/the-vinyl-cut-logo.png',
};

export { assets, brandCopy, colors, fonts };
