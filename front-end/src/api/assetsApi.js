import { apiRequest, buildQueryString } from "./http";

export function listAssets(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/assets${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách tài sản.",
  });
}

export function getAssetById(assetId) {
  return apiRequest(`/assets/${assetId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin tài sản.",
  });
}

export function createAsset(payload) {
  return apiRequest("/assets", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo tài sản thất bại.",
  });
}

export function updateAsset(assetId, payload) {
  return apiRequest(`/assets/${assetId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật tài sản thất bại.",
  });
}

export function updateAssetStatus(assetId, payload) {
  return apiRequest(`/assets/${assetId}/status`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật trạng thái tài sản thất bại.",
  });
}

export function deactivateAsset(assetId) {
  return apiRequest(`/assets/${assetId}/deactivate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Vô hiệu hóa tài sản thất bại.",
  });
}

export function activateAsset(assetId) {
  return apiRequest(`/assets/${assetId}/activate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Kích hoạt tài sản thất bại.",
  });
}