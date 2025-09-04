Integrate the Live Prototype Comments (LPC) service into THIS project. Make it self-hosted on this project’s Netlify site and provide the full feature set: Comment Mode button, pins, sidebar with replies, delete (own comments), SPA route detection, robust anchoring to `data-annotate-id` or stable selectors, CORS, optimistic rendering + server sync. Keep edits minimal and additive.

Authoritative step-by-step instructions (fetch and follow verbatim):
- https://raw.githubusercontent.com/TalMilnerSimilar/live-prototype-comments/master/CURSOR_INSTRUCTIONS.md

Constraints:
- Don’t overwrite existing build/publish settings; only add what’s needed
- Use Netlify Functions (ESM) and Netlify Blobs
- Node >= 18

Finish criteria:
- Files added/edited are listed with paths
- Where the `<script>` was inserted is stated
- Local run command and Netlify deploy instructions included
- Verified: button shows, hover highlight, click-to-anchor, pins, sidebar pushes content, replies, delete own comments (with confirmation), cross-highlighting pin ⇄ sidebar, SPA route reloads comments
