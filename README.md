# Ampelos Studio — ampelos.studio

The official site for **Ampelos Studio**, the independent game studio of Jerrix.

The homepage is dedicated to the studio's debut title, **Endless Summer Syndrome** (无休夏日综合症) — a surreal psychological visual novel, coming soon to Steam.

## Structure

- `index.html` — Endless Summer Syndrome landing page (hero, story, features, gallery, Steam wishlist).
- `presskit.html` — press kit: fact sheet, description, features, screenshots, logo, credits, streaming permission. Downloadable asset bundle at `assets/games/ess/ess-presskit.zip`.
- `the-faded.html` — *The Adolescence of a Lunatic* project page.
- `once-upon-a-spring.html` — *Once Upon a Spring* project page.
- `css/home.css` — design system + page styles.
- `js/home.js` — nav, scroll reveals, gallery lightbox, ambient video, language preference.
- `assets/games/ess/` — Endless Summer Syndrome web art (optimized from the game build).
- `assets/images/` — art for the other two projects.
- `zh/` — Simplified-Chinese mirror of all four pages (`zh/index.html`, `zh/presskit.html`, `zh/the-faded.html`, `zh/once-upon-a-spring.html`). Shares `css/`, `js/`, and `assets/` via `../` — nothing is duplicated except the HTML.

## Localization

- English is the default, served at the root (`/`). Simplified Chinese lives under `/zh/`.
- Each page links to its counterpart via the `EN` / `中文` switcher in the nav (`[data-lang-switch]`). `js/home.js` stores the visitor's choice in `localStorage` and, on a return visit, redirects to the last-chosen language. First-time visitors always get English.
- Every page cross-declares both languages with `<link rel="alternate" hreflang>` (`en`, `zh-Hans`, `x-default`) for SEO.
- When editing copy, update **both** the English page and its `zh/` counterpart.

## Notes

- Static site hosted on GitHub Pages at the custom domain `www.ampelos.studio`.
- Hero, gallery, and social images are web-optimized exports of the game's key art.
