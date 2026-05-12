import { apiRequest, buildQueryString } from "./http";

export function listCategoryNeeds(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/category-needs${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được nhu cầu danh mục.",
  });
}

export function createCategoryNeed(payload) {
  return apiRequest("/category-needs", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo nhu cầu thất bại.",
  });
}

export function updateCategoryRequireQuantity(categoryId, payload) {
  return apiRequest(`/category-needs/${categoryId}`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật nhu cầu thất bại.",
  });
}

export function updateCategoryNeed(categoryNeedId, payload) {
  return apiRequest(`/category-needs/${categoryNeedId}`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật nhu cầu thất bại.",
  });
}

export function deleteCategoryNeed(categoryNeedId) {
  return apiRequest(`/category-needs/${categoryNeedId}`, {
    method: "DELETE",
    auth: true,
    fallbackErrorMessage: "Xóa nhu cầu thất bại.",
  });
}

// =========================================================
// WORKFLOW ACTIONS
// =========================================================

export function submitCategoryNeed(categoryNeedId) {
  return apiRequest(`/category-needs/${categoryNeedId}/submit`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Gửi duyệt thất bại.",
  });
}

export function approveCategoryNeed(categoryNeedId) {
  return apiRequest(`/category-needs/${categoryNeedId}/approve`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Phê duyệt thất bại.",
  });
}

export function rejectCategoryNeed(categoryNeedId, rejectedReason) {
  return apiRequest(`/category-needs/${categoryNeedId}/reject`, {
    method: "PATCH",
    auth: true,
    body: { rejected_reason: rejectedReason },
    fallbackErrorMessage: "Từ chối thất bại.",
  });
}

export function cancelCategoryNeed(categoryNeedId) {
  return apiRequest(`/category-needs/${categoryNeedId}/cancel`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Hủy phiếu thất bại.",
  });
}
