import { API_BASE_URL } from "config/api";
import {
  ApiError,
  apiRequest,
  buildQueryString,
  getAccessToken,
} from "./http";

const BASE_PATH = "/asset-loans";

async function parseBinaryError(response) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      const message =
        data?.detail || data?.message || "Không thể tải PDF phiếu mượn tài sản.";
      throw new ApiError(message, response.status, data);
    }

    const text = await response.text();
    throw new ApiError(
      text || "Không thể tải PDF phiếu mượn tài sản.",
      response.status,
      text
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Không thể tải PDF phiếu mượn tài sản.",
      response.status,
      null
    );
  }
}

export const listAssetLoans = async (params = {}) => {
  const queryString = buildQueryString(params);
  return apiRequest(`${BASE_PATH}${queryString}`);
};

export const getAssetLoanById = async (loanId) => {
  return apiRequest(`${BASE_PATH}/${loanId}`);
};

export const createAssetLoan = async (payload) => {
  return apiRequest(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const approveAssetLoan = async (loanId, payload = {}) => {
  return apiRequest(`${BASE_PATH}/${loanId}/approve`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const receiveAssetLoan = async (loanId, payload = {}) => {
  return apiRequest(`${BASE_PATH}/${loanId}/receive`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const returnAssetLoan = async (loanId, payload = {}) => {
  return apiRequest(`${BASE_PATH}/${loanId}/return`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const cancelAssetLoan = async (loanId, payload = {}) => {
  return apiRequest(`${BASE_PATH}/${loanId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const getAssetLoanPdfBlob = async (loanId) => {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${loanId}/pdf`, {
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

export const openAssetLoanPdf = async (loanId) => {
  const blob = await getAssetLoanPdfBlob(loanId);
  const blobUrl = window.URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60000);

  return blobUrl;
};

const assetLoansApi = {
  listAssetLoans,
  getAssetLoanById,
  createAssetLoan,
  approveAssetLoan,
  receiveAssetLoan,
  returnAssetLoan,
  cancelAssetLoan,
  getAssetLoanPdfBlob,
  openAssetLoanPdf,
};

export default assetLoansApi;