import React from "react";
import { Box, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import ColumnsTable from "views/admin/supplies/components/ColumnsTable";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import {
  createSupply,
  deactivateSupply,
  activateSupply,
  listSupplies,
  updateSupply,
  updateSupplyStock,
} from "api/suppliesApi";
import { listDepartments } from "api/departmentsApi";
import { listCategories } from "api/categoriesApi";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function normalizeNullableText(value) {
  const text = String(value || "").trim();
  return text ? text : null;
}

function normalizeNullableNumber(value, defaultValue = null) {
  if (value === "" || value === undefined || value === null) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function normalizeNullableId(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapSupplyToRow(item, index) {
  return {
    stt: index + 1,
    id: item.id,
    code: item.supply_code || "",
    name: item.name || "",
    category_id: item.category_id ?? null,
    category: item.category?.category_name || "",
    unit: item.unit || "item",
    quantity_in_stock: String(item.quantity_in_stock ?? 0),
    minimum_stock_level: String(item.minimum_stock_level ?? 0),
    unit_price:
      item.unit_price === null || item.unit_price === undefined
        ? ""
        : String(item.unit_price),
    location: item.location || "",
    description: item.description || "",
    note: item.note || "",
    managed_department_id: item.managed_department_id ?? null,
    managed_department: item.managed_department?.name || "-",
    is_active: item.is_active ?? true,
    created_at: formatDateTime(item.created_at),
    updated_at: formatDateTime(item.updated_at),
  };
}

export default function Supplies() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tableData, setTableData] = React.useState([]);
  const [departmentOptions, setDepartmentOptions] = React.useState([]);
  const [categoryOptions, setCategoryOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [deactivatingId, setDeactivatingId] = React.useState(null);
  const [activatingId, setActivatingId] = React.useState(null);
  const [stockUpdatingId, setStockUpdatingId] = React.useState(null);
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const canManageSupplies =
    currentUserRole === "admin" || currentUserRole === "manager";

  // Backend mới: staff chỉ được xem supplies, không được cập nhật tồn kho trực tiếp
  const canUpdateStock =
    currentUserRole === "admin" || currentUserRole === "manager";

  const canDeactivateSupplyByRole = currentUserRole === "admin";

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

  const fetchSupplies = React.useCallback(async () => {
    const supplies = await listSupplies({ limit: 200 });

    setTableData(
      [...supplies]
        .sort((a, b) => a.id - b.id)
        .map((item, index) => mapSupplyToRow(item, index))
    );
  }, []);

  const fetchDepartments = React.useCallback(async () => {
    const departments = await listDepartments({ limit: 200 });

    setDepartmentOptions(
      (Array.isArray(departments) ? departments : []).map((item) => ({
        value: String(item.id),
        label: `${item.code || item.id} - ${item.name}`,
      }))
    );
  }, []);

  const fetchCategories = React.useCallback(async () => {
    const cats = await listCategories({ limit: 200, category_type: "supply" });
    setCategoryOptions(
      (Array.isArray(cats) ? cats : []).map((item) => ({
        value: String(item.id),
        label: `${item.category_code} - ${item.category_name}`,
      }))
    );
  }, []);

  const fetchCurrentProfile = React.useCallback(async () => {
    const profile = await getCurrentUser();
    setCurrentUserRole(String(profile?.role || "").trim().toLowerCase());
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSupplies(),
        fetchDepartments(),
        fetchCategories(),
        fetchCurrentProfile(),
      ]);
    } catch (error) {
      console.error("Load supplies page failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được dữ liệu vật tư",
        description: error.message || "Có lỗi xảy ra khi tải trang supplies.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentProfile, fetchCategories, fetchDepartments, fetchSupplies, handleUnauthorized, toast]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const buildSupplyPayload = (supply) => {
    const code = String(supply.code || "").trim();
    const name = String(supply.name || "").trim();
    const categoryId = supply.category_id;

    if (!code || !name || !categoryId) {
      throw new Error("Supply code, name và danh mục là bắt buộc.");
    }

    return {
      supply_code: code,
      name,
      category_id: categoryId,
      unit: String(supply.unit || "item").trim() || "item",
      quantity_in_stock: normalizeNullableNumber(supply.quantity_in_stock, 0),
      minimum_stock_level: normalizeNullableNumber(supply.minimum_stock_level, 0),
      unit_price: normalizeNullableNumber(supply.unit_price, null),
      location: normalizeNullableText(supply.location),
      description: normalizeNullableText(supply.description),
      note: normalizeNullableText(supply.note),
      managed_department_id: normalizeNullableId(supply.managed_department_id),
      is_active: false,
    };
  };

  const handleSaveSupply = async (supply) => {
    if (!canManageSupplies) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được cập nhật vật tư.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!supply?.id) {
      toast({
        title: "Thiếu id vật tư",
        description: "Chỉ admin mới được kích hoạt tài sản.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setSavingId(supply.id);

      const payload = buildSupplyPayload(supply);
      await updateSupply(supply.id, payload);
      await fetchSupplies();

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin vật tư đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update supply failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật vật tư.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateSupply = async (supply) => {
    if (!canManageSupplies) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được tạo vật tư.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setCreating(true);

      const payload = buildSupplyPayload(supply);
      await createSupply(payload);
      await fetchSupplies();

      toast({
        title: "Tạo thành công",
        description: "Vật tư mới đã được tạo.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Create supply failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Tạo thất bại",
        description: error.message || "Không thể tạo vật tư.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivateSupply = async (supply) => {
    if (!canDeactivateSupplyByRole) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được vô hiệu hóa vật tư.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!supply?.id) {
      toast({
        title: "Thiếu id vật tư",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!supply.is_active) {
      toast({
        title: "Không hợp lệ",
        description: "Vật tư này đã ở trạng thái inactive.",
        status: "info",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    try {
      setDeactivatingId(supply.id);
      await deactivateSupply(supply.id);
      await fetchSupplies();

      toast({
        title: "Đã vô hiệu hóa",
        description: "Vật tư đã được chuyển sang inactive.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Deactivate supply failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Thao tác thất bại",
        description: error.message || "Không thể vô hiệu hóa vật tư.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleActivateSupply = async (supply) => {
    if (!canDeactivateSupplyByRole) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được kích hoạt vật tư.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!supply?.id) {
      toast({
        title: "Thiếu id vật tư",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (supply.is_active) {
      toast({
        title: "Không hợp lệ",
        description: "Vật tư này đã ở trạng thái active.",
        status: "info",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    try {
      setActivatingId(supply.id);
      await activateSupply(supply.id);
      await fetchSupplies();

      toast({
        title: "Đã kích hoạt",
        description: "Vật tư đã được chuyển sang active.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Activate supply failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Thao tác thất bại",
        description: error.message || "Không thể kích hoạt vật tư.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActivatingId(null);
    }
  };

  const handleUpdateStock = async ({ id, quantity_change, note }) => {
    if (!canUpdateStock) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được cập nhật tồn kho.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!id) {
      toast({
        title: "Thiếu id vật tư",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    const parsedChange = Number(quantity_change);

    if (!Number.isFinite(parsedChange) || parsedChange === 0) {
      toast({
        title: "Số lượng không hợp lệ",
        description: "quantity_change phải là số khác 0.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setStockUpdatingId(id);

      await updateSupplyStock(id, {
        quantity_change: parsedChange,
        note: normalizeNullableText(note),
      });

      await fetchSupplies();

      toast({
        title: "Cập nhật tồn kho thành công",
        description:
          parsedChange > 0
            ? `Đã nhập thêm ${parsedChange} đơn vị vật tư.`
            : `Đã xuất ${Math.abs(parsedChange)} đơn vị vật tư.`,
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update supply stock failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Cập nhật tồn kho thất bại",
        description: error.message || "Không thể cập nhật tồn kho.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setStockUpdatingId(null);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <ColumnsTable
        tableData={tableData}
        title="Quản lý vật tư"
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        canManageSupplies={canManageSupplies}
        canUpdateStock={canUpdateStock}
        canDeactivateSupplyByRole={canDeactivateSupplyByRole}
        currentUserRole={currentUserRole}
        loading={loading}
        onSaveSupply={{
          handler: handleSaveSupply,
          loadingId: savingId,
        }}
        onDeactivateSupply={{
          handler: handleDeactivateSupply,
          loadingId: deactivatingId,
        }}
        onActivateSupply={{
          handler: handleActivateSupply,
          loadingId: activatingId
        }}
        onCreateSupply={{
          handler: handleCreateSupply,
          loading: creating,
        }}
        onUpdateStock={{
          handler: handleUpdateStock,
          loadingId: stockUpdatingId,
        }}
      />
    </Box>
  );
}