(function() {
  'use strict';
  
  let commentsData = [];
  let isReviewMode = false;
  let isSidebarOpen = false;
  let endpoint = '';
  let threadKey = '';
  let currentScript = null;
  let pinsLayer = null;
  
  // Get the current script element
  const scripts = document.querySelectorAll('script[src*="comments-widget.js"]');
  currentScript = scripts[scripts.length - 1];
  
  // Configuration from script tag
  endpoint = currentScript.getAttribute('data-endpoint') || '';
  const customThread = currentScript.getAttribute('data-thread');
  
  // Determine thread key
  if (customThread) {
    threadKey = customThread;
  } else {
    threadKey = window.location.origin + window.location.pathname;
  }
  
  // Check if review mode is enabled
  isReviewMode = window.location.search.includes('review=1');
  
  // Utility functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function generateId() {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  function getDisplayName() {
    let name = localStorage.getItem('lpc-author');
    if (!name) {
      name = prompt('Enter your display name:') || 'Anonymous';
      localStorage.setItem('lpc-author', name);
    }
    return name;
  }
  
  // API functions
  async function loadComments() {
    if (!endpoint) {
      console.warn('No endpoint specified for comments widget');
      return;
    }
    
    console.log('LPC: Loading comments from:', `${endpoint}?pageUrl=${encodeURIComponent(threadKey)}`);
    
    try {
      const response = await fetch(`${endpoint}?pageUrl=${encodeURIComponent(threadKey)}`);
      if (response.ok) {
        commentsData = await response.json();
        console.log('LPC: Loaded comments:', commentsData);
        renderComments();
      } else {
        console.error('Failed to load comments:', response.status);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }
  
  // Delete comment function
  async function deleteComment(commentId, author) {
    if (!endpoint) return;
    
    const confirmed = confirm(`Delete this comment?\n\n"${author}": ${commentId}`);
    if (!confirmed) return;
    
    try {
      const response = await fetch(`${endpoint}?commentId=${encodeURIComponent(commentId)}&author=${encodeURIComponent(author)}&pageUrl=${encodeURIComponent(threadKey)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local data
        commentsData = commentsData.filter(c => c.id !== commentId);
        renderComments();
        console.log('LPC: Comment deleted successfully');
      } else {
        const errText = await response.text().catch(() => '');
        console.error('LPC: Failed to delete comment:', response.status, errText);
        alert('Failed to delete comment. You can only delete your own comments.');
      }
    } catch (error) {
      console.error('LPC: Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  }
  async function createComment(text, anchor, parentId = null) {
    if (!endpoint) return;
    
    const author = getDisplayName();
    const comment = {
      pageUrl: threadKey,
      text,
      author,
      anchor,
      parentId
    };
    
    try {
      console.log('LPC: Creating comment payload:', comment);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(comment)
      });
      
      if (response.ok) {
        const created = await response.json().catch(() => null);
        console.log('LPC: Create response OK. Created:', created);

        // Add to local data and render immediately
        if (created && created.id) {
          commentsData = [...commentsData, created];
          renderComments();
          toggleSidebar(true);
        } else {
          // Fallback: reload from server if no created object returned
          await loadComments();
          toggleSidebar(true);
        }
      } else {
        const errText = await response.text().catch(() => '');
        console.error('LPC: Failed to create comment:', response.status, errText);
        alert('Failed to create comment. Please try again.');
      }
    } catch (error) {
      console.error('LPC: Error creating comment:', error);
      alert('Failed to create comment. Please try again.');
    }
  }
  
  // UI Creation functions
  function createPin(comment) {
    const pin = document.createElement('button');
    pin.className = 'lpc-pin';
    pin.setAttribute('aria-label', `Comment by ${comment.author}`);
    pin.setAttribute('data-comment-id', comment.id);
    
    // Position the pin
    const anchor = comment.anchor || {};
    let targetElement = document.body;
    
    if (anchor.selector) {
      const selected = document.querySelector(anchor.selector);
      if (selected) {
        targetElement = selected;
      }
      console.log('LPC: Target element for pin:', targetElement, 'selector:', anchor.selector);
    }
    
    const rect = targetElement.getBoundingClientRect();
    
    let x, y;
    if (anchor.xy) {
      // Pins are placed inside a fixed overlay pinned to the viewport origin,
      // so we should use viewport coordinates (no scroll offsets)
      x = rect.left + (rect.width * anchor.xy.xPct / 100);
      y = rect.top + (rect.height * anchor.xy.yPct / 100);
    } else {
      x = rect.left + scrollLeft + rect.width / 2;
      y = rect.top + scrollTop + rect.height / 2;
    }
    
    console.log('LPC: Pin position calculated:', { x: x - 8, y: y - 8, rect, anchor });
    
    pin.style.cssText = `
      position: absolute;
      left: ${x - 8}px;
      top: ${y - 8}px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #ff6b35;
      border: 2px solid white;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-size: 10px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      pointer-events: auto;
    `;
    
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
      highlightComment(comment.id);
    });
    
    pin.addEventListener('mouseenter', () => {
      pin.style.transform = 'scale(1.2)';
      const id = pin.getAttribute('data-comment-id');
      const item = document.querySelector(`#lpc-sidebar [data-comment-id="${id}"]`);
      if (item) item.classList.add('lpc-comment-highlighted');
    });
    
    pin.addEventListener('mouseleave', () => {
      pin.style.transform = 'scale(1)';
      const id = pin.getAttribute('data-comment-id');
      const item = document.querySelector(`#lpc-sidebar [data-comment-id="${id}"]`);
      if (item) item.classList.remove('lpc-comment-highlighted');
    });
    
    return pin;
  }

  function createPinsLayer() {
    const layer = document.createElement('div');
    layer.id = 'lpc-pins-layer';
    layer.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9998; /* Below pins themselves */
      pointer-events: none; /* Pins will enable their own events */
    `;
    return layer;
  }
  
  function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'lpc-sidebar';
    sidebar.setAttribute('role', 'complementary');
    sidebar.setAttribute('aria-label', 'Comments');
    
    sidebar.style.cssText = `
      position: fixed;
      right: -400px;
      top: 0;
      width: 400px;
      height: 100vh;
      background: white;
      border-left: 1px solid #ddd;
      z-index: 10001;
      transition: right 0.3s ease;
      overflow-y: auto;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    return sidebar;
  }
  
  function createReviewButton() {
    const button = document.createElement('button');
    button.id = 'lpc-review-btn';
    button.textContent = isReviewMode ? 'Exit Comment Mode' : 'Comment Mode';
    button.setAttribute('aria-label', isReviewMode ? 'Exit comment mode' : 'Enter comment mode');
    
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      background: ${isReviewMode ? '#ff6b35' : '#007bff'};
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10002;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: background-color 0.2s;
    `;
    
    button.addEventListener('click', toggleReviewMode);
    
    return button;
  }
  
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'lpc-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      cursor: crosshair;
      pointer-events: ${isReviewMode ? 'auto' : 'none'};
      background: ${isReviewMode ? 'rgba(0,0,0,0.02)' : 'transparent'};
    `;
    
    overlay.addEventListener('click', handleOverlayClick);
    overlay.addEventListener('mousemove', handleOverlayMove);
    
    return overlay;
  }

  let hoverHighlightEl = null;
  let hoverTargetEl = null;

  function ensureHoverHighlight() {
    if (hoverHighlightEl) return hoverHighlightEl;
    const el = document.createElement('div');
    el.id = 'lpc-hover-highlight';
    el.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 0;
      height: 0;
      border: 2px solid rgba(0, 123, 255, 0.6);
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2), 0 0 12px rgba(0, 123, 255, 0.25);
      border-radius: 4px;
      background: rgba(0, 123, 255, 0.03);
      z-index: 10001;
      pointer-events: none;
      transition: left 0.06s ease, top 0.06s ease, width 0.06s ease, height 0.06s ease;
    `;
    document.body.appendChild(el);
    hoverHighlightEl = el;
    return el;
  }

  function handleOverlayMove(e) {
    if (!isReviewMode) return;
    const overlay = document.getElementById('lpc-overlay');
    const prevPE = overlay.style.pointerEvents;
    overlay.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY) || document.body;
    overlay.style.pointerEvents = prevPE || 'auto';
    hoverTargetEl = el;
    const rect = el.getBoundingClientRect();
    const box = ensureHoverHighlight();
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
  }

  // Find possible anchor containers (nearest first) that the user can choose
  function getAnchorCandidates(startEl) {
    const candidates = [];
    let el = startEl;
    while (el && el !== document.body) {
      if (!el.getAttribute) { el = el.parentElement; continue; }

      const annotateId = el.getAttribute('data-annotate-id');
      if (annotateId) {
        candidates.push({
          id: annotateId,
          label: `data-annotate-id="${annotateId}"`,
          selector: `[data-annotate-id="${annotateId}"]`,
          element: el
        });
      } else {
        // Build a reasonably stable selector for non-annotated elements
        const selector = buildSelectorFor(el);
        if (selector) {
          candidates.push({
            id: selector,
            label: selector,
            selector,
            element: el
          });
        }
      }
      el = el.parentElement;
    }
    return candidates;
  }

  function cssEscapeIdent(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    // Minimal fallback escape
    return String(value).replace(/[^a-zA-Z0-9_-]/g, match => `\\${match.charCodeAt(0).toString(16)} `);
  }

  function buildSelectorFor(el) {
    if (!el || !el.tagName) return '';
    if (el.getAttribute('data-annotate-id')) {
      const id = el.getAttribute('data-annotate-id');
      return `[data-annotate-id="${id}"]`;
    }
    if (el.id) return `#${cssEscapeIdent(el.id)}`;
    // Prefer data-* hooks commonly used
    for (const attr of ['data-testid', 'data-test', 'aria-label', 'name']) {
      const v = el.getAttribute && el.getAttribute(attr);
      if (v) return `${el.tagName.toLowerCase()}[${attr}="${cssEscapeIdent(v)}"]`;
    }
    // Build a short unique path using :nth-of-type up the tree
    const parts = [];
    let node = el;
    while (node && node !== document.body && parts.length < 4) {
      const tag = node.tagName ? node.tagName.toLowerCase() : '';
      if (!tag) break;
      const parent = node.parentElement;
      if (!parent) break;
      const siblings = Array.from(parent.children).filter(c => c.tagName === node.tagName);
      const index = siblings.indexOf(node) + 1;
      const seg = `${tag}:nth-of-type(${index})`;
      parts.unshift(seg);
      // Check if unique so far
      const selector = parts.join('>');
      try {
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      } catch {}
      node = parent;
    }
    const fallback = parts.join('>');
    return fallback || '';
  }
  
  // Event handlers
  function handleOverlayClick(e) {
    if (!isReviewMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const text = prompt('Enter your comment:');
    if (!text || !text.trim()) return;
    
    // Use the highlighted element under the cursor
    let targetElement = hoverTargetEl || e.target || document.body;
    
    let anchor = {};
    // Choose container automatically: prefer nearest data-annotate-id, else built selector
    let chosenEl = targetElement;
    let chosenSelector;
    const candidates = getAnchorCandidates(targetElement);
    if (candidates.length > 0) {
      chosenEl = candidates[0].element; // nearest first
      chosenSelector = candidates[0].selector;
    } else {
      const constructed = buildSelectorFor(targetElement);
      chosenSelector = constructed;
    }

    if (chosenSelector) anchor.selector = chosenSelector;

    // Calculate percentage coordinates relative to the chosen container
    const rect = chosenEl.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    anchor.xy = { xPct, yPct };

    createComment(text.trim(), anchor);
  }
  
  function toggleReviewMode() {
    isReviewMode = !isReviewMode;
    
    const url = new URL(window.location);
    if (isReviewMode) {
      url.searchParams.set('review', '1');
    } else {
      url.searchParams.delete('review');
    }
    
    window.history.replaceState({}, '', url);
    
    const reviewBtn = document.getElementById('lpc-review-btn');
    const overlay = document.getElementById('lpc-overlay');
    const pins = document.querySelectorAll('.lpc-pin');
    const hover = document.getElementById('lpc-hover-highlight');
    const sidebar = document.getElementById('lpc-sidebar');
    
    if (reviewBtn) {
      reviewBtn.textContent = isReviewMode ? 'Exit Comment Mode' : 'Comment Mode';
      reviewBtn.style.background = isReviewMode ? '#ff6b35' : '#007bff';
      reviewBtn.setAttribute('aria-label', isReviewMode ? 'Exit comment mode' : 'Enter comment mode');
    }
    
    if (overlay) {
      overlay.style.pointerEvents = isReviewMode ? 'auto' : 'none';
      overlay.style.background = isReviewMode ? 'rgba(0,0,0,0.02)' : 'transparent';
    }

    // Show/hide pins and hover highlight
    pins.forEach(p => {
      p.style.display = isReviewMode ? 'flex' : 'none';
    });
    if (hover) hover.style.display = isReviewMode ? 'block' : 'none';

    // Sidebar visibility and content push
    if (sidebar) {
      sidebar.style.right = isReviewMode ? '0' : '-400px';
      document.body.style.marginRight = isReviewMode ? '400px' : '0';
    }
  }
  
  function toggleSidebar(forceState) {
    isSidebarOpen = typeof forceState === 'boolean' ? forceState : !isSidebarOpen;
    const sidebar = document.getElementById('lpc-sidebar');
    
    if (sidebar) {
      sidebar.style.right = isSidebarOpen ? '0' : '-400px';
    }
  }
  
  function highlightComment(commentId) {
    // Remove previous highlights
    const highlighted = document.querySelectorAll('.lpc-comment-highlighted');
    highlighted.forEach(el => el.classList.remove('lpc-comment-highlighted'));
    
    // Highlight the target comment
    const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (comment) {
      comment.classList.add('lpc-comment-highlighted');
      comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  // Rendering functions
  function renderComments() {
    console.log('LPC: Rendering comments, count:', commentsData.length);
    
    // Clear existing pins
    const existingPins = document.querySelectorAll('.lpc-pin');
    console.log('LPC: Removing existing pins:', existingPins.length);
    existingPins.forEach(pin => pin.remove());
    
    // Create pins for all comments
    const parentComments = commentsData.filter(c => !c.parentId);
    console.log('LPC: Parent comments to render:', parentComments.length);
    
    parentComments.forEach((comment, index) => {
      console.log('LPC: Creating pin for comment', index + 1, comment);
      if (!pinsLayer) {
        pinsLayer = document.getElementById('lpc-pins-layer');
        console.log('LPC: Found pins layer:', !!pinsLayer);
      }
      const pinEl = createPin(comment);
      console.log('LPC: Created pin element:', pinEl);
      (pinsLayer || document.body).appendChild(pinEl);
      console.log('LPC: Appended pin to', pinsLayer ? 'pins layer' : 'document body');
    });
    
    // Update sidebar
    renderSidebar();
    console.log('LPC: Sidebar updated');
    
    // Ensure sidebar is visible if we have comments and are in review mode
    if (parentComments.length > 0 && isReviewMode && !isSidebarOpen) {
      toggleSidebar(true);
    }
  }
  
  function renderSidebar() {
    const sidebar = document.getElementById('lpc-sidebar');
    if (!sidebar) return;
    
    const parentComments = commentsData.filter(c => !c.parentId);
    const childComments = commentsData.filter(c => c.parentId);
    
    sidebar.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #eee; background: #f8f9fa;">
        <h3 style="margin: 0; font-size: 16px; color: #333;">Comments</h3>
        <button id="lpc-close-sidebar" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">&times;</button>
      </div>
      <div id="lpc-sidebar-content" style="padding: 20px;">
        ${parentComments.length === 0 ? '<p style="color: #666; font-style: italic;">No comments yet.</p>' : ''}
        ${parentComments.map(comment => renderCommentThread(comment, childComments)).join('')}
      </div>
    `;
    
    // Add close button event
    const closeBtn = document.getElementById('lpc-close-sidebar');
    if (closeBtn && !closeBtn.hasAttribute('data-event-attached')) {
      closeBtn.setAttribute('data-event-attached', 'true');
      closeBtn.addEventListener('click', toggleSidebar);
    }
    
    // Use event delegation to avoid duplicate listeners
    const sidebarContent = document.getElementById('lpc-sidebar-content');
    if (sidebarContent && !sidebarContent.hasAttribute('data-events-attached')) {
      sidebarContent.setAttribute('data-events-attached', 'true');
      
      sidebarContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('lpc-reply-btn')) {
          handleReply(e);
        } else if (e.target.classList.contains('lpc-delete-btn')) {
          const commentId = e.target.getAttribute('data-comment-id');
          const author = e.target.getAttribute('data-author');
          deleteComment(commentId, author);
        }
      });
    }

    // Hover sync: sidebar item -> pin
    const list = document.getElementById('lpc-sidebar-content');
    if (list) {
      list.querySelectorAll('[data-comment-id]').forEach(item => {
        item.addEventListener('mouseenter', () => {
          const id = item.getAttribute('data-comment-id');
          const pin = document.querySelector(`.lpc-pin[data-comment-id="${id}"]`);
          if (pin) pin.style.transform = 'scale(1.3)';
          item.classList.add('lpc-comment-highlighted');
        });
        item.addEventListener('mouseleave', () => {
          const id = item.getAttribute('data-comment-id');
          const pin = document.querySelector(`.lpc-pin[data-comment-id="${id}"]`);
          if (pin) pin.style.transform = 'scale(1)';
          item.classList.remove('lpc-comment-highlighted');
        });
      });
    }
  }
  
  function renderCommentThread(parentComment, childComments) {
    const replies = childComments.filter(c => c.parentId === parentComment.id);
    const formattedDate = new Date(parentComment.createdAt).toLocaleString();
    
    return `
      <div class="lpc-comment" data-comment-id="${parentComment.id}" style="margin-bottom: 20px; border-left: 3px solid #ff6b35; padding-left: 12px;">
        <div style="font-weight: 500; color: #333; margin-bottom: 4px;">${escapeHtml(parentComment.author)}</div>
        <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${formattedDate}</div>
        <div style="margin-bottom: 8px; color: #333;">${escapeHtml(parentComment.text)}</div>
        <button class="lpc-delete-btn" data-comment-id="${parentComment.id}" data-author="${escapeHtml(parentComment.author)}" style="background: #ff4757; border: 1px solid #ff3742; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-right: 8px;">Delete</button><button class="lpc-reply-btn" data-parent-id="${parentComment.id}" style="background: #f0f0f0; border: 1px solid #ddd; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; color: #666;">Reply</button>
        
        ${replies.length > 0 ? `
          <div style="margin-top: 12px; margin-left: 16px; border-left: 2px solid #eee; padding-left: 12px;">
            ${replies.map(reply => `
              <div style="margin-bottom: 12px;">
                <div style="font-weight: 500; color: #333; font-size: 13px;">${escapeHtml(reply.author)}</div>
                <div style="color: #666; font-size: 11px; margin-bottom: 4px;">${new Date(reply.createdAt).toLocaleString()}</div>
                <div style="color: #333; font-size: 13px; margin-bottom: 4px;">${escapeHtml(reply.text)}</div><button class="lpc-delete-btn" data-comment-id="${reply.id}" data-author="${escapeHtml(reply.author)}" style="background: #ff4757; border: 1px solid #ff3742; color: white; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;">Delete</button>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  function handleReply(e) {
    const parentId = e.target.getAttribute('data-parent-id');
    const text = prompt('Enter your reply:');
    
    if (!text || !text.trim()) return;
    
    createComment(text.trim(), {}, parentId);
  }
  
  // SPA support
  function setupSPASupport() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    function onLocationChange() {
      const newThreadKey = window.location.origin + window.location.pathname;
      if (newThreadKey !== threadKey && !currentScript.getAttribute('data-thread')) {
        threadKey = newThreadKey;
        setTimeout(() => {
          loadComments();
        }, 100);
      }
    }
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      onLocationChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      onLocationChange();
    };
    
    window.addEventListener('popstate', onLocationChange);
  }
  
  // CSS injection
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .lpc-comment-highlighted {
        background-color: #fff3cd !important;
        transition: background-color 0.3s;
      }
    `;
    document.head.appendChild(style);
  }

  // Reposition pins on resize and scroll (also catches scrolling containers)
  function setupAutoReposition() {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        if (commentsData && commentsData.length && isReviewMode) renderComments();
      });
    };
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
  }
  
  // Initialize widget
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    console.log('LPC: Starting initialization...');
    console.log('LPC: Review mode:', isReviewMode);
    console.log('LPC: Endpoint:', endpoint);
    console.log('LPC: Thread key:', threadKey);
    
    // Inject styles
    injectStyles();
    
    // Create UI elements
    try {
      const sidebar = createSidebar();
      document.body.appendChild(sidebar);
      console.log('LPC: Sidebar created and added');
      
      const reviewBtn = createReviewButton();
      document.body.appendChild(reviewBtn);
      console.log('LPC: Review button created and added');
      
      pinsLayer = createPinsLayer();
      document.body.appendChild(pinsLayer);
      console.log('LPC: Pins layer created and added');
      
      const overlay = createOverlay();
      document.body.appendChild(overlay);
      console.log('LPC: Overlay created and added');
      
    } catch (error) {
      console.error('LPC: Error creating UI elements:', error);
    }
    
    // Setup SPA support
    setupSPASupport();
    setupAutoReposition();
    
    // Load initial comments
    loadComments();
    
    // (Test pin removed)
    
    console.log('Live Prototype Comments widget initialized');
  }
  
  // Start initialization
  init();
  
})();
