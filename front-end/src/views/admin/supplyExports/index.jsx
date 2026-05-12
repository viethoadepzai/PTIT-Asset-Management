import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, HStack, Spinner, Text, useToast } from "@chakra-ui/react";
import { AddIcon, RepeatIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import { logout } from "api/authApi";
import { getCurrentUser } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import { listSupplies } from "api/suppliesApi";
import { listDepartments } from "api/departmentsApi";
import { listUsers } from "api/usersApi";
import {
  listSupplyExports,
  createSupplyExport,
  approveSupplyExport,
  cancelSupplyExport,
  openSupplyExportPdf,
} from "api/supplyExportsApi";

import ColumnsTable from "./components/ColumnsTable";
import SupplyExportModal from "./components/SupplyExportModal";

const createEmptyExportItem = () => ({
  supply_id: "",
  quantity: 1,
  note: "",
});

const buildCreateForm = () => ({
  recipient_department_id: "",
  reason: "",
  note: "",
  items: [createEmptyExportItem()],
});

export default function SupplyExportsPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState("");

  const [rawVouchers, setRawVouchers] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentDepartmentId, setCurrentDepartmentId] = useState(null);

  const [modalMode, setModalMode] = useState(null); // create | cancel
  const [activeVoucher, setActiveVoucher] = useState(null);

  const [createForm, setCreateForm] = useState(buildCreateForm());
  const [cancelNote, setCancelNote] = useState("");

  const handleUnauthorized = useCallback(() => {
    logout();
    navigate("/auth/sign-in", { replace: true });
  }, [navigate]);

  const handleApiError = useCallback(
    (error, title = "Thao tác thất bại") => {
      console.error(error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title,
        description: error?.message || "Có lỗi xảy ra.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    },
    [toast, handleUnauthorized]
  );

  const loadPageData = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await getCurrentUser();
      const role = String(profile?.role || "").toLowerCase();
      setCurrentUserRole(role);
      setCurrentDepartmentId(profile?.department_id ?? null);
      const usersPromise =
        role === "staff" ? Promise.resolve(profile ? [profile] : []) : listUsers({ is_active: true });

      const [voucherData, supplyData, departmentData, userData] = await Promise.all([
        listSupplyExports(),
        listSupplies({ is_active: true }),
        listDepartments({ is_active: true }),
        usersPromise,
      ]);

      setRawVouchers(Array.isArray(voucherData) ? voucherData : []);
      setSupplies(Array.isArray(supplyData) ? supplyData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      handleApiError(error, "Không tải được dữ liệu phiếu xuất");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const departmentNameById = useMemo(() => {
    const map = new Map();
    departments.forEach((item) => {
      map.set(item.id, item.name || `#${item.id}`);
    });
    return map;
  }, [departments]);

  const userNameById = useMemo(() => {
    const map = new Map();
    users.forEach((item) => {
      map.set(item.id, item.full_name || item.username || `#${item.id}`);
    });
    return map;
  }, [users]);

  const availableSupplies = useMemo(() => {
    return supplies.filter((item) => item?.is_active !== false);
  }, [supplies]);

  const tableData = useMemo(() => {
    return rawVouchers.map((voucher, index) => {
      const itemsSummary = Array.isArray(voucher.items)
        ? voucher.items
            .map((item) => {
              const supplyName =
                item?.supply_name_snapshot ||
                item?.supply_name ||
                item?.supply_code_snapshot ||
                `#${item?.supply_id ?? ""}`;
              const quantity = item?.quantity ?? "";
              const unit = item?.unit_snapshot || item?.unit || "";
              return `${supplyName}${quantity ? ` (${quantity}${unit ? ` ${unit}` : ""})` : ""}`;
            })
            .join(", ")
        : "";

      return {
        ...voucher,
        stt: index + 1,
        recipient_department_name: voucher.recipient_department_id
          ? departmentNameById.get(voucher.recipient_department_id) ||
            `#${voucher.recipient_department_id}`
          : "-",
        approved_by_name: voucher.approved_by_user_id
          ? userNameById.get(voucher.approved_by_user_id) ||
            `#${voucher.approved_by_user_id}`
          : "-",
        items_summary: itemsSummary,
      };
    });
  }, [rawVouchers, departmentNameById, userNameById]);

  const resetCreateForm = () => setCreateForm(buildCreateForm());
  const resetCancelForm = () => setCancelNote("");

  const handleCloseModal = () => {
    if (creating) return;
    if (actionLoadingKey) return;

    setModalMode(null);
    setActiveVoucher(null);
    resetCreateForm();
    resetCancelForm();
  };

  const handleOpenCreateModal = () => {
    const defaultForm = buildCreateForm();
    if (currentUserRole === "staff" && currentDepartmentId) {
      defaultForm.recipient_department_id = String(currentDepartmentId);
    }
    setCreateForm(defaultForm);
    setActiveVoucher(null);
    setModalMode("create");
  };

  const handleOpenCancelModal = (voucher) => {
    setActiveVoucher(voucher);
    setCancelNote("");
    setModalMode("cancel");
  };

  const handleApproveVoucher = async (voucher) => {
    try {
      setActionLoadingKey(`approve-${voucher.id}`);
      await approveSupplyExport(voucher.id);

      toast({
        title: "Duyệt phiếu xuất thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      await loadPageData();
    } catch (error) {
      handleApiError(error, "Duyệt phiếu xuất thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleOpenPdf = async (voucher) => {
    try {
      setActionLoadingKey(`pdf-${voucher.id}`);
      await openSupplyExportPdf(voucher.id);
    } catch (error) {
      handleApiError(error, "Không mở được PDF");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitCreate = async () => {
    const selectedItems = createForm.items.filter(
      (item) => item.supply_id && Number(item.quantity) > 0
    );

    if (!createForm.recipient_department_id) {
      toast({
        title: "Thiếu phòng ban nhận",
        description: "Bạn cần chọn phòng ban nhận vật tư.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    if (!selectedItems.length) {
      toast({
        title: "Chưa có vật tư hợp lệ",
        description: "Phải có ít nhất một vật tư với số lượng lớn hơn 0.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const supplyIds = selectedItems.map((item) => Number(item.supply_id));
    const uniqueSupplyIds = new Set(supplyIds);

    if (uniqueSupplyIds.size !== supplyIds.length) {
      toast({
        title: "Vật tư bị trùng",
        description: "Một vật tư không nên xuất hiện nhiều lần trong cùng phiếu.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const payload = {
      recipient_department_id: Number(createForm.recipient_department_id),
      reason: createForm.reason?.trim() || null,
      note: createForm.note?.trim() || null,
      items: selectedItems.map((item) => ({
        supply_id: Number(item.supply_id),
        quantity: Number(item.quantity),
        note: item.note?.trim() || null,
      })),
    };

    try {
      setCreating(true);
      await createSupplyExport(payload);

      toast({
        title: "Tạo phiếu xuất thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Tạo phiếu xuất thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitCancel = async () => {
    if (!activeVoucher) return;

    try {
      setActionLoadingKey(`cancel-${activeVoucher.id}`);
      await cancelSupplyExport(activeVoucher.id, {
        note: cancelNote?.trim() || null,
      });

      toast({
        title: "Hủy phiếu xuất thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Hủy phiếu xuất thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitModal = async () => {
    if (modalMode === "create") {
      await handleSubmitCreate();
      return;
    }

    if (modalMode === "cancel") {
      await handleSubmitCancel();
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Flex
        mb="20px"
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        gap="12px"
        direction={{ base: "column", md: "row" }}
      >
        <Box>
          <Text fontSize="2xl" fontWeight="bold">
            Quản lý phiếu xuất vật tư
          </Text>
          <Text fontSize="sm" color="gray.500">
            Tạo phiếu xuất, duyệt phiếu, hủy phiếu và mở PDF.
          </Text>
        </Box>

        <HStack spacing="12px">
          <Button
            leftIcon={<RepeatIcon />}
            variant="outline"
            onClick={loadPageData}
            isLoading={loading}
          >
            Làm mới
          </Button>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleOpenCreateModal}>
            Tạo phiếu xuất
          </Button>
        </HStack>
      </Flex>

      <Box bg="white" borderRadius="16px" p="20px" shadow="sm">
        {loading ? (
          <Flex align="center" justify="center" minH="240px" direction="column" gap="12px">
            <Spinner size="lg" />
            <Text>Đang tải dữ liệu...</Text>
          </Flex>
        ) : (
          <ColumnsTable
            tableData={tableData}
            actionLoadingKey={actionLoadingKey}
            onApprove={handleApproveVoucher}
            onOpenCancel={handleOpenCancelModal}
            onOpenPdf={handleOpenPdf}
            canApprove={currentUserRole === "admin" || currentUserRole === "manager"}
            canCancel={currentUserRole === "admin" || currentUserRole === "manager"}
          />
        )}
      </Box>

      <SupplyExportModal
        isOpen={Boolean(modalMode)}
        onClose={handleCloseModal}
        mode={modalMode}
        activeVoucher={activeVoucher}
        createForm={createForm}
        setCreateForm={setCreateForm}
        cancelNote={cancelNote}
        setCancelNote={setCancelNote}
        departments={departments}
        availableSupplies={availableSupplies}
        currentUserRole={currentUserRole}
        loading={creating || Boolean(actionLoadingKey)}
        onSubmit={handleSubmitModal}
      />
    </Box>
  );
}