/**
 * SWEETO API Client with Private Network Access (PNA) compatibility.
 * 
 * - In local development (localhost/127.0.0.1): uses relative `/api` paths to route
 *   through Vite's built-in dev proxy. This bypasses PNA/CORS constraints.
 * - In production/public deployment (e.g. Vercel): targets `http://localhost:3000/api`
 *   explicitly and adds the `targetAddressSpace: 'private'` option required by Chrome.
 */

export async function apiFetch(path, options = {}) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Normalize path (remove leading slash and optional 'api/' prefix)
  const cleanPath = path.replace(/^\/?(api\/)?/, '');
  
  let targetUrl;
  const fetchOptions = { ...options };
  const headers = { ...(options.headers || {}) };
  const token = sessionStorage.getItem('sweetohub_admin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  fetchOptions.headers = headers;
  
  if (isLocalhost) {
    targetUrl = `/api/${cleanPath}`;
  } else {
    targetUrl = `http://localhost:3000/api/${cleanPath}`;
    // Add Private Network Access (PNA) header to resolve security blocks
    fetchOptions.targetAddressSpace = 'private';
  }

  const response = await fetch(targetUrl, fetchOptions);
  
  // Intercept authentication errors (401 Unauthorized or 403 Forbidden)
  if (response.status === 401 || response.status === 403) {
    if (sessionStorage.getItem('sweetohub_admin_authenticated') === 'true') {
      window.dispatchEvent(new CustomEvent('admin-unauthorized'));
    }
  }

  return response;
}
