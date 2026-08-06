type MedusaError = {
  response?: {
    data: { message?: string } | string;
    status: number;
    headers: unknown;
  };
  request?: unknown;
  message?: string;
  config?: { url: string; baseURL: string };
};

/**
 * Normalizes a Medusa/Axios-style error into a single thrown `Error` with a
 * human-readable message, after logging the underlying details.
 *
 * - If the request reached the server and got a response, logs the resource,
 *   response data, status, and headers, then throws using the response's
 *   message (capitalized, period-terminated).
 * - If the request was sent but no response was received, throws with the
 *   raw request info.
 * - Otherwise (error occurred while setting up the request), throws with
 *   `err.message`.
 *
 * Never returns normally — always throws.
 */
function medusaError(error: unknown): never {
  const err = error as MedusaError;
  if (err.response) {
    const u = new URL(err.config?.url ?? "", err.config?.baseURL ?? "");
    console.error("Resource:", u.toString());
    console.error("Response data:", err.response.data);
    console.error("Status code:", err.response.status);
    console.error("Headers:", err.response.headers);

    const data = err.response.data;
    const message =
      typeof data === "object" && data !== null
        ? data.message || String(data)
        : data;

    throw new Error(message.charAt(0).toUpperCase() + message.slice(1) + ".");
  } else if (err.request) {
    throw new Error("No response received: " + String(err.request));
  } else {
    throw new Error("Error setting up the request: " + err.message);
  }
}

export { medusaError };
