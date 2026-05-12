/*! =========================================================
* Horizon UI - v1.1.0
========================================================= */

import React from "react";
import { Box, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import ColumnsTable from "views/admin/departments/components/ColumnsTable";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "api/departmentsApi";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function mapDepartmentToRow(item, index) {
  return {
    stt: index + 1,
    id: item.id,
    code: item.code || "",
    name: item.name || "",
    description: item.description || "",
    is_active: item.is_active ?? true,
    created_at: formatDateTime(item.created_at),
    updated_at: formatDateTime(item.updated_at),
  };
}

export default function Departments() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tableData, setTableData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const canManageDepartments =
    currentUserRole === "admin" || currentUserRole === "manager";
  const canDeleteDepartmentByRole = currentUserRole === "admin";

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

  const fetchDepartments = React.useCallback(async () => {
    const departments = await listDepartments({ limit: 200 });
    setTableData(
      [...departments]
        .sort((a, b) => a.id - b.id)
        .map((item, index) => mapDepartmentToRow(item, index))
    );
  }, []);

  const fetchCurrentProfile = React.useCallback(async () => {
    const profile = await getCurrentUser();
    setCurrentUserRole(profile?.role || "");
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchDepartments(), fetchCurrentProfile()]);
    } catch (error) {
      console.error("Load departments page failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được dữ liệu phòng ban",
        description: error.message || "Có lỗi xảy ra khi tải trang departments.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentProfile, fetchDepartments, handleUnauthorized, toast]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const validateDepartmentPayload = (department, isCreateMode = false) => {
    const payload = {
      code: (department.code || "").trim(),
      name: (department.name || "").trim(),
      description: (department.description || "").trim() || null,
    };

    if (!isCreateMode) {
      payload.is_active = department.is_active ?? true;
    }

    if (!payload.code || !payload.name) {
      toast({
        title: "Thiếu code, name",
        description: "Code, name là bắt buộc",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    return payload;
  };

  const handleSaveDepartment = async (department) => {
    if (!canManageDepartments) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được cập nhật phòng ban.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!department?.id) {
      toast({
        title: "Thiếu id phòng ban",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setSavingId(department.id);

      const payload = validateDepartmentPayload(department, false);
      await updateDepartment(department.id, payload);
      await fetchDepartments();

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin phòng ban đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update department failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật phòng ban.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateDepartment = async (department) => {
    if (!canManageDepartments) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin hoặc manager mới được tạo phòng ban.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setCreating(true);

      const payload = validateDepartmentPayload(department, true);
      await createDepartment(payload);
      await fetchDepartments();

      toast({
        title: "Tạo thành công",
        description: "Phòng ban mới đã được tạo.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Create department failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Tạo thất bại",
        description: error.message || "Không thể tạo phòng ban.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDepartment = async (department) => {
    if (!canDeleteDepartmentByRole) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được xóa phòng ban.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!department?.id) {
      toast({
        title: "Thiếu id phòng ban",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setDeletingId(department.id);

      await deleteDepartment(department.id);
      await fetchDepartments();

      toast({
        title: "Xóa thành công",
        description: "Phòng ban đã được xóa.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Delete department failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Xóa thất bại",
        description: error.message || "Không thể xóa phòng ban.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <ColumnsTable
        tableData={tableData}
        title="Quản lý phòng ban"
        addLabel="Thêm phòng ban"
        onSaveDepartment={{
          handler: handleSaveDepartment,
          loadingId: savingId,
        }}
        onCreateDepartment={{
          handler: handleCreateDepartment,
          loading: creating,
        }}
        onDeleteDepartment={{
          handler: handleDeleteDepartment,
          loadingId: deletingId,
        }}
        canManageDepartments={canManageDepartments}
        canDeleteDepartmentByRole={canDeleteDepartmentByRole}
        loading={loading}
      />
    </Box>
  );
}