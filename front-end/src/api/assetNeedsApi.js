import { apiRequest, buildQueryString } from "./http";

export function getAssetNeeds(departmentId) {
  const query = buildQueryString({ department_id: departmentId });
  return apiRequest(`/asset-needs${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được nhu cầu tài sản.",
  });
}

export function updateCategoryRequirement(payload) {
  return apiRequest("/asset-needs/category-requirement", {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật số lượng cần thất bại.",
  });
}
