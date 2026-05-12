import React from "react";
import { Box, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import ColumnsTable from "views/admin/categories/components/ColumnsTable";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  getCategoryById,
} from "api/categoriesApi";
import { listDepartments } from "api/departmentsApi";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function mapCategoryToRow(item, index) {
  return {
    stt: index + 1,
    id: item.id,
    category_code: item.category_code || "",
    category_name: item.category_name || "",
    category_type: item.category_type || "supply",
    description: item.description || "",
    note: item.note || "",
    is_active: item.is_active ?? true,
    created_at: formatDateTime(item.created_at),
    updated_at: formatDateTime(item.updated_at),
  };
}

function validateCategoryPayload(category, isCreateMode = false) {
  const code = (category.category_code || "").trim();
  const name = (category.category_name || "").trim();
  const type = category.category_type;

  if (!code || !name) {
    return { valid: false, message: "Mã danh mục và tên danh mục là bắt buộc." };
  }

  if (!["supply", "asset"].includes(type)) {
    return { valid: false, message: "Loại danh mục phải là 'supply' hoặc 'asset'." };
  }

  return {
    valid: true,
    payload: {
      category_code: code,
      category_name: name,
      category_type: type,
      description: (category.description || "").trim() || null,
      note: (category.note || "").trim() || null,
    },
  };
}

export default function Categories() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tableData, setTableData] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const canManageCategories = currentUserRole === "admin";
  const canDeleteCategoryByRole = currentUserRole === "admin";

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

  const fetchCategories = React.useCallback(async () => {
    const categories = await listCategories({ limit: 200 });
    setTableData(
      [...categories]
        .sort((a, b) => a.id - b.id)
        .map((item, index) => mapCategoryToRow(item, index))
    );
  }, []);

  const fetchDepartments = React.useCallback(async () => {
    const depts = await listDepartments({ limit: 200, is_active: true });
    setDepartments(Array.isArray(depts) ? depts : []);
  }, []);

  const fetchCurrentProfile = React.useCallback(async () => {
    const profile = await getCurrentUser();
    setCurrentUserRole(profile?.role || "");
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchDepartments(), fetchCurrentProfile()]);
    } catch (error) {
      console.error("Load categories page failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được dữ liệu danh mục",
        description: error.message || "Có lỗi xảy ra khi tải trang danh mục.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchDepartments, fetchCurrentProfile, handleUnauthorized, toast]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleSaveCategory = async (category) => {
    if (!canManageCategories) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được cập nhật danh mục.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    if (!category?.id) {
      toast({
        title: "Thiếu id danh mục",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const validation = validateCategoryPayload(category, false);
    if (!validation.valid) {
      toast({
        title: "Dữ liệu không hợp lệ",
        description: validation.message,
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    try {
      setSavingId(category.id);
      await updateCategory(category.id, validation.payload);
      await fetchCategories();

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin danh mục đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Update category failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật danh mục.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateCategory = async (category) => {
    if (!canManageCategories) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được tạo danh mục.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const validation = validateCategoryPayload(category, true);
    if (!validation.valid) {
      toast({
        title: "Dữ liệu không hợp lệ",
        description: validation.message,
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    try {
      setCreating(true);
      await createCategory(validation.payload);
      await fetchCategories();

      toast({
        title: "Tạo thành công",
        description: "Danh mục mới đã được tạo.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Create category failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Tạo thất bại",
        description: error.message || "Không thể tạo danh mục.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!canDeleteCategoryByRole) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới được xóa danh mục.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    if (!category?.id) {
      toast({
        title: "Thiếu id danh mục",
        description: "Cần bổ sung thông tin id",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    try {
      setDeletingId(category.id);
      await deleteCategory(category.id);
      await fetchCategories();

      toast({
        title: "Xóa thành công",
        description: "Danh mục đã được xóa.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Delete category failed:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Xóa thất bại",
        description: error.message || "Không thể xóa danh mục.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefreshCategory = React.useCallback(async (categoryId) => {
    return await getCategoryById(categoryId);
  }, []);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <ColumnsTable
        tableData={tableData}
        departments={departments}
        title="Quản lý danh mục"
        addLabel="Thêm danh mục"
        onSaveCategory={{
          handler: handleSaveCategory,
          loadingId: savingId,
        }}
        onCreateCategory={{
          handler: handleCreateCategory,
          loading: creating,
        }}
        onDeleteCategory={{
          handler: handleDeleteCategory,
          loadingId: deletingId,
        }}
        onRefreshCategory={handleRefreshCategory}
        canManageCategories={canManageCategories}
        canDeleteCategoryByRole={canDeleteCategoryByRole}
        loading={loading}
      />
    </Box>
  );
}
