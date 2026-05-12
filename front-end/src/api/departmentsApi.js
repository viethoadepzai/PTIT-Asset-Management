import { apiRequest, buildQueryString } from "./http";

export function listDepartments(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/departments${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách phòng ban.",
  });
}

export function getDepartmentById(departmentId) {
  return apiRequest(`/departments/${departmentId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin phòng ban.",
  });
}

export function createDepartment(payload) {
  return apiRequest("/departments", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo phòng ban thất bại.",
  });
}

export function deleteDepartment(departmentId) {
  return apiRequest(`/departments/${departmentId}`, {
    method: "DELETE",
    auth: true,
    fallbackErrorMessage: "Xóa phòng ban thất bại.",
  });
}

export function updateDepartment(departmentId, payload) {
  return apiRequest(`/departments/${departmentId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật phòng ban thất bại.",
  });
}

export function deactivateDepartment(departmentId) {
  return apiRequest(`/departments/${departmentId}/deactivate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Vô hiệu hóa phòng ban thất bại.",
  });
}