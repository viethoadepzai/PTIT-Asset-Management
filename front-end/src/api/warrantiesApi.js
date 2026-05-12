import { API_BASE_URL } from "config/api";
import {
  ApiError,
  apiRequest,
  buildQueryString,
  getAccessToken,
} from "./http";

const BASE_PATH = "/warranties";

async function parseBinaryError(response) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      const message =
        data?.detail || data?.message || "Không thể tải PDF phiếu bảo hành.";
      throw new ApiError(message, response.status, data);
    }

    const text = await response.text();
    throw new ApiError(
      text || "Không thể tải PDF phiếu bảo hành.",
      response.status,
      text
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Không thể tải PDF phiếu bảo hành.",
      response.status,
      null
    );
  }
}

export const listWarranties = async (params = {}) => {
  const queryString = buildQueryString(params);
  return apiRequest(`${BASE_PATH}${queryString}`);
};

export const getWarrantyById = async (ticketId) => {
  return apiRequest(`${BASE_PATH}/${ticketId}`);
};

export const createWarranty = async (payload) => {
  return apiRequest(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const sendWarranty = async (ticketId, payload) => {
  return apiRequest(`${BASE_PATH}/${ticketId}/send`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const completeWarranty = async (ticketId, payload) => {
  return apiRequest(`${BASE_PATH}/${ticketId}/complete`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const cancelWarranty = async (ticketId, payload = {}) => {
  return apiRequest(`${BASE_PATH}/${ticketId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const getWarrantyPdfBlob = async (ticketId) => {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${ticketId}/pdf`, {
    method: "GET",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  if (!response.ok) {
    await parseBinaryError(response);
  }

  return response.blob();
};

export const openWarrantyPdf = async (ticketId) => {
  const blob = await getWarrantyPdfBlob(ticketId);
  const blobUrl = window.URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60000);

  return blobUrl;
};

const warrantiesApi = {
  listWarranties,
  getWarrantyById,
  createWarranty,
  sendWarranty,
  completeWarranty,
  cancelWarranty,
  getWarrantyPdfBlob,
  openWarrantyPdf,
};

export default warrantiesApi;