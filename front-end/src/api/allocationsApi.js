import { apiRequest, buildQueryString } from "./http";

export function listAllocations(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/allocations${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách allocations.",
  });
}

export function getAllocationById(allocationId) {
  return apiRequest(`/allocations/${allocationId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin allocation.",
  });
}

export function createAllocation(payload) {
  return apiRequest("/allocations", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo allocation thất bại.",
  });
}

export function updateAllocation(allocationId, payload) {
  return apiRequest(`/allocations/${allocationId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật allocation thất bại.",
  });
}

export function updateAllocationStatus(allocationId, payload) {
  return apiRequest(`/allocations/${allocationId}/status`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật trạng thái allocation thất bại.",
  });
}

export function deactivateAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}/deactivate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Vô hiệu hóa allocation thất bại.",
  });
}