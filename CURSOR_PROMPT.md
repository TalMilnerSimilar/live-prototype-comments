# 🧩 Cursor Integration – Live Prototype Comments (LPC)

Use this in any project to add the full LPC experience: Comment Mode button, pins, sidebar with replies, delete, SPA support, anchoring, CORS, and Netlify Blobs persistence.

- Works in static sites and common frameworks (Vite/CRA/Next/Vue/etc.)
- Each project uses its own Netlify domain and isolated data
- No framework dependency; widget is vanilla JS

---

## What Cursor should do (high level)
- Add the widget file so it’s served statically from the project’s domain
- Add the Netlify Function `/.netlify/functions/comments` (ESM + Netlify Blobs)
- Ensure build config points to `netlify/functions`
- Add a `<script>` tag that loads the widget and points to the function
- Install `@netlify/blobs@^7`
- Verify in dev: pins, sidebar, replies, delete, SPA route detection

---

## Ready-to-paste prompt for Cursor

Paste everything below into Cursor in your target project.

```md
You are the project engineer. Integrate the Live Prototype Comments (LPC) service into THIS project so it’s self-hosted on this project’s Netlify site and provides the full feature set (Comment Mode button, pins, sidebar with replies, delete, SPA route detection, anchoring to elements with data-annotate-id or robust selectors, CORS, optimistic rendering). Follow these steps exactly and keep edits minimal.

Use the step-by-step instructions from `CURSOR_INSTRUCTIONS.md` in the LPC repo as the authoritative plan. Fetch and follow it verbatim.

Authoritative instructions URL:
- https://raw.githubusercontent.com/TalMilnerSimilar/live-prototype-comments/master/CURSOR_INSTRUCTIONS.md

1) Create required folders (don’t duplicate if present)
- Create `netlify/functions/`
- Prefer a public static root for assets:
  - If `public/` exists (Vite/CRA/Next/Vue), use `public/`
  - Else if `static/` exists, use `static/`
  - Else create `public/`

2) Add the serverless API (ESM Netlify Function)
- Create file `netlify/functions/comments.mjs` with the contents from:
  - https://raw.githubusercontent.com/TalMilnerSimilar/live-prototype-comments/master/netlify/functions/comments.mjs
- Ensure it’s saved exactly with `.mjs` extension.

3) Add the widget
- Download `comments-widget.js` and place it in the chosen static dir from step 1 (e.g., `public/comments-widget.js`). Source URL:
  - https://raw.githubusercontent.com/TalMilnerSimilar/live-prototype-comments/master/comments-widget.js

4) Wire up the widget in the app
- If there’s an HTML entry (e.g., `index.html` in `public/`): insert before `</body>`
  ```html
  <script defer
    src="/comments-widget.js"
    data-endpoint="/.netlify/functions/comments">
  </script>
  ```
- If the app is Next.js (Pages Router): add the same `<script>` to `pages/_document.(js|tsx)` inside `<Head>` or before `</body>`.
- If the app is Next.js (App Router): add to `app/layout.(js|tsx)` with a `<script>` tag and `defer`.
- If there’s no top-level HTML, dynamically inject on client mount (React/Vue) with:
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

5) Netlify configuration
- If `netlify.toml` exists, modify only what’s needed. Ensure:
  ```toml
  [build]
    functions = "netlify/functions"
  ```
  (Do NOT overwrite existing publish/build settings.)
- If `netlify.toml` does not exist, create it with:
  ```toml
  [build]
    functions = "netlify/functions"
  ```

6) Dependencies
- Ensure `package.json` includes:
  - Install: `npm i @netlify/blobs@^7`
  - If there is no `type` field, you may set `"type": "module"` (safe for ESM). If the project is CJS, leaving it unset is OK since the function is `.mjs`.
  - Optional scripts (only add if missing):
    ```json
    {
      "scripts": {
        "dev": "netlify dev",
        "build": "echo 'no build'"
      }
    }
    ```

7) Environment variables (in Netlify UI or via CLI later)
- `ALLOWED_ORIGINS`: comma-separated domains of consuming sites (e.g., the same site’s prod + localhost dev)
- `DELETE_SECRET`: optional, for admin deletions

8) Verification checklist (run locally)
- Start dev environment. If using Netlify dev: `npx -y netlify-cli@17 dev`
- Open the app. Add `?review=1` to the URL or click the Comment Mode icon to enable.
- Confirm:
  - Comment Mode button appears on the right edge
  - Hover highlight on containers; click to anchor; prompt shows
  - Pins render; sidebar pushes content (not overlay)
  - Replies work; delete own comments works with confirmation
  - Cross-highlighting pin ⇄ sidebar on hover
  - SPA support: navigating routes reloads comments

9) Notes for anchoring and stability
- Prefer to add `data-annotate-id` to stable containers where you want comments to stick. The widget also generates robust selectors if none exists.

10) Keep changes minimal
- Do not remove or refactor existing app logic. Only add the widget, the function, and config.
- Avoid changing the app’s build/publish settings unless necessary.

When finished, summarize what was added, where the script tag was inserted, and how to run locally and deploy on Netlify.
```

---

## Optional – one-liner include (using your separate LPC site)
If your team prefers a separate, dedicated LPC site per person, use the deployed domain instead of bundling the widget in each project:

```html
<script defer
  src="https://YOUR-LPC-SITE.netlify.app/comments-widget.js"
  data-endpoint="https://YOUR-LPC-SITE.netlify.app/.netlify/functions/comments">
</script>
```

Be sure `ALLOWED_ORIGINS` on that LPC site includes the consuming project’s domains.

---

## After integration
- Add `?review=1` to any page to toggle Comment Mode (or use the icon)
- Add `data-annotate-id` to key containers for stable pin anchoring
- Deploy to Netlify; comments will persist via Netlify Blobs, per project domain

```text
Support: see `INTEGRATION.md` in the LPC repo for more examples (React/Vue/Next)
```
