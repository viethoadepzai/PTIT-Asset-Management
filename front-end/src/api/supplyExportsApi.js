import { API_BASE_URL } from "config/api";
import {
  ApiError,
  apiRequest,
  buildQueryString,
  getAccessToken,
} from "./http";

const BASE_PATH = "/supply-exports";

async function parseBinaryError(response) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      const message =
        data?.detail ||
        data?.message ||
        "Không thể tải PDF phiếu xuất vật tư.";
      throw new ApiError(message, response.status, data);
    }

    const text = await response.text();
    throw new ApiError(
      text || "Không thể tải PDF phiếu xuất vật tư.",
      response.status,
      text
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Không thể tải PDF phiếu xuất vật tư.",
      response.status,
      null
    );
  }
}

export const listSupplyExports = async (params = {}) => {
  const queryString = buildQueryString(params);
  return apiRequest(`${BASE_PATH}${queryString}`);
};

export const getSupplyExportById = async (voucherId) => {
  return apiRequest(`${BASE_PATH}/${voucherId}`);
};

export const createSupplyExport = async (payload) => {
  return apiRequest(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const approveSupplyExport = async (voucherId) => {
  return apiRequest(`${BASE_PATH}/${voucherId}/approve`, {
    method: "PATCH",
  });
};

export const cancelSupplyExport = async (voucherId, payload = {}) => {
  return apiRequest(`${BASE_PATH}/${voucherId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const getSupplyExportPdfBlob = async (voucherId) => {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${voucherId}/pdf`, {
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

export const openSupplyExportPdf = async (voucherId) => {
  const blob = await getSupplyExportPdfBlob(voucherId);
  const blobUrl = window.URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60000);

  return blobUrl;
};

const supplyExportsApi = {
  listSupplyExports,
  getSupplyExportById,
  createSupplyExport,
  approveSupplyExport,
  cancelSupplyExport,
  getSupplyExportPdfBlob,
  openSupplyExportPdf,
};

export default supplyExportsApi;