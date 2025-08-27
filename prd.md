Awesome—here’s everything you asked for, ready to drop into a repo and to use with Cursor.

---

## A) `prd.md` (copy-paste this as a file in your repo)

````markdown
# Live Prototype Comments (LPC) — PRD v1.0

**Owner:** Tal Milner  
**Date:** 2025‑08‑26  
**Goal:** Add pin‑style comments and threaded replies to any live prototype with a single `<script>` include, without standing up a traditional backend.

---

## 1) Context & Objectives
- We ship clickable prototypes (Cursor ➝ GitHub ➝ Netlify) and want reviewers to leave comments directly on the live page.
- Must work on Netlify **Free** plan and be embeddable across many projects.
- Keep infra minimal and in our control.

**Decision:** Use **Netlify Functions** as our API and **Netlify Blobs** as the JSON store. One shared “comments service” site hosts the API and a tiny embeddable widget.

---

## 2) Users & Scenarios
- **Stakeholder/Reviewer**: clicks anywhere on the page in *Review Mode* to drop a pin and write a comment, or reply to an existing one.
- **Designer/Engineer**: opens the same page and sees pins/threads; can reply.
- **Moderator (internal)**: optional delete via a secret token for now (no UI).

---

## 3) Requirements

### 3.1 Functional (MVP)
1. **Create comment**: POST via API with `pageUrl`, `text`, optional `author`, `anchor`, and optional `parentId` (for replies).
2. **List comments**: GET by `pageUrl`.
3. **Threading**: comments can have `parentId`; list returns a flat array; UI nests replies under parents.
4. **Anchoring**:
   - Prefer stable selector: element carrying `data-annotate-id="..."`.
   - Fallback: percentage coordinates inside the clicked container.
   - (Optional later) text‑quote anchor for highlighted text.
5. **Widget UI**:
   - Toggle **Review Mode** via `?review=1`.
   - Click to place a pin and submit comment.
   - Sidebar shows threads; clicking a pin opens sidebar.
   - Store display name in `localStorage` on first comment (prompt).
6. **Page identity (thread key)**:
   - Default: `origin + pathname` (e.g., `https://site.netlify.app/products`).
   - Overridable via `data-thread="..."` on the `<script>` tag.
7. **SPA support**: detect `history.pushState` / `popstate`; reload thread when `location.pathname` changes.

### 3.2 Non‑Functional
- Works on **Netlify Free** usage limits.
- No external DB to provision.
- Minimal payload size and JS (target ≤ ~15–25 kB minified for the widget).
- Accessibility: keyboard focusable pins and sidebar controls; ARIA labels.
- Security: escape/sanitize user text; CORS allowlist; no secrets in client.
- Performance: API P95 < 400ms cold, < 150ms warm for list/create at small scale.

### 3.3 Out of Scope (for v1)
- Authenticated identity / SSO.
- Email/Slack notifications.
- Edit comments in place; rich text/markdown; attachments.
- Rate limiting UI (can add server‑side guard later).
- UI delete (v1 uses API secret only).

---

## 4) System Design

### 4.1 Architecture
- **One Netlify site** (“comments-service”)
  - **Static**: `public/comments-widget.js` (the embed script).
  - **Function**: `/.netlify/functions/comments` (REST API).
  - **Storage**: Netlify **Blobs** store named `comments`.

**Other projects** only include the widget script and point to this API.

### 4.2 Data Model
```ts
type Comment = {
  id: string;               // uuid
  pageUrl: string;          // normalized origin + pathname OR explicit thread id
  author: string;           // "Anonymous" default
  text: string;             // <= 4000 chars; HTML-escaped on render
  parentId?: string | null; // replies
  createdAt: string;        // ISO timestamp
  anchor: {
    selector?: string;             // e.g., [data-annotate-id="hero-cta"]
    xy?: { xPct: number; yPct: number }; // coordinates relative to target container
    // (reserved for later: text quote anchor)
  };
};
````

**Blob key:**
`<pageUrl-normalized>/<id>.json`
Example: `https://site.netlify.app/products/4cf2d3c0...json`

### 4.3 API

**Base:** `/.netlify/functions/comments`

* `GET ?pageUrl=<url-or-thread>` → `Comment[]` (200)

  * `pageUrl` may be a full URL; server normalizes to `origin+pathname`.
* `POST` JSON body:

  ```json
  {
    "pageUrl": "https://site.netlify.app/products",
    "author": "Tal",
    "text": "Center this block",
    "anchor": { "selector": "[data-annotate-id=\"hero\"]", "xy": { "xPct": 62.5, "yPct": 18.1 } },
    "parentId": null
  }
  ```

  → created `Comment` (201)
* `DELETE ?key=<blobKey>&secret=<DELETE_SECRET>` → 204

**CORS**: Allow only origins in `ALLOWED_ORIGINS` (comma‑separated). If empty, allow `*` (dev only).

### 4.4 Configuration (env)

* `ALLOWED_ORIGINS` — comma separated origins (`https://project-a.netlify.app,https://project-b.netlify.app`).
* `DELETE_SECRET` — random string; required to call DELETE.

---

## 5) UX Specification

**Review toggle**

* A small floating button “Review” shows when the widget loads.
* `?review=1` in the URL toggles Review Mode on page load.

**Pin creation**

* In Review Mode, clicking on the page opens a prompt for comment text.
* Display name prompt appears once (stored in `localStorage`).

**Sidebar**

