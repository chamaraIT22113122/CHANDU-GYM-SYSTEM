const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * A wrapper around the native fetch API that automatically prepends the VITE_API_URL
 * and includes credentials (cookies) for cross-domain authentication.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Ensure endpoint starts with a slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${path}`;

  const defaultOptions: RequestInit = {
    credentials: "include", // MUST be include to send cookies cross-domain
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  // If we're passing FormData (e.g. for file uploads), we need to let the browser set the Content-Type automatically
  if (options.body instanceof FormData) {
    // We create a new Headers object without Content-Type to avoid boundary missing errors
    const headers = new Headers(finalOptions.headers);
    headers.delete('Content-Type');
    
    // Have to cast to any to get around TS complaints, or just reconstruct
    const safeHeaders: Record<string, string> = {};
    headers.forEach((value, key) => { safeHeaders[key] = value; });
    finalOptions.headers = safeHeaders;
  }

  return fetch(url, finalOptions);
}
