import { apiRequest, buildQueryString } from "./http";

export function listUsers(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/users${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách người dùng.",
  });
}

export function getUserById(userId) {
  return apiRequest(`/users/${userId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin người dùng.",
  });
}

export function createUser(payload) {
  return apiRequest("/users", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo người dùng thất bại.",
  });
}

export function updateUser(userId, payload) {
  return apiRequest(`/users/${userId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật người dùng thất bại.",
  });
}

export function deactivateUser(userId) {
  return apiRequest(`/users/${userId}/deactivate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Vô hiệu hóa người dùng thất bại.",
  });
}

export function activateUser(userId) {
  return apiRequest(`/users/${userId}/activate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Kích hoạt người dùng thất bại.",
  });
}