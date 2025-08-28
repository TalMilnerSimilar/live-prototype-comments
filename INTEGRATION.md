# 🚀 Live Prototype Comments - Integration Guide

## Quick Start (2 minutes)

### What You Need
```
your-project/
├── comments-widget.js          # Copy this file
├── netlify/
│   └── functions/
│       └── comments.mjs        # Copy this file  
├── package.json                # Copy dependencies
├── netlify.toml                # Copy config
└── your-page.html              # Add one script tag
```

### Step 1: Copy Core Files
Copy these files to your project:
- `comments-widget.js` (the main widget)
- `netlify/functions/comments.mjs` (the API)
- `package.json` (for dependencies)
- `netlify.toml` (for Netlify config)

### Step 2: Add Script Tag
Add this **single line** to your HTML:

```html
<script defer 
    src="./comments-widget.js" 
    data-endpoint="/.netlify/functions/comments">
</script>
```

### Step 3: Deploy to Netlify
```bash
npm install
netlify deploy --prod
```

## That's It! 🎉

### How to Use
1. Add `?review=1` to any URL to enable comment mode
2. Click anywhere to drop pins and add comments
3. Click the comment mode button (right edge) to toggle
4. Reply to comments in the sidebar
5. Delete your own comments

### Optional: Custom Styling
The widget injects minimal CSS. Override these classes:
- `.lpc-pin` - Comment pins
- `.lpc-sidebar` - Comments sidebar
- `.lpc-comment` - Individual comments

### Environment Variables (Optional)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed domains
- `DELETE_SECRET` - Secret for admin comment deletion

## Examples

### Basic HTML Page
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Project</title>
</head>
<body>
    <h1 data-annotate-id="title">My Page</h1>
    <p>Some content to comment on...</p>
    
    <!-- Add comments -->
    <script defer src="./comments-widget.js" data-endpoint="/.netlify/functions/comments"></script>
</body>
</html>
```

### React Component
```jsx
import { useEffect } from 'react';

function MyComponent() {
    useEffect(() => {
        // Load comments widget
        const script = document.createElement('script');
        script.src = './comments-widget.js';
        script.defer = true;
        script.setAttribute('data-endpoint', '/.netlify/functions/comments');
        document.body.appendChild(script);
        
        return () => document.body.removeChild(script);
    }, []);
    
    return (
        <div data-annotate-id="my-component">
            <h1>My React Component</h1>
        </div>
    );
}
```

### Vue Component
```vue
<template>
    <div data-annotate-id="my-vue-component">
        <h1>My Vue Component</h1>
    </div>
</template>

<script>
export default {
    mounted() {
        const script = document.createElement('script');
        script.src = './comments-widget.js';
        script.defer = true;
        script.setAttribute('data-endpoint', '/.netlify/functions/comments');
        document.body.appendChild(script);
    }
}
</script>
```

## Advanced Usage

### Custom Anchoring
Add `data-annotate-id` attributes to elements you want comments to anchor to:

```html
<div data-annotate-id="header">Header Section</div>
<section data-annotate-id="features">Features</section>
```

### SPA Support
The widget automatically detects route changes in single-page applications and reloads comments for the new page.

### Custom Endpoint
Point to your own API endpoint:

```html
<script defer 
    src="./comments-widget.js" 
    data-endpoint="https://api.mysite.com/comments">
</script>
```

## Troubleshooting

**Comments not showing?**
- Check browser console for errors
- Verify `data-endpoint` URL is correct
- Add `?review=1` to URL to enable comment mode

**Comments not persisting?**
- Check Netlify function logs
- Verify Netlify Blobs is enabled
- Check CORS settings in comments.mjs

**Pins in wrong position?**
- Comments anchor to elements with `data-annotate-id`
- Without anchors, they use viewport coordinates
- Page layout changes may affect positioning

## Need Help?
Check the demo at: https://live-prototype-comments.netlify.app/demo.html?review=1
