/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _|
 | |_| | | | | |_) || |  / / | | |  \| | | | | || |
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|
*/

import React from "react";
import { Box, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import ColumnsTable from "views/admin/maintenances/components/ColumnsTable";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import {
  createMaintenance,
  deactivateMaintenance,
  listMaintenances,
  updateMaintenance,
  updateMaintenanceStatus,
} from "api/maintenancesApi";
import { listAssets } from "api/assetsApi";
import { listUsers } from "api/usersApi";

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

function normalizeNullableNumber(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapMaintenanceToRow(item, index) {
  return {
    stt: index + 1,
    id: item.id,
    maintenance_code: item.maintenance_code || "",
    asset_id: item.asset_id ?? null,
    maintenance_type: item.maintenance_type || "corrective",
    status: item.status || "scheduled",
    priority: item.priority || "medium",
    title: item.title || "",
    description: item.description || "",
    scheduled_date: formatDate(item.scheduled_date),
    started_at: formatDateTime(item.started_at),
    completed_at: formatDateTime(item.completed_at),
    next_maintenance_date: formatDate(item.next_maintenance_date),
    cost:
      item.cost === null || item.cost === undefined ? "" : String(item.cost),
    vendor_name: item.vendor_name || "",
    resolution_note: item.resolution_note || "",
    reported_by_user_id: item.reported_by_user_id ?? null,
    assigned_to_user_id: item.assigned_to_user_id ?? null,
    reported_by_user: item.reported_by_user?.full_name || "-",
    assigned_to_user: item.assigned_to_user?.full_name || "-",
    is_active: item.is_active ?? true,
    created_at: formatDateTime(item.created_at),
    updated_at: formatDateTime(item.updated_at),
    asset: item.asset || null,
    asset_label: item.asset
      ? `${item.asset.asset_code} - ${item.asset.name}`
      : "-",
  };
}

export default function Maintenances() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tableData, setTableData] = React.useState([]);
  const [assetOptions, setAssetOptions] = React.useState([]);
  const [userOptions, setUserOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState(null);
  const [deactivatingId, setDeactivatingId] = React.useState(null);
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const isAdmin = currentUserRole === "admin";
  const isManager = currentUserRole === "manager";
  const isStaff = currentUserRole === "staff";

  const canCreateMaintenances = isAdmin || isManager || isStaff;
  const canEditMaintenances = isAdmin || isManager;
  const canUpdateMaintenanceStatus = isAdmin || isManager;
  const canDeactivateMaintenanceByRole = isAdmin;

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

  const fetchMaintenances = React.useCallback(async () => {
    const maintenances = await listMaintenances({ limit: 200 });

    setTableData(
      [...maintenances]
        .sort((a, b) => a.id - b.id)
        .map((item, index) => mapMaintenanceToRow(item, index))
    );
  }, []);

  const fetchSelectOptions = React.useCallback(async (role) => {
    const normalizedRole = String(role || "").trim().toLowerCase();
    const canLoadUsers =
      normalizedRole === "admin" || normalizedRole === "manager";

    const [assets, users] = await Promise.all([
      listAssets({ limit: 200, is_active: true }),
      canLoadUsers ? listUsers({ limit: 200 }) : Promise.resolve([]),
    ]);

    setAssetOptions(
      (Array.isArray(assets) ? assets : []).map((item) => ({
        value: String(item.id),
        label: `${item.asset_code} - ${item.name}`,
      }))
    );

    setUserOptions(
      (Array.isArray(users) ? users : []).map((item) => ({
        value: String(item.id),
        label: `${item.id} - ${item.full_name}`,
      }))
    );
  }, []);

  const fetchCurrentProfile = React.useCallback(async () => {
    const profile = await getCurrentUser();
    const role = String(profile?.role || "").trim().toLowerCase();
    setCurrentUserRole(role);
    return role;
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);

      const role = await fetchCurrentProfile();
      await Promise.all([
        fetchMaintenances(),
        fetchSelectOptions(role),
      ]);
    } catch (error) {
      console.error("Load maintenances page failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được dữ liệu maintenances",
        description:
          error.message || "Có lỗi xảy ra khi tải trang maintenances.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [
    fetchCurrentProfile,
    fetchMaintenances,
    fetchSelectOptions,
    handleUnauthorized,
    toast,
  ]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const buildCreatePayload = (maintenance) => {
    const maintenanceCode = String(maintenance.maintenance_code || "").trim();
    const title = String(maintenance.title || "").trim();
    const assetId = normalizeNullableId(maintenance.asset_id);

    if (!maintenanceCode || !title || !assetId) {
      throw new Error("Maintenance code, asset và title là bắt buộc.");
    }

    // Staff chỉ tạo yêu cầu bảo trì
    if (isStaff) {
      return {
        maintenance_code: maintenanceCode,
        asset_id: assetId,
        maintenance_type: String(
          maintenance.maintenance_type || "corrective"
        ).trim(),
        status: "scheduled",
        priority: String(maintenance.priority || "medium").trim(),
        title,
        description: normalizeNullableText(maintenance.description),
        scheduled_date: normalizeNullableText(maintenance.scheduled_date),
        next_maintenance_date: null,
        cost: null,
        vendor_name: normalizeNullableText(maintenance.vendor_name),
        resolution_note: null,
        assigned_to_user_id: null,
        is_active: true,
      };
    }

    return {
      maintenance_code: maintenanceCode,
      asset_id: assetId,
      maintenance_type: String(
        maintenance.maintenance_type || "corrective"
      ).trim(),
      status: String(maintenance.status || "scheduled").trim(),
      priority: String(maintenance.priority || "medium").trim(),
      title,
      description: normalizeNullableText(maintenance.description),
      scheduled_date: normalizeNullableText(maintenance.scheduled_date),
      next_maintenance_date: normalizeNullableText(
        maintenance.next_maintenance_date
      ),
      cost: normalizeNullableNumber(maintenance.cost),
      vendor_name: normalizeNullableText(maintenance.vendor_name),
      resolution_note: normalizeNullableText(maintenance.resolution_note),
      assigned_to_user_id: normalizeNullableId(maintenance.assigned_to_user_id),
      is_active: maintenance.is_active ?? true,
    };
  };

  const buildUpdatePayload = (maintenance) => {
    return {
      maintenance_code:
        String(maintenance.maintenance_code || "").trim() || null,
      maintenance_type: String(
        maintenance.maintenance_type || "corrective"
      ).trim(),
      priority: String(maintenance.priority || "medium").trim(),
      title: String(maintenance.title || "").trim() || null,
      description: normalizeNullableText(maintenance.description),
      scheduled_date: normalizeNullableText(maintenance.scheduled_date),
      next_maintenance_date: normalizeNullableText(
        maintenance.next_maintenance_date
      ),
      cost: normalizeNullableNumber(maintenance.cost),
      vendor_name: normalizeNullableText(maintenance.vendor_name),
      resolution_note: normalizeNullableText(maintenance.resolution_note),
      assigned_to_user_id: normalizeNullableId(maintenance.assigned_to_user_id),
      is_active: maintenance.is_active ?? true,
    };
  };

  const handleCreateMaintenance = async (maintenance) => {
    if (!canCreateMaintenances) {
      toast({
        title: "Không có quyền",
        description: "Tài khoản của bạn không được tạo maintenance.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setCreating(true);

      const payload = buildCreatePayload(maintenance);
      await createMaintenance(payload);
      await fetchMaintenances();

      toast({
        title: isStaff ? "Tạo yêu cầu thành công" : "Tạo thành công",
        description: isStaff
          ? "Yêu cầu bảo trì đã được tạo."
          : "Maintenance mới đã được tạo.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Create maintenance failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Tạo thất bại",
        description: error.message || "Không thể tạo maintenance.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      
    } finally {
      setCreating(false);
    }
  };

  const handleSaveMaintenance = async (maintenance) => {
    if (!canEditMaintenances) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được cập nhật maintenance.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!maintenance?.id) {
      toast({
        title: "Thiếu id bảo trì",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setSavingId(maintenance.id);

      const payload = buildUpdatePayload(maintenance);
      await updateMaintenance(maintenance.id, payload);
      await fetchMaintenances();

      toast({
        title: "Cập nhật thành công",
        description: "Maintenance đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update maintenance failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        
      }

      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật maintenance.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateMaintenanceStatus = async ({
    id,
    status,
    resolution_note,
    cost,
    next_maintenance_date,
  }) => {
    if (!canUpdateMaintenanceStatus) {
      toast({
        title: "Không có quyền",
        description:
          "Chỉ admin hoặc manager mới được cập nhật trạng thái maintenance.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!id) {
      toast({
        title: "Thiếu id bảo trì",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    const normalizedStatus = String(status || "").trim();
    if (!normalizedStatus) {
      toast({
        title: "Status là bắt buộc",
        description: "Cần bổ sung thông tin status",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setStatusUpdatingId(id);

      await updateMaintenanceStatus(id, {
        status: normalizedStatus,
        resolution_note: normalizeNullableText(resolution_note),
        cost: normalizeNullableNumber(cost),
        next_maintenance_date: normalizeNullableText(next_maintenance_date),
      });

      await fetchMaintenances();

      toast({
        title: "Cập nhật trạng thái thành công",
        description: "Trạng thái maintenance đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update maintenance status failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        
      }

      toast({
        title: "Cập nhật trạng thái thất bại",
        description:
          error.message || "Không thể cập nhật trạng thái maintenance.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeactivateMaintenance = async (maintenance) => {
    if (!canDeactivateMaintenanceByRole) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được vô hiệu hóa maintenance.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!maintenance?.id) {
      toast({
        title: "Thiếu id bảo trì",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!maintenance.is_active) {
      toast({
        title: "Không hợp lệ",
        description: "Maintenance này đã ở trạng thái inactive.",
        status: "info",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    try {
      setDeactivatingId(maintenance.id);
      await deactivateMaintenance(maintenance.id);
      await fetchMaintenances();

      toast({
        title: "Đã vô hiệu hóa",
        description: "Maintenance đã được chuyển sang inactive.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Deactivate maintenance failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        
      }

      toast({
        title: "Thao tác thất bại",
        description: error.message || "Không thể vô hiệu hóa maintenance.",
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
        title="Quản lý bảo trì"
        assetOptions={assetOptions}
        userOptions={userOptions}
        canCreateMaintenances={canCreateMaintenances}
        canEditMaintenances={canEditMaintenances}
        canUpdateMaintenanceStatus={canUpdateMaintenanceStatus}
        canDeactivateMaintenanceByRole={canDeactivateMaintenanceByRole}
        currentUserRole={currentUserRole}
        loading={loading}
        onSaveMaintenance={{
          handler: handleSaveMaintenance,
          loadingId: savingId,
        }}
        onCreateMaintenance={{
          handler: handleCreateMaintenance,
          loading: creating,
        }}
        onUpdateMaintenanceStatus={{
          handler: handleUpdateMaintenanceStatus,
          loadingId: statusUpdatingId,
        }}
        onDeactivateMaintenance={{
          handler: handleDeactivateMaintenance,
          loadingId: deactivatingId,
        }}
      />
    </Box>
  );
}