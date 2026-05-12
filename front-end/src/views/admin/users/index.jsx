/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || | 
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|
*/

/*!
=========================================================
* Horizon UI - v1.1.0
=========================================================
*/

import React from "react";
import { Box, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import ColumnsTable from "views/admin/users/components/ColumnsTable";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import {
  activateUser,
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
} from "api/usersApi";
import { listDepartments } from "api/departmentsApi";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function normalizeManageableRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "manager" || normalized === "staff") {
    return normalized;
  }
  return null;
}

function mapUserToRow(item, index) {
  return {
    stt: index + 1,
    id: item.id,
    username: item.username || "",
    email: item.email || "",
    full_name: item.full_name || "",
    phone_number: item.phone_number || "",
    role: item.role || "",
    is_active: item.role === "admin" ? true : (item.is_active ?? true),
    department_id: item.department_id ?? null,
    department: item.department?.name || "-",
    created_at: formatDateTime(item.created_at),
    updated_at: formatDateTime(item.updated_at),
  };
}

export default function Users() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tableData, setTableData] = React.useState([]);
  const [departmentOptions, setDepartmentOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState(null);
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const canManageUsers = currentUserRole === "admin";

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

  const fetchUsers = React.useCallback(async () => {
    const users = await listUsers({ limit: 200 });

    setTableData(
      [...users]
        .sort((a, b) => a.id - b.id)
        .map((item, index) => mapUserToRow(item, index))
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

  const fetchCurrentProfile = React.useCallback(async () => {
    const profile = await getCurrentUser();
    setCurrentUserRole(profile?.role || "");
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchDepartments(),
        fetchCurrentProfile(),
      ]);
    } catch (error) {
      console.error("Load users page failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được dữ liệu người dùng",
        description: error.message || "Có lỗi xảy ra khi tải trang users.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentProfile, fetchDepartments, fetchUsers, handleUnauthorized, toast]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleSaveUser = async (user) => {
    if (!canManageUsers) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được cập nhật người dùng.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!user?.id) {
      toast({
        title: "Thiếu id người dùng",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    const payload = {
      username: (user.username || "").trim(),
      email: (user.email || "").trim(),
      full_name: (user.full_name || "").trim(),
      phone_number: (user.phone_number || "").trim() || null,
      department_id: user.department_id ?? null,
    };

    if (user.role !== "admin") {
      const manageableRole = normalizeManageableRole(user.role);
      if (manageableRole) {
        payload.role = manageableRole;
      }
      payload.is_active = user.is_active ?? true;
    }

    if (!payload.username || !payload.email || !payload.full_name) {
      toast({
        title: "Thiếu thông tin",
        description: "Username, email và full name là bắt buộc.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setSavingId(user.id);
      await updateUser(user.id, payload);
      await fetchUsers();

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin người dùng đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update user failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật người dùng.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActiveUser = async (user) => {
    if (!canManageUsers) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được kích hoạt hoặc vô hiệu hóa người dùng.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (!user?.id) {
      toast({
        title: "Thiếu id người dùng",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    if (user.role === "admin") {
      toast({
        title: "Không hợp lệ",
        description: "Không thể vô hiệu hóa tài khoản admin.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setTogglingId(user.id);

      if (user.is_active) {
        await deactivateUser(user.id);
      } else {
        await activateUser(user.id);
      }

      await fetchUsers();

      toast({
        title: user.is_active ? "Đã vô hiệu hóa" : "Đã kích hoạt",
        description: user.is_active
          ? "Người dùng đã được vô hiệu hóa."
          : "Người dùng đã được kích hoạt lại.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Toggle user status failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Thao tác thất bại",
        description: error.message || "Không thể thay đổi trạng thái người dùng.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateUser = async (user) => {
    if (!canManageUsers) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được tạo người dùng.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    const manageableRole = normalizeManageableRole(user.role);

    if (!manageableRole) {
      toast({
        title: "Role không hợp lệ",
        description: 'Backend chỉ cho phép tạo user với role "manager" hoặc "staff".',
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }

    const payload = {
      username: (user.username || "").trim(),
      email: (user.email || "").trim(),
      full_name: (user.full_name || "").trim(),
      phone_number: (user.phone_number || "").trim() || null,
      role: manageableRole,
      department_id: user.department_id ?? null,
      is_active: user.is_active ?? true,
      password: user.password || "",
      confirm_password: user.confirm_password || "",
    };

    if (
      !payload.username ||
      !payload.email ||
      !payload.full_name ||
      !payload.password ||
      !payload.confirm_password
    ) {
      toast({
        title: "Thiếu thông tin",
        description:
          "Username, email, full name, password và confirm password là bắt buộc.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    try {
      setCreating(true);
      await createUser(payload);
      await fetchUsers();

      toast({
        title: "Tạo thành công",
        description: "Người dùng mới đã được tạo.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Create user failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
      }

      toast({
        title: "Tạo thất bại",
        description: error.message || "Không thể tạo người dùng.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <ColumnsTable
        tableData={tableData}
        title="Quản lý người dùng"
        departmentOptions={departmentOptions}
        canManageUsers={canManageUsers}
        currentUserRole={currentUserRole}
        loading={loading}
        onSaveUser={{
          handler: handleSaveUser,
          loadingId: savingId,
        }}
        onToggleActiveUser={{
          handler: handleToggleActiveUser,
          loadingId: togglingId,
        }}
        onCreateUser={{
          handler: handleCreateUser,
          loading: creating,
        }}
      />
    </Box>
  );
}