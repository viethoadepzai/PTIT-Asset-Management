import { apiRequest, buildQueryString } from "./http";

export function listSupplies(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/supplies${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách vật tư.",
  });
}

export function getSupplyById(supplyId) {
  return apiRequest(`/supplies/${supplyId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin vật tư.",
  });
}

export function createSupply(payload) {
  return apiRequest("/supplies", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo vật tư thất bại.",
  });
}

export function updateSupply(supplyId, payload) {
  return apiRequest(`/supplies/${supplyId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật vật tư thất bại.",
  });
}

export function updateSupplyStock(supplyId, payload) {
  return apiRequest(`/supplies/${supplyId}/stock`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật tồn kho thất bại.",
  });
}

export function deactivateSupply(supplyId) {
  return apiRequest(`/supplies/${supplyId}/deactivate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Vô hiệu hóa vật tư thất bại.",
  });
}

export function activateSupply(supplyId) {
  return apiRequest(`/supplies/${supplyId}/activate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Kích hoạt vật tư thất bại.",
  });
}