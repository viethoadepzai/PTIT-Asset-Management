import { apiRequest, buildQueryString } from "./http";

export function listCategories(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/categories${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách danh mục.",
  });
}

export function getCategoryById(categoryId) {
  return apiRequest(`/categories/${categoryId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin danh mục.",
  });
}

export function createCategory(payload) {
  return apiRequest("/categories", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo danh mục thất bại.",
  });
}

export function updateCategory(categoryId, payload) {
  return apiRequest(`/categories/${categoryId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật danh mục thất bại.",
  });
}

export function deleteCategory(categoryId) {
  return apiRequest(`/categories/${categoryId}`, {
    method: "DELETE",
    auth: true,
    fallbackErrorMessage: "Xóa danh mục thất bại.",
  });
}

export function updateRequireQuantity(categoryId, departmentId, requireQuantity) {
  return apiRequest(`/categories/${categoryId}/require-quantity`, {
    method: "PATCH",
    auth: true,
    body: { department_id: departmentId, require_quantity: requireQuantity },
    fallbackErrorMessage: "Cập nhật số lượng cần thất bại.",
  });
}
