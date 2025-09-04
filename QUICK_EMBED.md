# 🚀 Quick Embed: Add LPC to Any Project in 30 Seconds

Add this script to any project to get full Live Prototype Comments instantly.

## Copy-Paste Script

### For any HTML page
Add this before `</body>`:

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

## How to Use

1. **Enable Comment Mode**: Click the blue pen icon on the right edge or add `?review=1` to URL
2. **Add Comments**: Click anywhere on the page, enter text
3. **View Comments**: Sidebar shows all comments; click pins to highlight
4. **Reply & Delete**: Reply to comments; delete your own

## What This Does

- Finds stable container (`main`, `#root`, `#app`, or `body`)
- Adds `data-annotate-id="lpc-root"` for proper pin anchoring  
- Loads widget after DOM is ready
- Saves comments per domain+pathname
- Supports SPA route changes

That's it. Comments work immediately across any project.
