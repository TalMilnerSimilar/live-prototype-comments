# Live Prototype Comments (LPC)

A serverless comment system for live prototypes using Netlify Functions and Netlify Blobs. Add pin-style comments and threaded replies to any prototype with a single `<script>` tag.

## Quick Start

### Prerequisites
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed globally
- Node.js 16+ 

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   This runs `netlify dev` which serves the site locally with Functions support.

3. **Open the demo:**
   Navigate to `http://localhost:8888/demo.html?review=1` in your browser.

4. **Test the comments:**
   - Click anywhere on the page to drop a pin and add a comment
   - Click existing pins to open the comments sidebar
   - Try replying to comments
   - Toggle review mode with the button in the top-right corner

## Environment Variables

Configure these environment variables in your Netlify site settings or `.env` file:

- **`ALLOWED_ORIGINS`** (optional): Comma-separated list of allowed origins for CORS
  - Example: `https://project-a.netlify.app,https://project-b.netlify.app`
  - If not set, allows all origins (development only)

- **`DELETE_SECRET`** (optional): Secret key for comment moderation via DELETE API
  - Used for: `DELETE /.netlify/functions/comments?key=<blobKey>&secret=<DELETE_SECRET>`

## Deployment

1. **Deploy to Netlify:**
   - Connect your Git repository to Netlify
   - Set build command: `npm run build` 
   - Set publish directory: `public`
   - Add environment variables in site settings

2. **Test deployed version:**
   Visit `https://your-site.netlify.app/demo.html?review=1`

## API Documentation

### Base URL
`/.netlify/functions/comments`

### Endpoints

**GET** - List comments by page
```
GET /.netlify/functions/comments?pageUrl=<url-or-thread>
Response: Comment[] (200)
```

**POST** - Create comment
```
POST /.netlify/functions/comments
Content-Type: application/json

{
  "pageUrl": "https://site.netlify.app/products",
  "author": "John Doe",
  "text": "Great design!",
  "anchor": { 
    "selector": "[data-annotate-id=\"hero\"]", 
    "xy": { "xPct": 50, "yPct": 25 } 
  },
  "parentId": null
}

Response: Comment (201)
```

**DELETE** - Delete comment (moderation)
```
DELETE /.netlify/functions/comments?key=<blobKey>&secret=<DELETE_SECRET>
Response: 204
```

### Comment Schema
```typescript
type Comment = {
  id: string;               // UUID
  pageUrl: string;          // Normalized origin + pathname
  author: string;           // Display name (max 200 chars)
  text: string;             // Comment text (max 4000 chars)
  parentId?: string | null; // For replies
  createdAt: string;        // ISO timestamp
  anchor: {
    selector?: string;      // CSS selector for stable anchoring
    xy?: { xPct: number; yPct: number }; // Percentage coordinates
  };
};
```

---

## Embedding in Other Projects

### 1. Add Anchor Attributes (Optional)

For stable comment positioning, add `data-annotate-id` attributes to important elements:

```html
<section data-annotate-id="hero">
  <h1 data-annotate-id="hero-title">Welcome</h1>
  <button data-annotate-id="cta-buy">Buy Now</button>
</section>
```

### 2. Include the Widget Script

Add this script tag near the end of your `<body>`:

```html
<script defer 
  src="https://YOUR-COMMENTS-SERVICE.netlify.app/comments-widget.js" 
  data-endpoint="https://YOUR-COMMENTS-SERVICE.netlify.app/.netlify/functions/comments">
</script>
```

**Custom Thread ID (Optional):**
To aggregate comments across multiple pages, specify a fixed thread:

```html
<script defer 
  src="https://YOUR-COMMENTS-SERVICE.netlify.app/comments-widget.js" 
  data-endpoint="https://YOUR-COMMENTS-SERVICE.netlify.app/.netlify/functions/comments"
  data-thread="checkout-flow-v2">
</script>
```

### 3. Use Review Mode

- **Enable:** Add `?review=1` to any page URL
- **Click to comment:** Click anywhere to drop a pin and add a comment  
- **View & reply:** Click existing pins to open sidebar and reply to comments
- **Toggle:** Use the "Review" button in the top-right corner

### 4. Production Setup

1. **Configure CORS:** Set `ALLOWED_ORIGINS` environment variable to your prototype domains
2. **Moderation:** Set `DELETE_SECRET` for comment removal capabilities
3. **Performance:** Comments are cached and load efficiently even with many pins

## Features

✅ **Pin-style comments** - Click anywhere to add contextual feedback  
✅ **Threaded replies** - Full conversation support  
✅ **Stable anchoring** - Comments stick to elements via `data-annotate-id`  
✅ **Review mode toggle** - Enable/disable via URL parameter  
✅ **SPA support** - Automatically reloads comments on route changes  
✅ **Accessibility** - Keyboard navigation and ARIA labels  
✅ **No backend setup** - Uses Netlify Functions + Blobs  
✅ **CORS protection** - Configurable origin allowlist  
✅ **Lightweight** - ~15-25KB minified widget  

## Browser Support

- Chrome 60+
- Firefox 60+  
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for better design collaboration**
