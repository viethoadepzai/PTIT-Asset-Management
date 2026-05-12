import { apiRequest, buildQueryString } from "./http";

export function listInventoryAudits(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/inventory-audits${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách kiểm kê.",
  });
}

export function getInventoryAuditDetail(auditId) {
  return apiRequest(`/inventory-audits/${auditId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin kiểm kê.",
  });
}

export function createInventoryAudit(payload) {
  return apiRequest("/inventory-audits", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo lịch kiểm kê thất bại.",
  });
}

export function updateInventoryAudit(auditId, payload) {
  return apiRequest(`/inventory-audits/${auditId}`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật kiểm kê thất bại.",
  });
}

export function bulkUpdateInventoryAuditItems(auditId, payloads) {
  return apiRequest(`/inventory-audits/${auditId}/items`, {
    method: "PATCH",
    auth: true,
    body: payloads,
    fallbackErrorMessage: "Lưu số liệu kiểm kê thất bại.",
  });
}

// =========================================================
// WORKFLOW ACTIONS
// =========================================================

export function startInventoryAudit(auditId) {
  return apiRequest(`/inventory-audits/${auditId}/start`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Bắt đầu kiểm kê thất bại.",
  });
}

export function submitInventoryAudit(auditId) {
  return apiRequest(`/inventory-audits/${auditId}/submit`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Gửi duyệt thất bại.",
  });
}

export function approveInventoryAudit(auditId) {
  return apiRequest(`/inventory-audits/${auditId}/approve`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Phê duyệt thất bại.",
  });
}

export function completeInventoryAudit(auditId) {
  return apiRequest(`/inventory-audits/${auditId}/complete`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Hoàn tất kiểm kê thất bại.",
  });
}

export function cancelInventoryAudit(auditId) {
  return apiRequest(`/inventory-audits/${auditId}/cancel`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Hủy đợt kiểm kê thất bại.",
  });
}
