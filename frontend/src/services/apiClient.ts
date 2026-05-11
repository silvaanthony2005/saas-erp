const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Cliente de API base para manejar peticiones con validación de licencia automática.
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // En una versión final, aquí se inyectarían tokens o headers de HWID si fuera necesario
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      // Manejar expiración de licencia o bloqueo
      console.error("Acceso denegado: Licencia inválida o expirada.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error en la petición: ${response.status}`);
  }

  return response.json();
}
