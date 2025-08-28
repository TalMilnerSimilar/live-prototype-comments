# 🚀 Live Prototype Comments (LPC)

**Drop-in commenting system for any web project.** Add collaborative comments to prototypes, static sites, or web apps with a single script tag.

## ⚡ Quick Integration (2 minutes)

### 1. Copy Files
```bash
# Copy these 4 files to your project:
comments-widget.js              # The widget
netlify/functions/comments.mjs  # The API  
package.json                    # Dependencies
netlify.toml                    # Config
```

### 2. Add Script Tag
```html
<script defer 
    src="./comments-widget.js" 
    data-endpoint="/.netlify/functions/comments">
</script>
```

### 3. Deploy & Use
```bash
npm install
netlify deploy --prod

# Add ?review=1 to any URL to start commenting!
```

**That's it!** 🎉 

## 🎯 Demo
**Live Demo:** [https://live-prototype-comments.netlify.app/demo.html?review=1](https://live-prototype-comments.netlify.app/demo.html?review=1)

Try it:
1. Click anywhere to drop a comment pin
2. Click pins to open the sidebar
3. Reply to comments
4. Toggle comment mode with the blue button

## ✨ Features

- **🎯 One Script Tag** - Drop into any HTML page
- **📌 Smart Anchoring** - Comments stick to page elements  
- **💬 Threaded Replies** - Full conversation support
- **🗑️ Delete Comments** - Remove your own comments
- **📱 SPA Support** - Works with React, Vue, Angular
- **🎨 Review Mode** - Toggle comment visibility
- **♿ Accessible** - Keyboard navigation & screen readers
- **🔒 Secure** - CORS protection & input validation

## 📁 Project Structure

```
your-project/
├── comments-widget.js          # Copy this → Main widget
├── netlify/functions/
│   └── comments.mjs           # Copy this → API function
├── package.json               # Copy this → Dependencies  
├── netlify.toml              # Copy this → Netlify config
└── your-page.html             # Add one script tag
```

**Core Files (copy these):**
- `comments-widget.js` - The complete commenting widget
- `netlify/functions/comments.mjs` - Serverless API function
- `package.json` - Required dependencies  
- `netlify.toml` - Netlify configuration

**Demo Files (optional):**
- `demo/index.html` - Example implementation
- `integration-example.html` - Minimal integration example

## 🔧 Integration Examples

### HTML Page
```html
<!DOCTYPE html>
<html>
<body>
    <h1 data-annotate-id="title">My Page</h1>
    
    <!-- Add this one line -->
    <script defer src="./comments-widget.js" data-endpoint="/.netlify/functions/comments"></script>
</body>
</html>
```

### React
```jsx
useEffect(() => {
    const script = document.createElement('script');
    script.src = './comments-widget.js';
    script.setAttribute('data-endpoint', '/.netlify/functions/comments');
    document.body.appendChild(script);
}, []);
```

### Vue
```vue
<script>
mounted() {
    const script = document.createElement('script');
    script.src = './comments-widget.js';
    script.setAttribute('data-endpoint', '/.netlify/functions/comments');
    document.body.appendChild(script);
}
</script>
```

## 🎨 Customization

### Anchor Comments to Elements
```html
<header data-annotate-id="site-header">Header</header>
<section data-annotate-id="hero">Hero Section</section>
```

### Environment Variables (Optional)
```bash
ALLOWED_ORIGINS=https://mysite.com,https://preview.mysite.com
DELETE_SECRET=your-admin-secret
```

### Custom Styling
Override these CSS classes:
```css
.lpc-pin { /* Comment pins */ }
.lpc-sidebar { /* Comments sidebar */ }
.lpc-comment { /* Individual comments */ }
```

## 🚀 Development

```bash
# Clone repository
git clone <this-repo>

# Install dependencies  
npm install

# Start local development
npm run dev

# Visit demo
open http://localhost:8888/demo.html?review=1
```

## 📖 Detailed Integration Guide

**For complete integration examples and troubleshooting, see:** [INTEGRATION.md](./INTEGRATION.md)

## 🌟 Why LPC?

- **Zero Backend** - Uses Netlify Functions + Blobs
- **Framework Agnostic** - Works with any web technology
- **Production Ready** - Built for real prototype collaboration
- **Easy Integration** - One script tag, works everywhere
- **Open Source** - MIT license, customize as needed

## 🔧 API Reference

### Endpoints

**GET** - List comments
```
GET /.netlify/functions/comments?pageUrl=<url>
```

**POST** - Create comment
```json
{
  "pageUrl": "https://site.com/page",
  "author": "John Doe",
  "text": "Great design!",
  "anchor": { 
    "selector": "[data-annotate-id='hero']", 
    "xy": { "xPct": 50, "yPct": 25 } 
  },
  "parentId": null
}
```

**DELETE** - Delete comment
```
DELETE /.netlify/functions/comments?commentId=abc123&author=John&pageUrl=<url>
```

## 📱 Browser Support

- Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- Mobile browsers supported
- IE11+ with polyfills

---

**Ready to add comments to your project?** Copy the 4 core files and add one script tag! ⚡