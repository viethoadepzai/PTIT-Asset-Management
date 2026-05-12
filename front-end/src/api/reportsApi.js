import { apiRequest, buildQueryString } from "./http";

export function getDashboardSummary() {
  return apiRequest("/reports/dashboard-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được tổng quan dashboard.",
  });
}

export function getMyDashboardSummary() {
  return apiRequest("/reports/my-dashboard-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được dashboard của bạn.",
  });
}

export function getAssetStatusSummary() {
  return apiRequest("/reports/asset-status-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được trạng thái tài sản.",
  });
}

export function getAllocationStatusSummary() {
  return apiRequest("/reports/allocation-status-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được trạng thái cấp phát.",
  });
}

export function getMaintenanceStatusSummary() {
  return apiRequest("/reports/maintenance-status-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được trạng thái bảo trì.",
  });
}

export function getLowStockSupplies(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/reports/low-stock-supplies${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách vật tư tồn kho thấp.",
  });
}

export function getRecentActivity(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/reports/recent-activity${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được hoạt động gần đây.",
  });
}

export function getQuantityAssetStatusSummary() {
  return apiRequest("/reports/quantity-asset-status-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được trạng thái lô tài sản.",
  });
}

export function getAssetsByDepartment() {
  return apiRequest("/reports/assets-by-department", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được tài sản theo phòng ban.",
  });
}

export function getPendingApprovals(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/reports/pending-approvals${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách chờ duyệt.",
  });
}

export async function getDashboardData(currentUserRole = "") {
  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();

  if (normalizedRole === "staff") {
    const summary = await getMyDashboardSummary();
    return {
      summary,
      assetStatusSummary: [],
      quantityAssetStatusSummary: [],
      lowStockSupplies: [],
      allocationStatusSummary: [],
      maintenanceStatusSummary: [],
      assetsByDepartment: [],
      pendingApprovals: [],
      recentActivity: [],
      dashboardMode: "staff",
    };
  }

  const [
    summary,
    assetStatusSummary,
    lowStockSupplies,
    allocationStatusSummary,
    maintenanceStatusSummary,
    recentActivity,
    quantityAssetStatusSummary,
    assetsByDepartment,
    pendingApprovals,
  ] = await Promise.all([
    getDashboardSummary(),
    getAssetStatusSummary(),
    getLowStockSupplies(),
    getAllocationStatusSummary(),
    getMaintenanceStatusSummary(),
    getRecentActivity({ limit: 12 }),
    getQuantityAssetStatusSummary(),
    getAssetsByDepartment(),
    getPendingApprovals({ limit: 10 }),
  ]);

  return {
    summary,
    assetStatusSummary,
    quantityAssetStatusSummary,
    lowStockSupplies,
    allocationStatusSummary,
    maintenanceStatusSummary,
    assetsByDepartment,
    pendingApprovals,
    recentActivity,
    dashboardMode: "full",
  };
}