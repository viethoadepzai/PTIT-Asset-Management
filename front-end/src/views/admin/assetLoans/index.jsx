import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, RepeatIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import { listAssets } from "api/assetsApi";
import { listUsers } from "api/usersApi";
import { listDepartments } from "api/departmentsApi";
import {
  listAssetLoans,
  createAssetLoan,
  approveAssetLoan,
  receiveAssetLoan,
  returnAssetLoan,
  cancelAssetLoan,
  openAssetLoanPdf,
} from "api/assetLoansApi";

import ColumnsTable from "./components/ColumnsTable";
import AssetLoanModal from "./components/AssetLoanModal";

const todayIso = () => new Date().toISOString().slice(0, 10);

const createEmptyLoanItem = () => ({
  asset_id: "",
  note: "",
});

const buildCreateForm = () => ({
  borrower_department_id: "",
  borrower_user_id: "",
  loan_date: todayIso(),
  expected_return_date: "",
  purpose: "",
  note: "",
  items: [createEmptyLoanItem()],
});

const buildReceiveForm = () => ({
  note: "",
});

const buildReturnForm = () => ({
  actual_return_date: todayIso(),
  note: "",
  items: [],
});

export default function AssetLoansPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState("");

  const [rawLoans, setRawLoans] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentDepartmentId, setCurrentDepartmentId] = useState(null);

  const [modalMode, setModalMode] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);

  const [createForm, setCreateForm] = useState(buildCreateForm());
  const [receiveForm, setReceiveForm] = useState(buildReceiveForm());
  const [returnForm, setReturnForm] = useState(buildReturnForm());
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
      setCurrentUserId(profile?.id ?? null);
      setCurrentDepartmentId(profile?.department_id ?? null);

      const usersPromise =
        role === "staff"
          ? Promise.resolve(profile ? [profile] : [])
          : listUsers({ is_active: true });

      const [loanData, assetData, userData, departmentData] = await Promise.all([
        listAssetLoans(),
        listAssets({ is_active: true }),
        usersPromise,
        listDepartments({ is_active: true }),
      ]);

      setRawLoans(Array.isArray(loanData) ? loanData : []);
      setAssets(Array.isArray(assetData) ? assetData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
    } catch (error) {
      handleApiError(error, "Không tải được dữ liệu phiếu mượn");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const userNameById = useMemo(() => {
    const map = new Map();
    users.forEach((item) => {
      map.set(item.id, item.full_name || item.username || `#${item.id}`);
    });
    return map;
  }, [users]);

  const departmentNameById = useMemo(() => {
    const map = new Map();
    departments.forEach((item) => {
      map.set(item.id, item.name || `#${item.id}`);
    });
    return map;
  }, [departments]);

  const availableAssets = useMemo(() => {
    return assets.filter((item) => {
      const isActive = item?.is_active !== false;
      const status = String(item?.status || "").toLowerCase();
      return isActive && (!status || status === "available");
    });
  }, [assets]);

  const tableData = useMemo(() => {
    return rawLoans.map((loan, index) => ({
      ...loan,
      stt: index + 1,
      borrower_department_name: loan.borrower_department_id
        ? departmentNameById.get(loan.borrower_department_id) ||
          `#${loan.borrower_department_id}`
        : "-",
      borrower_user_name: loan.borrower_user_id
        ? userNameById.get(loan.borrower_user_id) || `#${loan.borrower_user_id}`
        : "-",
      approved_by_name: loan.approved_by_user_id
        ? userNameById.get(loan.approved_by_user_id) || `#${loan.approved_by_user_id}`
        : "-",
      items_summary: Array.isArray(loan.items)
        ? loan.items
            .map(
              (item) =>
                `${item.asset_code_snapshot || ""} - ${item.asset_name_snapshot || ""}`.trim()
            )
            .join(", ")
        : "",
    }));
  }, [rawLoans, departmentNameById, userNameById]);

  const resetCreateForm = () => setCreateForm(buildCreateForm());
  const resetReceiveForm = () => setReceiveForm(buildReceiveForm());
  const resetReturnForm = () => setReturnForm(buildReturnForm());
  const resetCancelForm = () => setCancelNote("");

  const handleCloseModal = () => {
    if (creating) return;
    if (actionLoadingKey) return;

    setModalMode(null);
    setActiveLoan(null);
    resetCreateForm();
    resetReceiveForm();
    resetReturnForm();
    resetCancelForm();
  };

  const handleOpenCreateModal = () => {
    const defaultForm = buildCreateForm();

    if (currentUserRole === "staff") {
      defaultForm.borrower_user_id = currentUserId ? String(currentUserId) : "";
      defaultForm.borrower_department_id = currentDepartmentId
        ? String(currentDepartmentId)
        : "";
    }

    setCreateForm(defaultForm);
    setActiveLoan(null);
    setModalMode("create");
  };

  const handleOpenReceiveModal = (loan) => {
    setActiveLoan(loan);
    setReceiveForm(buildReceiveForm());
    setModalMode("receive");
  };

  const handleOpenReturnModal = (loan) => {
    setActiveLoan(loan);
    setReturnForm({
      actual_return_date: todayIso(),
      note: "",
      items: (loan.items || []).map((item) => ({
        item_id: item.id,
        asset_label: `${item.asset_code_snapshot || ""} - ${item.asset_name_snapshot || ""}`.trim(),
        condition_after_return: item.condition_before_snapshot || "",
        note: item.note || "",
      })),
    });
    setModalMode("return");
  };

  const handleOpenCancelModal = (loan) => {
    setActiveLoan(loan);
    setCancelNote("");
    setModalMode("cancel");
  };

  const handleApproveLoan = async (loan) => {
    try {
      setActionLoadingKey(`approve-${loan.id}`);
      await approveAssetLoan(loan.id);

      toast({
        title: "Duyệt phiếu mượn thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      await loadPageData();
    } catch (error) {
      handleApiError(error, "Duyệt phiếu mượn thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleReceiveLoan = async () => {
    if (!activeLoan) return;

    try {
      setActionLoadingKey(`receive-${activeLoan.id}`);
      await receiveAssetLoan(activeLoan.id, {
        note: receiveForm.note?.trim() || null,
      });

      toast({
        title: "Xác nhận đã nhận thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Xác nhận đã nhận thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleOpenPdf = async (loan) => {
    try {
      setActionLoadingKey(`pdf-${loan.id}`);
      await openAssetLoanPdf(loan.id);
    } catch (error) {
      handleApiError(error, "Không mở được PDF");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitCreate = async () => {
    const selectedItems = createForm.items.filter((item) => item.asset_id);

    if (!createForm.loan_date) {
      toast({
        title: "Thiếu ngày mượn",
        description: "Bạn cần chọn ngày mượn.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    if (!selectedItems.length) {
      toast({
        title: "Chưa chọn tài sản",
        description: "Phải có ít nhất một tài sản trong phiếu mượn.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const assetIds = selectedItems.map((item) => Number(item.asset_id));
    const uniqueAssetIds = new Set(assetIds);
    if (uniqueAssetIds.size !== assetIds.length) {
      toast({
        title: "Tài sản bị trùng",
        description: "Một tài sản không nên xuất hiện nhiều lần trong cùng phiếu mượn.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const payload = {
      borrower_department_id: createForm.borrower_department_id
        ? Number(createForm.borrower_department_id)
        : null,
      borrower_user_id: createForm.borrower_user_id
        ? Number(createForm.borrower_user_id)
        : null,
      loan_date: createForm.loan_date,
      expected_return_date: createForm.expected_return_date || null,
      purpose: createForm.purpose?.trim() || null,
      note: createForm.note?.trim() || null,
      items: selectedItems.map((item) => ({
        asset_id: Number(item.asset_id),
        note: item.note?.trim() || null,
      })),
    };

    try {
      setCreating(true);
      await createAssetLoan(payload);

      toast({
        title: "Tạo phiếu mượn thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Tạo phiếu mượn thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!activeLoan) return;

    if (!returnForm.actual_return_date) {
      toast({
        title: "Thiếu ngày trả",
        description: "Bạn cần chọn ngày trả thực tế.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const hasEmptyCondition = returnForm.items.some(
      (item) => !item.condition_after_return?.trim()
    );

    if (hasEmptyCondition) {
      toast({
        title: "Thiếu tình trạng sau khi trả",
        description: "Mỗi tài sản cần có tình trạng sau khi trả.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const payload = {
      actual_return_date: returnForm.actual_return_date,
      note: returnForm.note?.trim() || null,
      items: returnForm.items.map((item) => ({
        item_id: item.item_id,
        condition_after_return: item.condition_after_return.trim(),
        note: item.note?.trim() || null,
      })),
    };

    try {
      setActionLoadingKey(`return-${activeLoan.id}`);
      await returnAssetLoan(activeLoan.id, payload);

      toast({
        title: "Trả tài sản thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Trả tài sản thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitCancel = async () => {
    if (!activeLoan) return;

    try {
      setActionLoadingKey(`cancel-${activeLoan.id}`);
      await cancelAssetLoan(activeLoan.id, {
        note: cancelNote?.trim() || null,
      });

      toast({
        title: "Hủy phiếu mượn thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Hủy phiếu mượn thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitModal = async () => {
    if (modalMode === "create") return handleSubmitCreate();
    if (modalMode === "receive") return handleReceiveLoan();
    if (modalMode === "return") return handleSubmitReturn();
    if (modalMode === "cancel") return handleSubmitCancel();
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
            Quản lý phiếu mượn tài sản
          </Text>
          <Text fontSize="sm" color="gray.500">
            Tạo phiếu mượn, duyệt phiếu, xác nhận đã nhận, trả tài sản, hủy phiếu và mở PDF.
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
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={handleOpenCreateModal}
          >
            Tạo phiếu mượn
          </Button>
        </HStack>
      </Flex>

      <Box bg="white" borderRadius="16px" p="20px" shadow="sm">
        {loading ? (
          <Flex
            align="center"
            justify="center"
            minH="240px"
            direction="column"
            gap="12px"
          >
            <Spinner size="lg" />
            <Text>Đang tải dữ liệu...</Text>
          </Flex>
        ) : (
          <ColumnsTable
            tableData={tableData}
            actionLoadingKey={actionLoadingKey}
            onApprove={handleApproveLoan}
            onOpenReceive={handleOpenReceiveModal}
            onOpenReturn={handleOpenReturnModal}
            onOpenCancel={handleOpenCancelModal}
            onOpenPdf={handleOpenPdf}
            canApprove={currentUserRole === "admin" || currentUserRole === "manager"}
            canReceive={
              currentUserRole === "admin" ||
              currentUserRole === "manager" ||
              currentUserRole === "staff"
            }
            canReturn={
              currentUserRole === "admin" ||
              currentUserRole === "manager" ||
              currentUserRole === "staff"
            }
            canCancel={currentUserRole === "admin" || currentUserRole === "manager"}
          />
        )}
      </Box>

      <AssetLoanModal
        isOpen={Boolean(modalMode)}
        onClose={handleCloseModal}
        mode={modalMode}
        activeLoan={activeLoan}
        createForm={createForm}
        setCreateForm={setCreateForm}
        receiveForm={receiveForm}
        setReceiveForm={setReceiveForm}
        returnForm={returnForm}
        setReturnForm={setReturnForm}
        cancelNote={cancelNote}
        setCancelNote={setCancelNote}
        departments={departments}
        users={users}
        availableAssets={availableAssets}
        loading={creating || Boolean(actionLoadingKey)}
        onSubmit={handleSubmitModal}
      />
    </Box>
  );
}