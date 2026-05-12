import React from "react";
import { Box, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import ColumnsTable from "views/admin/allocations/components/ColumnsTable";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import {
  createAllocation,
  deactivateAllocation,
  listAllocations,
  updateAllocation,
  updateAllocationStatus,
} from "api/allocationsApi";
import { listDepartments } from "api/departmentsApi";
import { listUsers } from "api/usersApi";
import { listAssets } from "api/assetsApi";
import { listSupplies } from "api/suppliesApi";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function normalizeNullableText(value) {
  const text = String(value || "").trim();
  return text ? text : null;
}

function normalizeNullableId(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizePositiveNumber(value, fallback = null) {
  if (value === "" || value === undefined || value === null) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function mapAllocationToRow(item, index) {
  return {
    stt: index + 1,
    id: item.id,
    allocation_code: item.allocation_code || "",
    allocation_type: item.allocation_type || "asset",
    status: item.status || "active",
    asset_id: item.asset_id ?? null,
    supply_id: item.supply_id ?? null,
    quantity: item.quantity == null ? "1" : String(item.quantity),
    allocated_department_id: item.allocated_department_id ?? null,
    allocated_user_id: item.allocated_user_id ?? null,
    allocated_by_user_id: item.allocated_by_user_id ?? null,
    allocated_department: item.allocated_department?.name || "-",
    allocated_user: item.allocated_user?.full_name || "-",
    allocated_by_user: item.allocated_by_user?.full_name || "-",
    expected_return_date: formatDate(item.expected_return_date),
    allocated_at: formatDateTime(item.allocated_at),
    returned_at: formatDateTime(item.returned_at),
    purpose: item.purpose || "",
    note: item.note || "",
    is_active: item.is_active ?? true,
    created_at: formatDateTime(item.created_at),
    updated_at: formatDateTime(item.updated_at),
    asset: item.asset || null,
    supply: item.supply || null,
    resource_label:
      item.allocation_type === "asset"
        ? item.asset
          ? `${item.asset.asset_code} - ${item.asset.name}`
          : "-"
        : item.supply
          ? `${item.supply.supply_code} - ${item.supply.name}`
          : "-",
  };
}

export default function Allocations() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tableData, setTableData] = React.useState([]);
  const [departmentOptions, setDepartmentOptions] = React.useState([]);
  const [userOptions, setUserOptions] = React.useState([]);
  const [assetOptions, setAssetOptions] = React.useState([]);
  const [supplyOptions, setSupplyOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState(null);
  const [deactivatingId, setDeactivatingId] = React.useState(null);

  const [currentUserRole, setCurrentUserRole] = React.useState("");
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const [currentDepartmentId, setCurrentDepartmentId] = React.useState(null);

  const isAdmin = currentUserRole === "admin";
  const isManager = currentUserRole === "manager";
  const isStaff = currentUserRole === "staff";

  const canCreateAllocations = isAdmin || isManager || isStaff;
  const canEditAllocations = isAdmin || isManager;
  const canManageAllocations = isAdmin || isManager;
  const canDeactivateAllocationByRole = isAdmin;

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

  const fetchAllocations = React.useCallback(async () => {
    const allocations = await listAllocations({ limit: 200 });

    setTableData(
      [...allocations]
        .sort((a, b) => a.id - b.id)
        .map((item, index) => mapAllocationToRow(item, index))
    );
  }, []);

  const fetchSelectOptions = React.useCallback(async (role) => {
    const normalizedRole = String(role || "").trim().toLowerCase();
    const isStaffRole = normalizedRole === "staff";
    const canLoadManagerOptions =
      normalizedRole === "admin" || normalizedRole === "manager";

    const [
      departments,
      users,
      assets,
      supplies,
    ] = await Promise.all([
      canLoadManagerOptions ? listDepartments({ limit: 200 }) : Promise.resolve([]),
      canLoadManagerOptions ? listUsers({ limit: 200 }) : Promise.resolve([]),
      canLoadManagerOptions
        ? listAssets({ limit: 200, is_active: true })
        : Promise.resolve([]),
      listSupplies({ limit: 200, is_active: true }),
    ]);

    setDepartmentOptions(
      (Array.isArray(departments) ? departments : []).map((item) => ({
        value: String(item.id),
        label: `${item.code || item.id} - ${item.name}`,
      }))
    );

    setUserOptions(
      (Array.isArray(users) ? users : []).map((item) => ({
        value: String(item.id),
        label: `${item.id} - ${item.full_name}`,
      }))
    );

    setAssetOptions(
      (Array.isArray(assets) ? assets : []).map((item) => ({
        value: String(item.id),
        label: `${item.asset_code} - ${item.name}`,
      }))
    );

    let normalizedSupplies = Array.isArray(supplies) ? supplies : [];

    // Staff chỉ tạo request supply, nên chỉ cần danh sách supply
    if (isStaffRole) {
      normalizedSupplies = normalizedSupplies.filter((item) => item.is_active !== false);
    }

    setSupplyOptions(
      normalizedSupplies.map((item) => ({
        value: String(item.id),
        label: `${item.supply_code} - ${item.name}`,
      }))
    );
  }, []);

  const fetchCurrentProfile = React.useCallback(async () => {
    const profile = await getCurrentUser();

    setCurrentUserRole(String(profile?.role || "").trim().toLowerCase());
    setCurrentUserId(profile?.id ?? null);
    setCurrentDepartmentId(profile?.department_id ?? null);

    return profile;
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);

      const profile = await fetchCurrentProfile();
      const role = String(profile?.role || "").trim().toLowerCase();

      await Promise.all([
        fetchAllocations(),
        fetchSelectOptions(role),
      ]);
    } catch (error) {
      console.error("Load allocations page failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được dữ liệu allocations",
        description: error.message || "Có lỗi xảy ra khi tải trang allocations.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [
    fetchAllocations,
    fetchCurrentProfile,
    fetchSelectOptions,
    handleUnauthorized,
    toast,
  ]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const buildCreatePayload = (allocation) => {
    const allocationCode = String(allocation.allocation_code || "").trim();
    const allocationType = String(allocation.allocation_type || "asset").trim();

    if (!allocationCode) {
      toast({
        title: "Thiếu code bản cấp phát",
        description: "Cần bổ sung thông tin code.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (allocationType !== "asset" && allocationType !== "supply") {
      toast({
        title: "Kiểu cấp phát không hợp lệ",
        description: "Có dữ liệu tài sản thì mới chọn được kiểu tài sản, tương tự với vật tư",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    // STAFF: chỉ được tạo request vật tư
    if (isStaff) {
      if (allocationType !== "supply") {
        toast({
        title: "Nhân viên chỉ được yêu cầu cấp phát vật tư",
        description: "Chỉ admin hoặc quản lí tạo cấp phát tài sản.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      }

      const supplyId = normalizeNullableId(allocation.supply_id);
      const quantity = normalizePositiveNumber(allocation.quantity, null);

      if (!supplyId) {
        toast({
        title: "Bạn phải chọn id vật tư",
        description: "Thiếu thông tin id vật tư",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      }

      if (!quantity || quantity <= 0) {
        toast({
        title: "Số lượng phải lớn hơn 0",
        description: "",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      }

      return {
        allocation_code: allocationCode,
        allocation_type: "supply",
        asset_id: null,
        supply_id: supplyId,
        quantity,
        allocated_department_id: currentDepartmentId,
        allocated_user_id: currentUserId,
        expected_return_date: null,
        purpose: normalizeNullableText(allocation.purpose),
        note: normalizeNullableText(allocation.note),
        is_active: true,
      };
    }

    const allocatedDepartmentId = normalizeNullableId(
      allocation.allocated_department_id
    );
    const allocatedUserId = normalizeNullableId(allocation.allocated_user_id);

    if (!allocatedDepartmentId && !allocatedUserId) {
      toast({
        title: "Thiếu thông tin",
        description: "Phải chọn ít nhất phòng ban hoặc người nhận",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    const payload = {
      allocation_code: allocationCode,
      allocation_type: allocationType,
      asset_id: null,
      supply_id: null,
      quantity: 1,
      allocated_department_id: allocatedDepartmentId,
      allocated_user_id: allocatedUserId,
      expected_return_date: normalizeNullableText(allocation.expected_return_date),
      purpose: normalizeNullableText(allocation.purpose),
      note: normalizeNullableText(allocation.note),
      is_active: allocation.is_active ?? true,
    };

    if (allocationType === "asset") {
      const assetId = normalizeNullableId(allocation.asset_id);

      if (!assetId) {
        toast({
        title: "Thiếu thông tin",
        description: "Phải chọn tài sản khi đã chọn kiểu tài sản.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      }

      payload.asset_id = assetId;
      payload.quantity = 1;
    } else {
      const supplyId = normalizeNullableId(allocation.supply_id);
      const quantity = normalizePositiveNumber(allocation.quantity, null);

      if (!supplyId) {
        toast({
        title: "Thiếu thông tin",
        description: "Phải chọn vật tư khi đã chọn kiểu vật tư.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      }

      if (!quantity || quantity <= 0) {
        toast({
        title: "Thiếu thông tin",
        description: "Với kiểu vật tư, số lượng phải lớn hơn 0",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      }

      payload.supply_id = supplyId;
      payload.quantity = quantity;
    }

    return payload;
  };

  const buildUpdatePayload = (allocation) => {
    const allocatedDepartmentId = normalizeNullableId(
      allocation.allocated_department_id
    );
    const allocatedUserId = normalizeNullableId(allocation.allocated_user_id);

    if (!allocatedDepartmentId && !allocatedUserId) {
      toast({
        title: "Thiếu thông tin",
        description: "Phải chọn ít nhất phòng ban hoặc người nhận",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    return {
      allocated_department_id: allocatedDepartmentId,
      allocated_user_id: allocatedUserId,
      expected_return_date: normalizeNullableText(allocation.expected_return_date),
      purpose: normalizeNullableText(allocation.purpose),
      note: normalizeNullableText(allocation.note),
      is_active: allocation.is_active ?? true,
    };
  };

  const handleCreateAllocation = async (allocation) => {
    if (!canCreateAllocations) {
      toast({
        title: "Không có quyền",
        description: "Tài khoản của bạn không được tạo allocation.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setCreating(true);

      const payload = buildCreatePayload(allocation);
      await createAllocation(payload);
      await fetchAllocations();

      toast({
        title: isStaff ? "Tạo đề nghị thành công" : "Tạo thành công",
        description: isStaff
          ? "Đề nghị cấp phát vật tư đã được tạo."
          : "Allocation mới đã được tạo.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Create allocation failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Tạo thất bại",
        description: error.message || "Không thể tạo allocation.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveAllocation = async (allocation) => {
    if (!canEditAllocations) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được cập nhật allocation.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!allocation?.id) {
      toast({
        title: "Thiếu thông tin",
        description: "Thiếu id bản cấp phát",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setSavingId(allocation.id);

      const payload = buildUpdatePayload(allocation);
      await updateAllocation(allocation.id, payload);
      await fetchAllocations();

      toast({
        title: "Cập nhật thành công",
        description: "Allocation đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update allocation failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật allocation.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateAllocationStatus = async ({ id, status, note }) => {
    if (!id) {
      toast({
        title: "Thiếu thông tin",
        description: "Thiếu id bản cấp phát",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    const normalizedStatus = String(status || "").trim().toLowerCase();
    if (!normalizedStatus) {
      toast({
        title: "Thiếu thông tin",
        description: "Status là bắt buộc",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    // STAFF chỉ được xác nhận đã nhận vật tư => completed
    if (isStaff && normalizedStatus !== "completed") {
      toast({
        title: "Không có quyền",
        description: "Staff chỉ được xác nhận đã nhận vật tư.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setStatusUpdatingId(id);

      await updateAllocationStatus(id, {
        status: normalizedStatus,
        note: normalizeNullableText(note),
      });

      await fetchAllocations();

      toast({
        title: "Cập nhật trạng thái thành công",
        description:
          isStaff && normalizedStatus === "completed"
            ? "Đã xác nhận nhận vật tư."
            : "Trạng thái allocation đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update allocation status failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Cập nhật trạng thái thất bại",
        description: error.message || "Không thể cập nhật trạng thái allocation.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeactivateAllocation = async (allocation) => {
    if (!canDeactivateAllocationByRole) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được vô hiệu hóa allocation.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!allocation?.id) {
      toast({
        title: "Thiếu thông tin",
        description: "Thiếu id bản cấp phát khi deactivate",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!allocation.is_active) {
      toast({
        title: "Không hợp lệ",
        description: "Allocation này đã ở trạng thái inactive.",
        status: "info",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    try {
      setDeactivatingId(allocation.id);
      await deactivateAllocation(allocation.id);
      await fetchAllocations();

      toast({
        title: "Đã vô hiệu hóa",
        description: "Allocation đã được chuyển sang inactive.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Deactivate allocation failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Thao tác thất bại",
        description: error.message || "Không thể vô hiệu hóa allocation.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <ColumnsTable
        tableData={tableData}
        title="Quản lý cấp phát"
        departmentOptions={departmentOptions}
        userOptions={userOptions}
        assetOptions={assetOptions}
        supplyOptions={supplyOptions}
        canCreateAllocations={canCreateAllocations}
        canEditAllocations={canEditAllocations}
        canManageAllocations={canManageAllocations}
        canDeactivateAllocationByRole={canDeactivateAllocationByRole}
        currentUserRole={currentUserRole}
        loading={loading}
        onSaveAllocation={{
          handler: handleSaveAllocation,
          loadingId: savingId,
        }}
        onCreateAllocation={{
          handler: handleCreateAllocation,
          loading: creating,
        }}
        onUpdateAllocationStatus={{
          handler: handleUpdateAllocationStatus,
          loadingId: statusUpdatingId,
        }}
        onDeactivateAllocation={{
          handler: handleDeactivateAllocation,
          loadingId: deactivatingId,
        }}
      />
    </Box>
  );
}