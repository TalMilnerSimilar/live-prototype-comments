# Cursor Instructions: Integrate Live Prototype Comments (LPC)

These are explicit, linear steps for Cursor to perform in any target project. Keep changes minimal and additive.

## 0) Preconditions
- Node >= 18
- Use Netlify Functions (ESM) + Netlify Blobs
- Do not overwrite existing build/publish settings; only add what’s needed

### 0.1) Critical anchoring requirements (must-do)
- Pins MUST anchor to containers, not viewport XY.
- Add `data-annotate-id` to stable, persistent containers (e.g., main content wrapper, major sections, cards).
  - Prefer short stable keys: `data-annotate-id="main"`, `"content"`, `"sidebar"`, etc.
  - If you cannot modify many files, at least annotate the top-level page container (e.g., `<main>`/`#root`/primary layout wrapper).
- Ensure the widget loads AFTER the app’s DOM is mounted/hydrated, so selectors resolve to real nodes.

## 1) Create required directories
- Ensure `netlify/functions/` exists
- Choose a static assets directory (prefer this order):
  1. `public/`
  2. `static/`
  3. create `public/`

## 2) Add the serverless API
- Create `netlify/functions/comments.mjs` from this URL:
  - https://raw.githubusercontent.com/TalMilnerSimilar/live-prototype-comments/master/netlify/functions/comments.mjs
- Save as `.mjs` exactly (ESM)

## 3) Add the widget
- Download `comments-widget.js` from:
  - https://raw.githubusercontent.com/TalMilnerSimilar/live-prototype-comments/master/comments-widget.js
- Place it at the static directory root as `/comments-widget.js` (e.g., `public/comments-widget.js`)

## 4) Wire up the widget
- If there is a top-level HTML file (e.g., `public/index.html`), insert before `</body>` (ensures app DOM exists):
```html
<script defer
  src="/comments-widget.js"
  data-endpoint="/.netlify/functions/comments">
</script>
```
- Next.js (RECOMMENDED): use Next Script so it runs after hydration
  - Pages Router (`pages/_app.(js|tsx)`):
    ```tsx
    import Script from 'next/script';
    // ...inside App component render
    <Script
      src="/comments-widget.js"
      strategy="afterInteractive"
      defer
      data-endpoint="/.netlify/functions/comments"
    />
    ```
  - App Router (`app/layout.(js|tsx)`):
    ```tsx
    import Script from 'next/script';
    export default function RootLayout({ children }) {
      return (
        <html>
          <body>
            {children}
            <Script
              src="/comments-widget.js"
              strategy="afterInteractive"
              defer
              data-endpoint="/.netlify/functions/comments"
            />
          </body>
        </html>
      );
    }
    ```
- If needed, support dynamic injection for client-only mount (React/Vue):
```jsx
useEffect(() => {
  if (document.querySelector('script[data-endpoint="/.netlify/functions/comments"]')) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = '/comments-widget.js';
  s.setAttribute('data-endpoint', '/.netlify/functions/comments');
  document.body.appendChild(s);
  return () => s.remove();
}, []);
```

## 5) Netlify configuration
- If `netlify.toml` exists, ensure it contains:
```toml
[build]
  functions = "netlify/functions"
```
  Do not overwrite other build/publish settings.
- If missing, create `netlify.toml` with exactly above content.

## 6) Dependencies
- Add `@netlify/blobs@^7` to `dependencies`:
```bash
npm i @netlify/blobs@^7
```
- If `package.json` has no `type`, setting `"type": "module"` is allowed; if the app is CJS, leave it unset—the function is `.mjs` so it’s fine.
- Optional scripts if missing:
```json
{
  "scripts": {
    "dev": "netlify dev",
    "build": "echo 'no build'"
  }
}
```

## 7) Environment variables (Netlify UI later)
- `ALLOWED_ORIGINS`: comma-separated domains for consuming sites (include local dev)
- `DELETE_SECRET`: optional, for admin deletions

## 8) Verification (local)
- Run: `npx -y netlify-cli@17 dev`
- Open the app, add `?review=1` or click the Comment Mode icon
- Confirm:
  - Comment Mode button (right edge)
  - Hover highlight and click-to-anchor
  - Pins render; sidebar pushes content
  - Scroll and resize: pins stay attached to the selected container (not absolute XY)
  - Replies and delete own comments (with confirmation)
  - Cross-highlighting pin ⇄ sidebar item
  - SPA route changes reload comments

## 9) Anchoring guidance
- Prefer `data-annotate-id` on stable containers for durable pins

## 10) Deliverable summary
- Report the files added/edited
- Where the `<script>` was inserted
- How to run locally and deploy to Netlify
