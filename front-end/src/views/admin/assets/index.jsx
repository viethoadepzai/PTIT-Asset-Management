import React from "react";
import { Box, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import ColumnsTable from "views/admin/assets/components/ColumnsTable";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import {
  createAsset,
  deactivateAsset,
  activateAsset,
  listAssets,
  updateAsset,
} from "api/assetsApi";
import { listDepartments } from "api/departmentsApi";
import { listUsers } from "api/usersApi";
import { listCategories } from "api/categoriesApi";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function formatCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function mapAssetToRow(item, index) {
  return {
    stt: index + 1,
    id: item.id,
    code: item.asset_code || "",
    name: item.name || "",
    category_id: item.category_id ?? null,
    category: item.category?.category_name || "",
    serial_number: item.serial_number || "",
    specification: item.specification || "",
    purchase_date: item.purchase_date || "",
    useful_life: item.useful_life || 0,
    purchase_cost: formatCurrencyValue(item.purchase_cost),
    status: item.status || "available",
    condition: item.condition || "good",
    location: item.location || "",
    note: item.note || "",
    assigned_department_id: item.assigned_department_id ?? null,
    assigned_user_id: item.assigned_user_id ?? null,
    assigned_department: item.assigned_department?.name || "-",
    assigned_user: item.assigned_user?.full_name || "-",
    is_active: item.is_active ?? true,
    created_at: formatDateTime(item.created_at),
    updated_at: formatDateTime(item.updated_at),
  };
}

function normalizeNullableId(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeNullableText(value) {
  const text = String(value || "").trim();
  return text ? text : null;
}

function normalizeNullableNumber(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function Assets() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tableData, setTableData] = React.useState([]);
  const [departmentOptions, setDepartmentOptions] = React.useState([]);
  const [userOptions, setUserOptions] = React.useState([]);
  const [categoryOptions, setCategoryOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [deactivatingId, setDeactivatingId] = React.useState(null);
  const [activatingId, setActivatingId] = React.useState(null);
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const canManageAssets =
    currentUserRole === "admin" || currentUserRole === "manager";
  const canDeactivateAssetByRole = currentUserRole === "admin";
  const handleUnauthorized = React.useCallback(() => {
    logout();

    toast({
      title: "Phiên đăng nhập đã hết hạn",
      description: "Vui lòng đăng nhập lại.",
      status: "warning",
      duration: 2500,
      isClosable: true,
    });

    navigate("/auth/sign-in", { replace: true });
  }, [navigate, toast]);

  const fetchAssets = React.useCallback(async () => {
    const assets = await listAssets({ limit: 200 });
    console.log(assets);
    setTableData(
      [...assets]
        .sort((a, b) => a.id - b.id)
        .map((item, index) => mapAssetToRow(item, index))
    );
  }, []);

  const fetchSelectOptions = React.useCallback(async (role) => {
    const normalizedRole = String(role || "").trim().toLowerCase();
    const canLoadUsers =
      normalizedRole === "admin" || normalizedRole === "manager";

    const requests = [
      listDepartments({ limit: 200 }),
      listCategories({ limit: 200, category_type: "asset" }),
    ];
    if (canLoadUsers) {
      requests.push(listUsers({ limit: 200 }));
    }

    const results = await Promise.all(requests);
    const departments = results[0];
    const categories = results[1];
    const users = canLoadUsers ? results[2] : [];

    setDepartmentOptions(
      (Array.isArray(departments) ? departments : []).map((item) => ({
        value: String(item.id),
        label: `${item.code || item.id} - ${item.name}`,
      }))
    );

    setCategoryOptions(
      (Array.isArray(categories) ? categories : []).map((item) => ({
        value: String(item.id),
        label: `${item.category_code} - ${item.category_name}`,
      }))
    );

    setUserOptions(
      (Array.isArray(users) ? users : []).map((item) => ({
        value: String(item.id),
        label: `${item.id} - ${item.full_name}`,
      }))
    );
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);

      const profile = await getCurrentUser();
      const role = String(profile?.role || "").trim().toLowerCase();
      setCurrentUserRole(role);

      await Promise.all([fetchAssets(), fetchSelectOptions(role)]);
    } catch (error) {
      console.error("Load assets page failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được dữ liệu tài sản",
        description: error.message || "Có lỗi xảy ra khi tải trang assets.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchAssets, fetchSelectOptions, handleUnauthorized, toast]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const buildAssetPayload = (asset) => {
    const assetCode = String(asset.code || "").trim();
    const name = String(asset.name || "").trim();
    const categoryId = asset.category_id;

    if (!assetCode || !name || !categoryId) {
      throw new Error("Asset code, name và danh mục là bắt buộc.");
    }

    return {
      asset_code: assetCode,
      name,
      category_id: categoryId,
      serial_number: normalizeNullableText(asset.serial_number),
      specification: normalizeNullableText(asset.specification),
      purchase_date: normalizeNullableText(asset.purchase_date),
      useful_life: normalizeNullableNumber(asset.useful_life),
      purchase_cost: normalizeNullableNumber(asset.purchase_cost),
      status: String(asset.status || "available").trim(),
      condition: String(asset.condition || "good").trim(),
      location: normalizeNullableText(asset.location),
      note: normalizeNullableText(asset.note),
      assigned_department_id: normalizeNullableId(asset.assigned_department_id),
      assigned_user_id: normalizeNullableId(asset.assigned_user_id),
      is_active: asset.is_active ?? false,
    };
  };

  const handleSaveAsset = async (asset) => {
    if (!canManageAssets) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được cập nhật tài sản.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!asset?.id) {
      toast({
        title: "Thiếu id tài sản",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setSavingId(asset.id);

      const payload = buildAssetPayload(asset);
      console.log("Dữ liệu asset update:", payload);
      await updateAsset(asset.id, payload);
      await fetchAssets();

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin tài sản đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update asset failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật tài sản.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateAsset = async (asset) => {
    if (!canManageAssets) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được tạo tài sản.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setCreating(true);

      const payload = buildAssetPayload(asset);
      await createAsset(payload);
      await fetchAssets();

      toast({
        title: "Tạo thành công",
        description: "Tài sản mới đã được tạo.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Create asset failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Tạo thất bại",
        description: error.message || "Không thể tạo tài sản.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivateAsset = async (asset) => {
    if (!canDeactivateAssetByRole) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được vô hiệu hóa tài sản.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!asset?.id) {
      toast({
        title: "Thiếu id tài sản",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!asset.is_active) {
      toast({
        title: "Không hợp lệ",
        description: "Tài sản này đã ở trạng thái inactive.",
        status: "info",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    try {
      setDeactivatingId(asset.id);
      await deactivateAsset(asset.id);
      await fetchAssets();

      toast({
        title: "Đã vô hiệu hóa",
        description: "Tài sản đã được chuyển sang inactive.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Deactivate asset failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Thao tác thất bại",
        description: error.message || "Không thể vô hiệu hóa tài sản.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleActivateAsset = async (asset) => {
    console.log("Bạn vừa bấm kích hoạt!")
    if (!canDeactivateAssetByRole) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được kích hoạt tài sản.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!asset?.id) {
      toast({
        title: "Thiếu id tài sản",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (asset.is_active) {
      toast({
        title: "Không hợp lệ",
        description: "Tài sản này đã ở trạng thái đã kích hoạt.",
        status: "info",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    try {
      setActivatingId(asset.id);
      await activateAsset(asset.id);
      await fetchAssets();

      toast({
        title: "Đã kích hoạt",
        description: "Tài sản đã được chuyển sang active.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Active asset failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Thao tác thất bại",
        description: error.message || "Không thể kích hoạt tài sản.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <ColumnsTable
        tableData={tableData}
        title="Quản lý tài sản"
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        userOptions={userOptions}
        canManageAssets={canManageAssets}
        canDeactivateAssetByRole={canDeactivateAssetByRole}
        currentUserRole={currentUserRole}
        loading={loading}
        onSaveAsset={{
          handler: handleSaveAsset,
          loadingId: savingId,
        }}
        onDeactivateAsset={{
          handler: handleDeactivateAsset,
          loadingId: deactivatingId,
        }}

        onActivateAsset={{
          handler: handleActivateAsset,
          loadingId: activatingId,
        }}
        onCreateAsset={{
          handler: handleCreateAsset,
          loading: creating,
        }}
        addLabel={ currentUserRole==="admin" ? "Thêm tài sản" : "Yêu cầu thêm tài sản"}
      />
    </Box>
  );
}