* Right‑side panel listing parent comments (newest last) and nested replies (chronological).
* Each item shows **author**, **time**, **text**, and **Reply** button.
* Clicking a pin opens/closes the sidebar.

**Accessibility**

* Pins are focusable buttons with `aria-label="Comment by {author}"`.
* Sidebar landmarks and readable focus ring.

---

## 6) Acceptance Criteria

* **AC1:** Creating a comment from `?review=1` shows a pin exactly where clicked, persists on refresh, and appears to other users.
* **AC2:** Replies are associated with the parent and render nested in sidebar.
* **AC3:** Comments are isolated per page by default; passing `data-thread="xyz"` groups across pages if desired.
* **AC4:** Inputs are escaped (no raw HTML injection); no console errors on load.
* **AC5:** From a disallowed origin, POST is blocked by CORS.
* **AC6:** SPA route change triggers a reload of the thread within 300ms.

---

## 7) Deliverables & Repo Layout

```
comments-service/
├─ netlify/
│  └─ functions/
│     └─ comments.mjs        # ESM Netlify Function (GET/POST/DELETE)
├─ public/
│  ├─ comments-widget.js     # Embeddable widget (no framework)
│  └─ demo.html              # Simple demo page for manual QA
├─ netlify.toml              # functions & publish dirs
├─ package.json              # deps: @netlify/blobs
├─ README.md                 # quick start, embed guide
└─ prd.md                    # this document
```

---

## 8) Implementation Notes

* **Normalization**: server converts any provided `pageUrl` to `origin+pathname`. Widget uses explicit `data-thread` when provided; else `location.origin+location.pathname`.
* **Anchoring**:

  * Preferred: add `data-annotate-id` attributes to important containers.
  * Fallback: percent coordinates relative to container’s bounding box.
* **Sanitization**: escape `<`, `>`, `&` on render.
* **SPA support**: wrap `history.pushState` and listen to `popstate` to trigger reload when pathname changes.
* **Moderation**: delete via `DELETE ?key=...&secret=...`; no UI in v1.

---

## 9) Manual Test Plan

1. Deploy service to Netlify with `ALLOWED_ORIGINS` empty (dev).
2. Open `/public/demo.html?review=1`:

   * Add a comment; refresh; confirm it persists.
   * Add a reply; confirm nesting.
3. Add `data-annotate-id="hero-cta"` to an element and create a pin on it; resize window; position should remain consistent.
4. Set `ALLOWED_ORIGINS` to your prototype host only; verify CORS blocks requests from a different origin (use a codesandbox or another Netlify site).
5. For an SPA demo, navigate between routes (pushState); confirm comments reload.

---

## 10) Future / Nice‑to‑haves

* Rate limiting (per IP/session) in the function.
* Markdown (safe subset).
* Edit/delete UI with role‑based auth.
* Email/Slack notifications.
* Export/import comments, CSV/JSON.
* Screenshots/snaps of DOM region.

---

## Appendix: Embedding Quick Guide (for other projects)

1. (Optional) Add stable anchors:

```html
<div data-annotate-id="hero"></div>
<button data-annotate-id="cta-buy">Buy</button>
```

2. Include the widget near the end of `<body>`:

```html
<script defer
  src="https://YOUR-COMMENTS-SERVICE.netlify.app/comments-widget.js"
  data-endpoint="https://YOUR-COMMENTS-SERVICE.netlify.app/.netlify/functions/comments">
</script>
```

* (Optional) Force a specific thread id across pages:

```html
<script defer
  src="https://YOUR-COMMENTS-SERVICE.netlify.app/comments-widget.js"
  data-endpoint="https://YOUR-COMMENTS-SERVICE.netlify.app/.netlify/functions/comments"
  data-thread="checkout-flow-v2">
</script>
```

3. Turn on Review Mode by appending `?review=1` to the page URL.

4. Click to drop pins, write comments, reply in the sidebar.



## Appendix) One‑page embed guide (copy into other repos’ README)

**Live Prototype Comments — Embed Guide**

1. **Add anchor attributes (optional)**
   ```html
   <section data-annotate-id="hero"></section>
   <button data-annotate-id="cta-buy">Buy</button>
````

2. **Include the script**

   ```html
   <script defer
     src="https://YOUR-COMMENTS-SERVICE.netlify.app/comments-widget.js"
     data-endpoint="https://YOUR-COMMENTS-SERVICE.netlify.app/.netlify/functions/comments">
   </script>
   ```

   * To aggregate comments across multiple pages, add a fixed thread id:

   ```html
   <script defer
     src="https://YOUR-COMMENTS-SERVICE.netlify.app/comments-widget.js"
     data-endpoint="https://YOUR-COMMENTS-SERVICE.netlify.app/.netlify/functions/comments"
     data-thread="checkout-v2">
   </script>
   ```

3. **Use Review Mode**

   * Append `?review=1` to the page URL to enable pin placement.
   * Click to drop a pin, type your comment, and submit.
   * Click a pin to open the sidebar and reply.

4. **Production hardening (service side)**

   * Set `ALLOWED_ORIGINS` on the comments service to your prototype hosts.
   * Optionally set `DELETE_SECRET` for moderation.

---

If you want, I can also tailor the PRD to include your team’s naming conventions and a milestone plan (e.g., 1–2 days for MVP, 1 day polish, 0.5 day rollout) or produce a tiny “brand‑ready” CSS theme for the widget.
