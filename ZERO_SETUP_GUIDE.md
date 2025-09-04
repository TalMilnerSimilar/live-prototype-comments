# 🚀 Zero-Setup Guide: Add LPC to Any Project in 30 Seconds

Get full Live Prototype Comments on any project without copying files, deploying, or code changes.

## Method 1: Copy-Paste Script (Recommended)

### For any HTML page
Add this before `</body>` or in `<head>`:

```html
<script>
(function () {
  // Ensure stable container so pins anchor properly
  var root = document.querySelector('main,#root,#app,body');
  if (root && !root.hasAttribute('data-annotate-id')) {
    root.setAttribute('data-annotate-id','lpc-root');
  }

  var inject = function(){
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://live-prototype-comments.netlify.app/comments-widget.js';
    s.setAttribute('data-endpoint','https://live-prototype-comments.netlify.app/.netlify/functions/comments');
    document.body.appendChild(s);
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
</script>
```

### For Next.js projects
Add to your root layout or `_app.js`:

```tsx
import Script from 'next/script';

// In your component JSX:
<Script
  id="lpc-embed"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function () {
        var root = document.querySelector('main,#root,#app,body');
        if (root && !root.hasAttribute('data-annotate-id')) {
          root.setAttribute('data-annotate-id','lpc-root');
        }
        var s = document.createElement('script');
        s.defer = true;
        s.src = 'https://live-prototype-comments.netlify.app/comments-widget.js';
        s.setAttribute('data-endpoint','https://live-prototype-comments.netlify.app/.netlify/functions/comments');
        document.body.appendChild(s);
      })();
    `
  }}
/>
```

### For React/Vue apps
Add to your main component:

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Ensure stable container
    const root = document.querySelector('main,#root,#app,body');
    if (root && !root.hasAttribute('data-annotate-id')) {
      root.setAttribute('data-annotate-id','lpc-root');
    }

    // Load widget
    if (!document.querySelector('script[data-endpoint*="comments"]')) {
      const s = document.createElement('script');
      s.defer = true;
      s.src = 'https://live-prototype-comments.netlify.app/comments-widget.js';
      s.setAttribute('data-endpoint','https://live-prototype-comments.netlify.app/.netlify/functions/comments');
      document.body.appendChild(s);
    }
  }, []);

  return (
    // Your app JSX
  );
}
```

## Method 2: Bookmarklet (Zero Code Changes)

1. **Create the bookmarklet**: Drag this link to your bookmarks bar:
   
   ```
   Add LPC
   ```
   
   Or manually create a bookmark with this URL:
   ```javascript
   javascript:(function(){var r=document.querySelector('main,#root,#app,body');if(r&&!r.hasAttribute('data-annotate-id'))r.setAttribute('data-annotate-id','lpc-root');var s=document.createElement('script');s.defer=true;s.src='https://live-prototype-comments.netlify.app/comments-widget.js';s.setAttribute('data-endpoint','https://live-prototype-comments.netlify.app/.netlify/functions/comments');document.body.appendChild(s);})();
   ```

2. **Usage**: Click the bookmark on any webpage to instantly add LPC.

## Method 3: Arc Browser Boost

If you use Arc browser:

1. **Create a Boost**:
   - Press `⌘ + T` → "New Boost"
   - Choose "Code Boost"
   - Set scope to `*` (all websites)

2. **Add this JavaScript**:
   ```javascript
   (function(){
     var root = document.querySelector('main,#root,#app,body');
     if (root && !root.hasAttribute('data-annotate-id')) {
       root.setAttribute('data-annotate-id','lpc-root');
     }
     var s = document.createElement('script');
     s.defer = true;
     s.src = 'https://live-prototype-comments.netlify.app/comments-widget.js';
     s.setAttribute('data-endpoint','https://live-prototype-comments.netlify.app/.netlify/functions/comments');
     document.body.appendChild(s);
   })();
   ```

3. **Result**: LPC appears automatically on every website you visit.

## Method 4: Browser Extension/DevTools

For quick testing:

1. **Open DevTools** (`F12`)
2. **Go to Console**
3. **Paste and run**:
   ```javascript
   (function(){
     var root = document.querySelector('main,#root,#app,body');
     if (root && !root.hasAttribute('data-annotate-id')) {
       root.setAttribute('data-annotate-id','lpc-root');
     }
     var s = document.createElement('script');
     s.defer = true;
     s.src = 'https://live-prototype-comments.netlify.app/comments-widget.js';
     s.setAttribute('data-endpoint','https://live-prototype-comments.netlify.app/.netlify/functions/comments');
     document.body.appendChild(s);
   })();
   ```

## How to Use After Installation

1. **Enable Comment Mode**:
   - Click the blue pen icon on the right edge, OR
   - Add `?review=1` to the URL

2. **Add Comments**:
   - Click anywhere on the page
   - Enter your comment text
   - It anchors to the nearest container

3. **View Comments**:
   - Sidebar shows all comments and replies
   - Click pins to highlight comments
   - Reply to any comment

4. **Delete Comments**:
   - Click "Delete" on your own comments
   - Confirm in the modal

## What This Does Under the Hood

- **Finds a stable container**: Looks for `main`, `#root`, `#app`, or `body` and adds `data-annotate-id="lpc-root"` if none exists
- **Loads after DOM is ready**: Ensures selectors resolve to real elements
- **Anchors to containers**: Pins stick to elements, not viewport coordinates
- **Persists data**: Comments saved per domain+pathname on the central LPC site
- **SPA support**: Automatically reloads comments on route changes

## Advanced: Better Anchoring

For more precise pin placement, add `data-annotate-id` to key sections:

```html
<main data-annotate-id="main">
  <section data-annotate-id="hero">...</section>
  <section data-annotate-id="features">...</section>
  <aside data-annotate-id="sidebar">...</aside>
</main>
```

Comments will prefer these labeled containers over auto-generated selectors.

## Upgrade to Personal LPC Site (Optional)

To get isolated data per person/team:

1. **Deploy your own LPC site**:
   ```bash
   git clone https://github.com/TalMilnerSimilar/live-prototype-comments.git
   cd live-prototype-comments
   npm install
   netlify deploy --prod --dir=demo --functions=netlify/functions
   ```

2. **Update the script URLs**:
   Replace `live-prototype-comments.netlify.app` with your new domain.

3. **Set CORS** (in Netlify UI → Environment Variables):
   - `ALLOWED_ORIGINS`: `http://localhost:3000,https://your-app.com`

## Troubleshooting

**Comment Mode button not appearing?**
- Check browser console for errors
- Ensure the script loaded (Network tab)

**Pins in wrong location?**
- Verify script runs after DOM is ready
- Check that containers have `data-annotate-id`

**Comments not persisting?**
- Comments are saved per domain+pathname
- Check Network tab for successful POST/GET to the API

**Cross-domain issues?**
- The central LPC site allows all origins (`*`)
- For personal sites, set `ALLOWED_ORIGINS`

## Summary

- **Fastest**: Copy-paste the script tag (30 seconds)
- **No changes**: Use bookmarklet or Arc Boost
- **Best anchoring**: Add `data-annotate-id` to key containers
- **Team isolation**: Deploy your own LPC site later

The zero-setup approach gets you commenting immediately. Upgrade to self-hosted when you need data isolation or custom styling.
