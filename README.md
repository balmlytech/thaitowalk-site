# Thai To Walk — website

Fast Thai street food, Bedford. Static site (HTML/CSS/JS), no build step, no dependencies.

## Structure

```
index.html        Landing page (editorial type + wok & flame hero)
menu.html         Full menu (typographic "fine-dining sheet" style)
css/style.css     Brand design system + landing styles
css/menu.css      Menu page styles
js/main.js        Flame canvas, header, scroll reveals, overlay nav
images/           Logos (transparent PNG) + the one real food photo
robots.txt        Search-engine directives
sitemap.xml       Sitemap for Google
```

Design system: dark-first "night market" theme. Fraunces (display serif),
Hanken Grotesk (body), Space Mono (labels/prices), Chonburi (Thai script
accents) — all via Google Fonts. Brand orange `#F58220` on warm charcoal
`#161412` with bone `#F6F0E6` light sections.

## Run locally

Any static server. For example:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

Open with a server (not by double-clicking the file) so the `/css/...`
absolute paths resolve correctly.

---

## Deploying via GitHub + Claude Code

1. In Claude Code, open this folder and let it run:
   ```
   git init
   git add .
   git commit -m "Initial Thai To Walk site"
   ```
2. Create a new GitHub repo (e.g. `thaitowalk-site`) and push to it.
3. Connect a host to the repo. Easiest free options for a static site:
   - **Cloudflare Pages**, **Netlify**, or **Vercel** — connect the repo,
     no build command, output directory = root (`/`).
4. Point the domain. In your **123 Reg** DNS settings, follow the host's
   custom-domain instructions (usually a CNAME for `www` and either an A
   record or CNAME flattening for the apex `thaitowalk.com`). Each host
   shows the exact records to add.

---

## SEO — already built in

- Unique `<title>` + meta description on each page
- Open Graph + Twitter card tags (link previews on social/WhatsApp)
- `Restaurant` structured data on the homepage (name, address, cuisine,
  geo, menu link) and a `Menu` schema on the menu page — this is what can
  put your hours/location/menu into Google's rich results
- `sitemap.xml` and `robots.txt`
- Semantic HTML, single `<h1>` per page, descriptive `alt` text
- Fast: system/Google fonts, no frameworks, lazy-loaded map,
  flame effect respects `prefers-reduced-motion`

### After launch — do these (biggest local-SEO wins)

1. **Create a free Google Business Profile** for 94 High Street, Bedford.
   For a local takeaway this matters more than anything on the site — it's
   what puts you on Google Maps and in "Thai food near me". Keep the name,
   address and (later) phone identical to the website.
2. In **Google Search Console**, add the property and submit
   `https://thaitowalk.com/sitemap.xml`.
3. When you have a **phone number and socials**, add them — see below.

---

## Updating content

### Swap a placeholder photo for a real dish photo
In `menu.html`, each dish has an image block. Replace the placeholder:
```html
<!-- before -->
<img class="ph" src="/images/logo-icon.png" alt="" aria-hidden="true" />
<!-- after -->
<img src="/images/pad-krapow.jpg" alt="Pad Krapow with chicken, chilli and basil" />
```
Drop the photo into `images/`, point `src` at it, write a real `alt`.
(Aim for ~1200px wide, landscape, well-lit, no old logo watermark.)

### Add phone number / socials later
- Phone: add `"telephone": "+44..."` to the JSON-LD in `index.html`, and a
  phone line in both footers.
- Socials: add the links in the footer `Visit`/new `Follow` column, and add
  a `"sameAs": ["https://...", "..."]` array to the homepage JSON-LD.

### Change opening hours
Add an `openingHoursSpecification` block to the `Restaurant` JSON-LD in
`index.html` and show them in the "Find us" section.
```

---

## Notes

- The logos are transparent PNGs processed from the brand artwork. For
  maximum crispness at large sizes you may later want true vector (SVG)
  versions, but the PNGs are fine to launch with.
- The map shows a "host not allowed" message only inside restricted
  preview environments; it loads normally on the live site.
