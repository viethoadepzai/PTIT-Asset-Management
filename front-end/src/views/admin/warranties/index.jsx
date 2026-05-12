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

import { logout, getCurrentUser } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import { listAssets } from "api/assetsApi";
import { listUsers } from "api/usersApi";
import {
  listWarranties,
  createWarranty,
  sendWarranty,
  completeWarranty,
  cancelWarranty,
  openWarrantyPdf,
} from "api/warrantiesApi";

import ColumnsTable from "./components/ColumnsTable";
import WarrantyModal from "./components/WarrantyModal";

const todayIso = () => new Date().toISOString().slice(0, 10);

const buildCreateForm = () => ({
  asset_id: "",
  vendor_name: "",
  provider_contact: "",
  warranty_start_date: "",
  warranty_end_date: "",
  sent_date: "",
  expected_return_date: "",
  issue_description: "",
  note: "",
});

const buildSendForm = () => ({
  sent_date: todayIso(),
  expected_return_date: "",
  note: "",
});

const buildCompleteForm = () => ({
  received_back_date: todayIso(),
  resolution_note: "",
  maintenance_cost: "",
  note: "",
});

export default function WarrantiesPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState("");

  const [rawTickets, setRawTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("");

  const [modalMode, setModalMode] = useState(null); // create | send | complete | cancel
  const [activeTicket, setActiveTicket] = useState(null);

  const [createForm, setCreateForm] = useState(buildCreateForm());
  const [sendForm, setSendForm] = useState(buildSendForm());
  const [completeForm, setCompleteForm] = useState(buildCompleteForm());
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
      const role = String(profile?.role || "").trim().toLowerCase();
      setCurrentUserRole(role);

      const usersPromise =
        role === "staff"
          ? Promise.resolve(profile ? [profile] : [])
          : listUsers({ is_active: true });

      const [ticketData, assetData, userData] = await Promise.all([
        listWarranties(),
        listAssets({ is_active: true }),
        usersPromise,
      ]);

      setRawTickets(Array.isArray(ticketData) ? ticketData : []);
      setAssets(Array.isArray(assetData) ? assetData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      handleApiError(error, "Không tải được dữ liệu bảo hành");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const assetLabelById = useMemo(() => {
    const map = new Map();
    assets.forEach((asset) => {
      const label = `${asset.asset_code || asset.code || `#${asset.id}`} - ${
        asset.name || asset.asset_name || ""
      }`.trim();
      map.set(asset.id, label);
    });
    return map;
  }, [assets]);

  const userNameById = useMemo(() => {
    const map = new Map();
    users.forEach((user) => {
      map.set(user.id, user.full_name || user.username || `#${user.id}`);
    });
    return map;
  }, [users]);

  const availableAssets = useMemo(() => {
    return assets.filter((item) => item?.is_active !== false);
  }, [assets]);

  const tableData = useMemo(() => {
    return rawTickets.map((ticket, index) => ({
      ...ticket,
      stt: index + 1,
      asset_label: assetLabelById.get(ticket.asset_id) || `#${ticket.asset_id}`,
      created_by_name: ticket.created_by_user_id
        ? userNameById.get(ticket.created_by_user_id) ||
          `#${ticket.created_by_user_id}`
        : "-",
      handled_by_name: ticket.handled_by_user_id
        ? userNameById.get(ticket.handled_by_user_id) ||
          `#${ticket.handled_by_user_id}`
        : "-",
    }));
  }, [rawTickets, assetLabelById, userNameById]);

  const resetCreateForm = () => setCreateForm(buildCreateForm());
  const resetSendForm = () => setSendForm(buildSendForm());
  const resetCompleteForm = () => setCompleteForm(buildCompleteForm());
  const resetCancelForm = () => setCancelNote("");

  const handleCloseModal = () => {
    if (creating) return;
    if (actionLoadingKey) return;

    setModalMode(null);
    setActiveTicket(null);
    resetCreateForm();
    resetSendForm();
    resetCompleteForm();
    resetCancelForm();
  };

  const handleOpenCreateModal = () => {
    resetCreateForm();
    setActiveTicket(null);
    setModalMode("create");
  };

  const handleOpenSendModal = (ticket) => {
    setActiveTicket(ticket);
    setSendForm({
      sent_date: todayIso(),
      expected_return_date: ticket.expected_return_date || "",
      note: ticket.note || "",
    });
    setModalMode("send");
  };

  const handleOpenCompleteModal = (ticket) => {
    setActiveTicket(ticket);
    setCompleteForm({
      received_back_date: todayIso(),
      resolution_note: ticket.resolution_note || "",
      maintenance_cost: "",
      note: ticket.note || "",
    });
    setModalMode("complete");
  };

  const handleOpenCancelModal = (ticket) => {
    setActiveTicket(ticket);
    setCancelNote(ticket.note || "");
    setModalMode("cancel");
  };

  const handleOpenPdf = async (ticket) => {
    try {
      setActionLoadingKey(`pdf-${ticket.id}`);
      await openWarrantyPdf(ticket.id);
    } catch (error) {
      handleApiError(error, "Không mở được PDF");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitCreate = async () => {
    if (!createForm.asset_id) {
      toast({
        title: "Thiếu tài sản",
        description: "Bạn cần chọn tài sản cần bảo hành.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    if (!createForm.issue_description?.trim()) {
      toast({
        title: "Thiếu mô tả lỗi",
        description: "Bạn cần nhập mô tả lỗi hoặc sự cố.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const payload = {
      asset_id: Number(createForm.asset_id),
      vendor_name: createForm.vendor_name?.trim() || null,
      provider_contact: createForm.provider_contact?.trim() || null,
      warranty_start_date: createForm.warranty_start_date || null,
      warranty_end_date: createForm.warranty_end_date || null,
      sent_date: createForm.sent_date || null,
      expected_return_date: createForm.expected_return_date || null,
      issue_description: createForm.issue_description.trim(),
      note: createForm.note?.trim() || null,
    };

    try {
      setCreating(true);
      await createWarranty(payload);

      toast({
        title: currentUserRole === "staff"
          ? "Tạo yêu cầu bảo hành thành công"
          : "Tạo phiếu bảo hành thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Tạo phiếu bảo hành thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitSend = async () => {
    if (!activeTicket) return;

    const payload = {
      sent_date: sendForm.sent_date || null,
      expected_return_date: sendForm.expected_return_date || null,
      note: sendForm.note?.trim() || null,
    };

    try {
      setActionLoadingKey(`send-${activeTicket.id}`);
      await sendWarranty(activeTicket.id, payload);

      toast({
        title: "Gửi bảo hành thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Gửi bảo hành thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitComplete = async () => {
    if (!activeTicket) return;

    if (!completeForm.received_back_date) {
      toast({
        title: "Thiếu ngày nhận lại",
        description: "Bạn cần nhập ngày nhận lại tài sản.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const payload = {
      received_back_date: completeForm.received_back_date,
      resolution_note: completeForm.resolution_note?.trim() || null,
      maintenance_cost:
        completeForm.maintenance_cost === ""
          ? null
          : Number(completeForm.maintenance_cost),
      note: completeForm.note?.trim() || null,
    };

    try {
      setActionLoadingKey(`complete-${activeTicket.id}`);
      await completeWarranty(activeTicket.id, payload);

      toast({
        title: "Hoàn tất bảo hành thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Hoàn tất bảo hành thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitCancel = async () => {
    if (!activeTicket) return;

    try {
      setActionLoadingKey(`cancel-${activeTicket.id}`);
      await cancelWarranty(activeTicket.id, {
        note: cancelNote?.trim() || null,
      });

      toast({
        title: "Hủy phiếu bảo hành thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
      await loadPageData();
    } catch (error) {
      handleApiError(error, "Hủy phiếu bảo hành thất bại");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSubmitModal = async () => {
    if (modalMode === "create") {
      await handleSubmitCreate();
      return;
    }

    if (modalMode === "send") {
      await handleSubmitSend();
      return;
    }

    if (modalMode === "complete") {
      await handleSubmitComplete();
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
            Quản lý bảo hành
          </Text>
          <Text fontSize="sm" color="gray.500">
            {currentUserRole === "staff"
              ? "Tạo yêu cầu bảo hành và xem lịch sử phiếu trong phạm vi được phép."
              : "Tạo phiếu bảo hành, gửi bảo hành, hoàn tất, hủy và mở PDF."}
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
            {currentUserRole === "staff"
              ? "Tạo yêu cầu bảo hành"
              : "Tạo phiếu bảo hành"}
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
            onOpenSend={handleOpenSendModal}
            onOpenComplete={handleOpenCompleteModal}
            onOpenCancel={handleOpenCancelModal}
            onOpenPdf={handleOpenPdf}
            canSend={currentUserRole === "admin" || currentUserRole === "manager"}
            canComplete={currentUserRole === "admin" || currentUserRole === "manager"}
            canCancel={currentUserRole === "admin" || currentUserRole === "manager"}
          />
        )}
      </Box>

      <WarrantyModal
        isOpen={Boolean(modalMode)}
        onClose={handleCloseModal}
        mode={modalMode}
        activeTicket={activeTicket}
        createForm={createForm}
        setCreateForm={setCreateForm}
        sendForm={sendForm}
        setSendForm={setSendForm}
        completeForm={completeForm}
        setCompleteForm={setCompleteForm}
        cancelNote={cancelNote}
        setCancelNote={setCancelNote}
        availableAssets={availableAssets}
        currentUserRole={currentUserRole}
        loading={creating || Boolean(actionLoadingKey)}
        onSubmit={handleSubmitModal}
      />
    </Box>
  );
}