
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/comments.mjs
import { getStore } from "@netlify/blobs";
function normalizePageUrl(pageUrl) {
  try {
    const url = new URL(pageUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return pageUrl;
  }
}
function toSafeKeyPrefix(pageKey) {
  return `${encodeURIComponent(pageKey)}/`;
}
function generateId() {
  return "xxxx-xxxx-4xxx-yxxx-xxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function getCorsHeaders(request) {
  const origin = request.headers.get("origin");
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (!allowedOrigins) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
  }
  const origins = allowedOrigins.split(",").map((o) => o.trim());
  if (origin && origins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
  }
  return {};
}
var comments_default = async (request, context) => {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  const store = getStore("comments");
  const url = new URL(request.url);
  try {
    if (request.method === "GET") {
      const pageUrl = url.searchParams.get("pageUrl");
      if (!pageUrl) {
        return new Response(JSON.stringify({ error: "pageUrl parameter required" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const normalizedPageUrl = normalizePageUrl(pageUrl);
      try {
        const comments = [];
        const prefixesToTry = [
          `${normalizedPageUrl}/`,
          toSafeKeyPrefix(normalizedPageUrl)
        ];
        for (const prefix of prefixesToTry) {
          try {
            const { blobs } = await store.list({ prefix });
            for (const blob of blobs) {
              try {
                const comment = await store.get(blob.key, { type: "json" });
                if (comment)
                  comments.push(comment);
              } catch (error) {
                console.warn(`Failed to load comment ${blob.key}:`, error);
              }
            }
          } catch (error) {
            console.warn(`Listing with prefix ${prefix} failed:`, error);
          }
        }
        const uniqueById = /* @__PURE__ */ new Map();
        for (const c of comments)
          uniqueById.set(c.id, c);
        const result = Array.from(uniqueById.values());
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error("Error listing comments:", error);
        return new Response(JSON.stringify({ error: "Failed to load comments" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }
    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const { pageUrl, text, author, anchor, parentId } = body;
      if (!pageUrl || !text) {
        return new Response(JSON.stringify({ error: "pageUrl and text are required" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const normalizedPageUrl = normalizePageUrl(pageUrl);
      const id = generateId();
      const comment = {
        id,
        pageUrl: normalizedPageUrl,
        author: (author || "Anonymous").substring(0, 200),
        // Truncate to 200 chars
        text: text.substring(0, 4e3),
        // Truncate to 4000 chars
        parentId: parentId || null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        anchor: anchor || {}
      };
      const safePrefix = toSafeKeyPrefix(normalizedPageUrl);
      const safeBlobKey = `${safePrefix}${id}.json`;
      const rawBlobKey = `${normalizedPageUrl}/${id}.json`;
      try {
        await store.setJSON(safeBlobKey, comment);
        try {
          await store.setJSON(rawBlobKey, comment);
        } catch {
        }
        return new Response(JSON.stringify(comment), {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error("Error creating comment:", error);
        return new Response(JSON.stringify({ error: "Failed to create comment" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }
    if (request.method === "DELETE") {
      const key = url.searchParams.get("key");
      const secret = url.searchParams.get("secret");
      const deleteSecret = process.env.DELETE_SECRET;
      if (!key || !secret) {
        return new Response(JSON.stringify({ error: "key and secret parameters required" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      if (!deleteSecret || secret !== deleteSecret) {
        return new Response(JSON.stringify({ error: "Invalid secret" }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
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
        console.error("Error deleting comment:", error);
        return new Response(JSON.stringify({ error: "Failed to delete comment" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
export {
  comments_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvY29tbWVudHMubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBnZXRTdG9yZSB9IGZyb20gJ0BuZXRsaWZ5L2Jsb2JzJztcblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIG5vcm1hbGl6ZSBwYWdlVXJsIHRvIG9yaWdpbiArIHBhdGhuYW1lXG5mdW5jdGlvbiBub3JtYWxpemVQYWdlVXJsKHBhZ2VVcmwpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHBhZ2VVcmwpO1xuICAgIHJldHVybiBgJHt1cmwub3JpZ2lufSR7dXJsLnBhdGhuYW1lfWA7XG4gIH0gY2F0Y2gge1xuICAgIC8vIElmIG5vdCBhIHZhbGlkIFVSTCwgcmV0dXJuIGFzLWlzIChjb3VsZCBiZSBhIGN1c3RvbSB0aHJlYWQgSUQpXG4gICAgcmV0dXJuIHBhZ2VVcmw7XG4gIH1cbn1cblxuLy8gRW5jb2RlIGEgcGFnZSBrZXkgc28gaXQgaXMgc2FmZSBmb3IgYWxsIGxvY2FsIGJsb2IgcHJvdmlkZXJzIChlLmcuLCBkZXYgc2FuZGJveClcbmZ1bmN0aW9uIHRvU2FmZUtleVByZWZpeChwYWdlS2V5KSB7XG4gIC8vIGVuY29kZVVSSUNvbXBvbmVudCBjb2xsYXBzZXMgXCI6Ly9cIiBhbmQgXCIvXCIgd2hpY2ggYXZvaWRzIHByb3ZpZGVyLXNwZWNpZmljIHBhdGggaXNzdWVzXG4gIC8vIEtlZXAgYSB0cmFpbGluZyBzbGFzaCBzbyB3ZSBjYW4gdXNlIGxpc3QoeyBwcmVmaXggfSkgZWZmaWNpZW50bHlcbiAgcmV0dXJuIGAke2VuY29kZVVSSUNvbXBvbmVudChwYWdlS2V5KX0vYDtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIFVVSURcbmZ1bmN0aW9uIGdlbmVyYXRlSWQoKSB7XG4gIHJldHVybiAneHh4eC14eHh4LTR4eHgteXh4eC14eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICBjb25zdCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMDtcbiAgICBjb25zdCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgfSk7XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBlc2NhcGUgSFRNTFxuZnVuY3Rpb24gZXNjYXBlSHRtbCh0ZXh0KSB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGhhbmRsZSBDT1JTXG5mdW5jdGlvbiBnZXRDb3JzSGVhZGVycyhyZXF1ZXN0KSB7XG4gIGNvbnN0IG9yaWdpbiA9IHJlcXVlc3QuaGVhZGVycy5nZXQoJ29yaWdpbicpO1xuICBjb25zdCBhbGxvd2VkT3JpZ2lucyA9IHByb2Nlc3MuZW52LkFMTE9XRURfT1JJR0lOUztcbiAgXG4gIGlmICghYWxsb3dlZE9yaWdpbnMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCwgUE9TVCwgREVMRVRFLCBPUFRJT05TJyxcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSdcbiAgICB9O1xuICB9XG4gIFxuICBjb25zdCBvcmlnaW5zID0gYWxsb3dlZE9yaWdpbnMuc3BsaXQoJywnKS5tYXAobyA9PiBvLnRyaW0oKSk7XG4gIGlmIChvcmlnaW4gJiYgb3JpZ2lucy5pbmNsdWRlcyhvcmlnaW4pKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiBvcmlnaW4sXG4gICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIERFTEVURSwgT1BUSU9OUycsXG4gICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdDb250ZW50LVR5cGUnXG4gICAgfTtcbiAgfVxuICBcbiAgLy8gSWYgb3JpZ2luIG5vdCBhbGxvd2VkLCBkb24ndCBpbmNsdWRlIENPUlMgaGVhZGVyc1xuICByZXR1cm4ge307XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXF1ZXN0LCBjb250ZXh0KSA9PiB7XG4gIGNvbnN0IGNvcnNIZWFkZXJzID0gZ2V0Q29yc0hlYWRlcnMocmVxdWVzdCk7XG4gIFxuICAvLyBIYW5kbGUgQ09SUyBwcmVmbGlnaHRcbiAgaWYgKHJlcXVlc3QubWV0aG9kID09PSAnT1BUSU9OUycpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtcbiAgICAgIHN0YXR1czogMjA0LFxuICAgICAgaGVhZGVyczogY29yc0hlYWRlcnNcbiAgICB9KTtcbiAgfVxuICBcbiAgY29uc3Qgc3RvcmUgPSBnZXRTdG9yZSgnY29tbWVudHMnKTtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXF1ZXN0LnVybCk7XG4gIFxuICB0cnkge1xuICAgIC8vIEdFVCAtIExpc3QgY29tbWVudHMgYnkgcGFnZVVybFxuICAgIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgIGNvbnN0IHBhZ2VVcmwgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgncGFnZVVybCcpO1xuICAgICAgaWYgKCFwYWdlVXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ3BhZ2VVcmwgcGFyYW1ldGVyIHJlcXVpcmVkJyB9KSwge1xuICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAuLi5jb3JzSGVhZGVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQYWdlVXJsID0gbm9ybWFsaXplUGFnZVVybChwYWdlVXJsKTtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29tbWVudHMgPSBbXTtcblxuICAgICAgICAvLyBUcnkgYm90aCByYXcgYW5kIFVSTC1lbmNvZGVkIHByZWZpeGVzIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbG9jYWwgZGV2IGJsb2Igc2FuZGJveFxuICAgICAgICBjb25zdCBwcmVmaXhlc1RvVHJ5ID0gW1xuICAgICAgICAgIGAke25vcm1hbGl6ZWRQYWdlVXJsfS9gLFxuICAgICAgICAgIHRvU2FmZUtleVByZWZpeChub3JtYWxpemVkUGFnZVVybCksXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBwcmVmaXggb2YgcHJlZml4ZXNUb1RyeSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGJsb2JzIH0gPSBhd2FpdCBzdG9yZS5saXN0KHsgcHJlZml4IH0pO1xuICAgICAgICAgICAgZm9yIChjb25zdCBibG9iIG9mIGJsb2JzKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tbWVudCA9IGF3YWl0IHN0b3JlLmdldChibG9iLmtleSwgeyB0eXBlOiAnanNvbicgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbW1lbnQpIGNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBGYWlsZWQgdG8gbG9hZCBjb21tZW50ICR7YmxvYi5rZXl9OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYExpc3Rpbmcgd2l0aCBwcmVmaXggJHtwcmVmaXh9IGZhaWxlZDpgLCBlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVkdXBlIGJ5IGlkIGluIGNhc2Ugd2UgcmVhZCB0aGUgc2FtZSBjb21tZW50IHZpYSB0d28gcHJlZml4ZXNcbiAgICAgICAgY29uc3QgdW5pcXVlQnlJZCA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChjb25zdCBjIG9mIGNvbW1lbnRzKSB1bmlxdWVCeUlkLnNldChjLmlkLCBjKTtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBBcnJheS5mcm9tKHVuaXF1ZUJ5SWQudmFsdWVzKCkpO1xuICAgICAgICByZXN1bHQuc29ydCgoYSwgYikgPT4gbmV3IERhdGUoYS5jcmVhdGVkQXQpIC0gbmV3IERhdGUoYi5jcmVhdGVkQXQpKTtcblxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHJlc3VsdCksIHtcbiAgICAgICAgICBzdGF0dXM6IDIwMCxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgLi4uY29yc0hlYWRlcnNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbGlzdGluZyBjb21tZW50czonLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ZhaWxlZCB0byBsb2FkIGNvbW1lbnRzJyB9KSwge1xuICAgICAgICAgIHN0YXR1czogNTAwLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAuLi5jb3JzSGVhZGVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIFBPU1QgLSBDcmVhdGUgY29tbWVudFxuICAgIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICBsZXQgYm9keTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGJvZHkgPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnZhbGlkIEpTT04gYm9keScgfSksIHtcbiAgICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgLi4uY29yc0hlYWRlcnNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCB7IHBhZ2VVcmwsIHRleHQsIGF1dGhvciwgYW5jaG9yLCBwYXJlbnRJZCB9ID0gYm9keTtcbiAgICAgIFxuICAgICAgaWYgKCFwYWdlVXJsIHx8ICF0ZXh0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ3BhZ2VVcmwgYW5kIHRleHQgYXJlIHJlcXVpcmVkJyB9KSwge1xuICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAuLi5jb3JzSGVhZGVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQYWdlVXJsID0gbm9ybWFsaXplUGFnZVVybChwYWdlVXJsKTtcbiAgICAgIGNvbnN0IGlkID0gZ2VuZXJhdGVJZCgpO1xuICAgICAgXG4gICAgICBjb25zdCBjb21tZW50ID0ge1xuICAgICAgICBpZCxcbiAgICAgICAgcGFnZVVybDogbm9ybWFsaXplZFBhZ2VVcmwsXG4gICAgICAgIGF1dGhvcjogKGF1dGhvciB8fCAnQW5vbnltb3VzJykuc3Vic3RyaW5nKDAsIDIwMCksIC8vIFRydW5jYXRlIHRvIDIwMCBjaGFyc1xuICAgICAgICB0ZXh0OiB0ZXh0LnN1YnN0cmluZygwLCA0MDAwKSwgLy8gVHJ1bmNhdGUgdG8gNDAwMCBjaGFyc1xuICAgICAgICBwYXJlbnRJZDogcGFyZW50SWQgfHwgbnVsbCxcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGFuY2hvcjogYW5jaG9yIHx8IHt9XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBQcmVmZXIgc2FmZSAoZW5jb2RlZCkgcGF0aCBmb3IgYmV0dGVyIGNvbXBhdGliaWxpdHkgaW4gZGV2OyBrZWVwIHJhdyBhcyBhIGJhY2t1cCB3cml0ZSBmb3IgY29tcGF0aWJpbGl0eVxuICAgICAgY29uc3Qgc2FmZVByZWZpeCA9IHRvU2FmZUtleVByZWZpeChub3JtYWxpemVkUGFnZVVybCk7XG4gICAgICBjb25zdCBzYWZlQmxvYktleSA9IGAke3NhZmVQcmVmaXh9JHtpZH0uanNvbmA7XG4gICAgICBjb25zdCByYXdCbG9iS2V5ID0gYCR7bm9ybWFsaXplZFBhZ2VVcmx9LyR7aWR9Lmpzb25gO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICAvLyBBdHRlbXB0IHNhZmUgd3JpdGUgZmlyc3Q7IGFsc28gbWlycm9yIHRvIHJhdyBwYXRoIGZvciByb2J1c3RuZXNzXG4gICAgICAgIGF3YWl0IHN0b3JlLnNldEpTT04oc2FmZUJsb2JLZXksIGNvbW1lbnQpO1xuICAgICAgICB0cnkgeyBhd2FpdCBzdG9yZS5zZXRKU09OKHJhd0Jsb2JLZXksIGNvbW1lbnQpOyB9IGNhdGNoIHt9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KGNvbW1lbnQpLCB7XG4gICAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIC4uLmNvcnNIZWFkZXJzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIGNvbW1lbnQ6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdGYWlsZWQgdG8gY3JlYXRlIGNvbW1lbnQnIH0pLCB7XG4gICAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIC4uLmNvcnNIZWFkZXJzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gREVMRVRFIC0gRGVsZXRlIGNvbW1lbnQgKG1vZGVyYXRpb24pXG4gICAgaWYgKHJlcXVlc3QubWV0aG9kID09PSAnREVMRVRFJykge1xuICAgICAgY29uc3Qga2V5ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2tleScpO1xuICAgICAgY29uc3Qgc2VjcmV0ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ3NlY3JldCcpO1xuICAgICAgY29uc3QgZGVsZXRlU2VjcmV0ID0gcHJvY2Vzcy5lbnYuREVMRVRFX1NFQ1JFVDtcbiAgICAgIFxuICAgICAgaWYgKCFrZXkgfHwgIXNlY3JldCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdrZXkgYW5kIHNlY3JldCBwYXJhbWV0ZXJzIHJlcXVpcmVkJyB9KSwge1xuICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAuLi5jb3JzSGVhZGVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmICghZGVsZXRlU2VjcmV0IHx8IHNlY3JldCAhPT0gZGVsZXRlU2VjcmV0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludmFsaWQgc2VjcmV0JyB9KSwge1xuICAgICAgICAgIHN0YXR1czogNDAzLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAuLi5jb3JzSGVhZGVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHN0b3JlLmRlbGV0ZShrZXkpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgICAgaGVhZGVyczogY29yc0hlYWRlcnNcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkZWxldGluZyBjb21tZW50OicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnRmFpbGVkIHRvIGRlbGV0ZSBjb21tZW50JyB9KSwge1xuICAgICAgICAgIHN0YXR1czogNTAwLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAuLi5jb3JzSGVhZGVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIE1ldGhvZCBub3QgYWxsb3dlZFxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSksIHtcbiAgICAgIHN0YXR1czogNDA1LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAuLi5jb3JzSGVhZGVyc1xuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VuZXhwZWN0ZWQgZXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSksIHtcbiAgICAgIHN0YXR1czogNTAwLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAuLi5jb3JzSGVhZGVyc1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUFBLFNBQVMsZ0JBQWdCO0FBR3pCLFNBQVMsaUJBQWlCLFNBQVM7QUFDakMsTUFBSTtBQUNGLFVBQU0sTUFBTSxJQUFJLElBQUksT0FBTztBQUMzQixXQUFPLEdBQUcsSUFBSSxNQUFNLEdBQUcsSUFBSSxRQUFRO0FBQUEsRUFDckMsUUFBUTtBQUVOLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFHQSxTQUFTLGdCQUFnQixTQUFTO0FBR2hDLFNBQU8sR0FBRyxtQkFBbUIsT0FBTyxDQUFDO0FBQ3ZDO0FBR0EsU0FB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
