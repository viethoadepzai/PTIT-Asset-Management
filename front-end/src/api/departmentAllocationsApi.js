import { apiRequest, buildQueryString } from "./http";

export function listDepartmentAllocations(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/department-allocations${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách phân bổ tài sản.",
  });
}
