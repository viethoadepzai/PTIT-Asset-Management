import { API_BASE_URL } from "config/api";

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function clearAuthStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
}

function isFormData(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function buildHeaders({ auth = true, headers = {}, body } = {}) {
  const finalHeaders = { ...headers };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  if (!isFormData(body) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  return finalHeaders;
}

export function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, item);
        }
      });
      return;
    }

    searchParams.append(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => null);
}

function getErrorMessage(data, fallback = "Yêu cầu thất bại.") {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item?.msg || "Dữ liệu không hợp lệ")
      .join(", ");
  }

  if (typeof data.message === "string") return data.message;

  return fallback;
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    auth = true,
    headers = {},
    body,
    fallbackErrorMessage,
  } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders({ auth, headers, body }),
    body: body
      ? isFormData(body)
        ? body
        : typeof body === "string"
          ? body
          : JSON.stringify(body)
      : undefined,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
    }

    throw new ApiError(
      getErrorMessage(data, fallbackErrorMessage || "Yêu cầu thất bại."),
      response.status,
      data
    );
  }

  return data;
}


let isRedirecting = false;

export function handleAuthExpired() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");

  if (!isRedirecting) {
    isRedirecting = true;
    window.location.href = "/auth/sign-in";
  }
}

export function isUnauthorizedError(error) {
  return error instanceof ApiError && error.status === 401;
}