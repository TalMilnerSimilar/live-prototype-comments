import { getStore } from '@netlify/blobs';

// Helper function to normalize pageUrl to origin + pathname
function normalizePageUrl(pageUrl) {
  try {
    const url = new URL(pageUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    // If not a valid URL, return as-is (could be a custom thread ID)
    return pageUrl;
  }
}

// Encode a page key so it is safe for all local blob providers (e.g., dev sandbox)
function toSafeKeyPrefix(pageKey) {
  // encodeURIComponent collapses "://" and "/" which avoids provider-specific path issues
  // Keep a trailing slash so we can use list({ prefix }) efficiently
  return `${encodeURIComponent(pageKey)}/`;
}

// Helper function to generate UUID
function generateId() {
  return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper function to handle CORS
function getCorsHeaders(request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  if (!allowedOrigins) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
  }
  
  const origins = allowedOrigins.split(',').map(o => o.trim());
  if (origin && origins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
  }
  
  // If origin not allowed, don't include CORS headers
  return {};
}

export default async (request, context) => {
  const corsHeaders = getCorsHeaders(request);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  const store = getStore('comments');
  const url = new URL(request.url);
  
  try {
    // GET - List comments by pageUrl
    if (request.method === 'GET') {
      const pageUrl = url.searchParams.get('pageUrl');
      if (!pageUrl) {
        return new Response(JSON.stringify({ error: 'pageUrl parameter required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      const normalizedPageUrl = normalizePageUrl(pageUrl);
      
      try {
        const comments = [];

        // Try both raw and URL-encoded prefixes for compatibility with local dev blob sandbox
        const prefixesToTry = [
          `${normalizedPageUrl}/`,
          toSafeKeyPrefix(normalizedPageUrl),
        ];

        for (const prefix of prefixesToTry) {
          try {
            const { blobs } = await store.list({ prefix });
            for (const blob of blobs) {
              try {
                const comment = await store.get(blob.key, { type: 'json' });
                if (comment) comments.push(comment);
              } catch (error) {
                console.warn(`Failed to load comment ${blob.key}:`, error);
              }
            }
          } catch (error) {
            console.warn(`Listing with prefix ${prefix} failed:`, error);
          }
        }

        // Dedupe by id in case we read the same comment via two prefixes
        const uniqueById = new Map();
        for (const c of comments) uniqueById.set(c.id, c);

        const result = Array.from(uniqueById.values());
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error('Error listing comments:', error);
        return new Response(JSON.stringify({ error: 'Failed to load comments' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    // POST - Create comment
    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      const { pageUrl, text, author, anchor, parentId } = body;
      
      if (!pageUrl || !text) {
        return new Response(JSON.stringify({ error: 'pageUrl and text are required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      const normalizedPageUrl = normalizePageUrl(pageUrl);
      const id = generateId();
      
      const comment = {
        id,
        pageUrl: normalizedPageUrl,
        author: (author || 'Anonymous').substring(0, 200), // Truncate to 200 chars
        text: text.substring(0, 4000), // Truncate to 4000 chars
        parentId: parentId || null,
        createdAt: new Date().toISOString(),
        anchor: anchor || {}
      };
      
      // Prefer safe (encoded) path for better compatibility in dev; keep raw as a backup write for compatibility
      const safePrefix = toSafeKeyPrefix(normalizedPageUrl);
      const safeBlobKey = `${safePrefix}${id}.json`;
      const rawBlobKey = `${normalizedPageUrl}/${id}.json`;
      
      try {
        // Attempt safe write first; also mirror to raw path for robustness
        await store.setJSON(safeBlobKey, comment);
        try { await store.setJSON(rawBlobKey, comment); } catch {}
        
        return new Response(JSON.stringify(comment), {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error('Error creating comment:', error);
        return new Response(JSON.stringify({ error: 'Failed to create comment' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    // DELETE - Delete comment (moderation)
    if (request.method === 'DELETE') {
      const key = url.searchParams.get('key');
      const secret = url.searchParams.get('secret');
      const deleteSecret = process.env.DELETE_SECRET;
      
      if (!key || !secret) {
        return new Response(JSON.stringify({ error: 'key and secret parameters required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      if (!deleteSecret || secret !== deleteSecret) {
        return new Response(JSON.stringify({ error: 'Invalid secret' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      try {
        await store.delete(key);
        
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Error deleting comment:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete comment' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};
