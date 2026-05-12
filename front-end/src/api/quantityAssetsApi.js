import { apiRequest, buildQueryString } from "./http";

/**
 * =========================================================
 * ASSET QUANTITY APIs
 * =========================================================
 */


/**
 * Lấy danh sách tài sản số lượng lớn
 *
 * Hỗ trợ:
 * - keyword
 * - category_id
 * - status
 * - condition
 * - assigned_department_id
 * - assigned_user_id
 * - is_active
 */
export function listAssets(params = {}) {
  const query = buildQueryString(params);

  return apiRequest(`/asset-quantities${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách tài sản.",
  });
}


/**
 * Lấy danh sách tài sản theo category
 *
 * Ví dụ:
 * Category = Bàn
 *
 * Trả:
 * - Bàn 4 chân
 * - Bàn 6 chỗ
 */
export function listAssetsByCategory(categoryId) {
  return apiRequest(`/asset-quantities/category/${categoryId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage:
      "Không tải được danh sách tài sản theo danh mục.",
  });
}


/**
 * Lấy chi tiết tài sản
 */
export function getAssetById(assetId) {
  return apiRequest(`/asset-quantities/${assetId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin tài sản.",
  });
}


/**
 * Tạo tài sản
 */
export function createAsset(payload) {
  return apiRequest("/asset-quantities", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo tài sản thất bại.",
  });
}


/**
 * Cập nhật tài sản
 */
export function updateAsset(assetId, payload) {
  return apiRequest(`/asset-quantities/${assetId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật tài sản thất bại.",
  });
}


/**
 * Cập nhật trạng thái tài sản
 */
export function updateAssetStatus(assetId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/status`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage:
      "Cập nhật trạng thái tài sản thất bại.",
  });
}


/**
 * Duyệt tài sản
 */
export function approveAsset(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/approve`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Duyệt tài sản thất bại.",
  });
}


/**
 * Từ chối tài sản
 */
export function rejectAsset(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/reject`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Từ chối tài sản thất bại.",
  });
}


/**
 * Vô hiệu hóa tài sản
 */
export function deactivateAsset(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/deactivate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Vô hiệu hóa tài sản thất bại.",
  });
}


/**
 * Kích hoạt tài sản
 */
export function activateAsset(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/activate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Kích hoạt tài sản thất bại.",
  });
}



/**
 * =========================================================
 * LOCATION APIs
 * =========================================================
 */


/**
 * Danh sách vị trí tài sản
 */
export function listLocations(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/locations`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage:
      "Không tải được danh sách vị trí.",
  });
}


/**
 * Thêm vị trí
 */
export function createLocation(assetId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/locations`, {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Thêm vị trí thất bại.",
  });
}


/**
 * Thêm vị trí báo mất
 */
export function createLostLocation(assetId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/lost-locations`, {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage:
      "Thêm vị trí báo mất thất bại.",
  });
}


/**
 * Cập nhật vị trí
 */
export function updateLocation(assetId, locationId, payload) {
  return apiRequest(
    `/asset-quantities/${assetId}/locations/${locationId}`,
    {
      method: "PUT",
      auth: true,
      body: payload,
      fallbackErrorMessage:
        "Cập nhật vị trí thất bại.",
    }
  );
}


/**
 * Xác nhận vị trí
 */
export function approveLocation(assetId, locationId, payload) {
  return apiRequest(
    `/asset-quantities/${assetId}/locations/${locationId}`,
    {
      method: "PATCH",
      auth: true,
      body: payload,
      fallbackErrorMessage:
        "Xác nhận vị trí thất bại.",
    }
  );
}


/**
 * Xác nhận vị trí báo mất
 */
export function approveLostLocation(
  assetId,
  locationId,
  payload
) {
  return apiRequest(
    `/asset-quantities/${assetId}/lost-locations/${locationId}`,
    {
      method: "PATCH",
      auth: true,
      body: payload,
      fallbackErrorMessage:
        "Xác nhận vị trí báo mất thất bại.",
    }
  );
}


/**
 * Xóa vị trí
 */
export function deleteLocation(assetId, locationId) {
  return apiRequest(
    `/asset-quantities/${assetId}/locations/${locationId}`,
    {
      method: "DELETE",
      auth: true,
      fallbackErrorMessage: "Xóa vị trí thất bại.",
    }
  );
}