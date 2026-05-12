import { apiRequest, buildQueryString } from "./http";

export function listMaintenances(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/maintenances${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách maintenances.",
  });
}

export function getMaintenanceById(maintenanceId) {
  return apiRequest(`/maintenances/${maintenanceId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin maintenance.",
  });
}

export function createMaintenance(payload) {
  return apiRequest("/maintenances", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo maintenance thất bại.",
  });
}

export function updateMaintenance(maintenanceId, payload) {
  return apiRequest(`/maintenances/${maintenanceId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật maintenance thất bại.",
  });
}

export function updateMaintenanceStatus(maintenanceId, payload) {
  return apiRequest(`/maintenances/${maintenanceId}/status`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật trạng thái maintenance thất bại.",
  });
}

export function deactivateMaintenance(maintenanceId) {
  return apiRequest(`/maintenances/${maintenanceId}/deactivate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Vô hiệu hóa maintenance thất bại.",
  });
}