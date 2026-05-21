const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("stellar_token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers as Record<string, string>,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("stellar_token");
      localStorage.removeItem("stellar_user");
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    if (response.status === 403) {
      console.error("Acceso denegado.");
    }
    const errorData = await response.json().catch(() => ({}));
    const error: Error & { status?: number } = new Error(errorData.detail || `Error en la petición: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}
