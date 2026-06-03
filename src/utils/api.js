/**
 * SWEETO API Client with Private Network Access (PNA) compatibility.
 * 
 * - In local development (localhost/127.0.0.1): uses relative `/api` paths to route
 *   through Vite's built-in dev proxy. This bypasses PNA/CORS constraints.
 * - In production/public deployment: targets custom VITE_API_URL or defaults to `http://localhost:3000/api`
 */

const customBackendUrl = import.meta.env.VITE_API_URL;

export function isLocalHost() {
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^127\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host) ||
    host.endsWith('.local') ||
    !!import.meta.env.DEV
  );
}

const getDefaultBackendUrl = () => {
  const { protocol, hostname } = window.location;
  if (hostname && isLocalHost()) {
    return `${protocol}//${hostname}:3000`;
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = customBackendUrl ? customBackendUrl.replace(/\/$/, '') : getDefaultBackendUrl();

export async function apiFetch(path, options = {}) {
  const isLocal = isLocalHost();
  
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
  
  if (isLocal) {
    targetUrl = `/api/${cleanPath}`;
  } else {
    targetUrl = `${API_BASE_URL}/api/${cleanPath}`;
    
    // Add Private Network Access (PNA) header to resolve security blocks for local testing
    if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
      fetchOptions.targetAddressSpace = 'loopback';
    }
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
