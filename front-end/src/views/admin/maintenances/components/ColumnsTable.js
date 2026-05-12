import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";

import Card from "components/card/Card";
import MaintenanceModal from "./MaintenanceModal";

const PAGE_SIZE = 10;

function StatusBadge({ status }) {
  const colorMap = {
    scheduled: "orange",
    in_progress: "yellow",
    completed: "green",
    cancelled: "red",
  };
  const valueMap = {
    scheduled: "Đã lên lịch",
    in_progress: "Đang thực hiện",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }

  return (
    <Badge
      colorScheme={colorMap[status] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
      textTransform="capitalize"
    >
      {valueMap[status] || "Không xác định"}
    </Badge>
  );
}

function PriorityBadge({ priority }) {
  const colorMap = {
    low: "green",
    medium: "blue",
    high: "orange",
    urgent: "red",
  };

  const valueMap = {
    low: "thấp",
    medium: "trung bình",
    high: "cao",
    urgent: "khẩn cấp",
  };

  return (
    <Badge
      colorScheme={colorMap[priority] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
      textTransform="capitalize"
    >
      {valueMap[priority] || "Không xác định"}
    </Badge>
  );
}

function ActiveBadge({ isActive }) {
  const valueMap = {
    true: "Hoạt động",
    false: "Không hoạt động",
  };

  return (
    <Badge
      colorScheme={isActive ? "green" : "red"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {valueMap[isActive] || "Không xác định"}
    </Badge>
  );
}

function TypeFunc( type ) {
  const valueMap = {
    preventive: "Phòng ngừa",
    corrective: "Sửa chữa",
    inspection: "Kiểm tra",
    warranty: "Bảo hành",
    other: "Khác",
  };

  return (
      valueMap[type] || "Không xác định"
  );
}

export default function ColumnsTable(props) {
  const {
    tableData = [],
    title,
    assetOptions = [],
    userOptions = [],
    onSaveMaintenance,
    onCreateMaintenance,
    onUpdateMaintenanceStatus,
    onDeactivateMaintenance,
    addLabel = "Thêm maintenance",
    canCreateMaintenances = false,
    canEditMaintenances = false,
    canUpdateMaintenanceStatus = false,
    canDeactivateMaintenanceByRole = false,
    currentUserRole = "",
    loading = false,
  } = props;

  const [keyword, setKeyword] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedMaintenance, setSelectedMaintenance] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("edit");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();
  const isStaff = normalizedRole === "staff";
  const isManagerOrAdmin =
    normalizedRole === "admin" || normalizedRole === "manager";

  const helperText = React.useMemo(() => {
    if (isManagerOrAdmin) {
      return "Admin và manager có thể tạo, sửa, cập nhật trạng thái và xử lý maintenance. Chỉ admin mới được vô hiệu hóa.";
    }

    if (isStaff) {
      return "Staff có thể tạo yêu cầu bảo trì và xem lịch sử trong phạm vi được phép. Staff không được cập nhật trạng thái maintenance.";
    }

    if (canCreateMaintenances) {
      return "Bạn có thể tạo maintenance.";
    }

    return "Bạn đang ở chế độ chỉ xem.";
  }, [canCreateMaintenances, isManagerOrAdmin, isStaff]);

  const filteredData = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tableData || []).filter((row) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          row.maintenance_code,
          row.asset_label,
          row.title,
          row.description,
          row.vendor_name,
          row.reported_by_user,
          row.assigned_to_user,
          row.maintenance_type,
          row.priority,
          row.status,
        ].some(
          (value) =>
            value != null &&
            String(value).toLowerCase().includes(normalizedKeyword)
        );

      const matchesType =
        !typeFilter || String(row.maintenance_type || "") === typeFilter;

      const matchesPriority =
        !priorityFilter || String(row.priority || "") === priorityFilter;

      const matchesStatus =
        !statusFilter || String(row.status || "") === statusFilter;

      const matchesActive =
        !activeFilter ||
        (activeFilter === "active" && Boolean(row.is_active)) ||
        (activeFilter === "inactive" && !Boolean(row.is_active));

      return (
        matchesKeyword &&
        matchesType &&
        matchesPriority &&
        matchesStatus &&
        matchesActive
      );
    });
  }, [activeFilter, keyword, priorityFilter, statusFilter, tableData, typeFilter]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, typeFilter, priorityFilter, statusFilter, activeFilter, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedMaintenance?.id === onSaveMaintenance?.loadingId ||
      selectedMaintenance?.id === onUpdateMaintenanceStatus?.loadingId ||
      selectedMaintenance?.id === onDeactivateMaintenance?.loadingId ||
      onCreateMaintenance?.loading
    ) {
      return;
    }

    setSelectedMaintenance(null);
    setIsModalOpen(false);
  };

  const handleSave = async (maintenance) => {
    await onSaveMaintenance?.handler?.(maintenance);
    handleCloseModal();
  };

  const handleCreate = async (maintenance) => {
    await onCreateMaintenance?.handler?.(maintenance);
    handleCloseModal();
  };

  const handleUpdateStatus = async (payload) => {
    await onUpdateMaintenanceStatus?.handler?.(payload);
    handleCloseModal();
  };

  const handleDeactivate = async (maintenance) => {
    await onDeactivateMaintenance?.handler?.(maintenance);
    handleCloseModal();
  };

  const startRow = filteredData.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const endRow = Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length);

  return (
    <>
      <Card flexDirection="column" w="100%" px="0px" overflowX="auto">
        <Flex
          px="25px"
          pt="20px"
          pb="16px"
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap="12px"
        >
          <Box>
            <Text color={textColor} fontSize="22px" fontWeight="700">
              {title || "Quản lý bảo trì"}
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {helperText}
            </Text>
          </Box>

          {canCreateMaintenances ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={() => {
                setSelectedMaintenance(null);
                setModalMode("create");
                setIsModalOpen(true);
              }}
            >
              Tạo yêu cầu bảo trì
              {/* {isStaff ? "Tạo yêu cầu bảo trì" : addLabel} */}
            </Button>
          ) : null}
        </Flex>

        <Flex px="25px" pb="18px" gap="12px" wrap="wrap" align="center">
          <InputGroup maxW={{ base: "100%", md: "260px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm mã, tên, tiêu đề..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả loại</option>
            <option value="preventive">Phòng ngừa</option>
            <option value="corrective">Sửa chữa</option>
            <option value="inspection">Kiểm tra</option>
            <option value="warranty">Bảo hành</option>
            <option value="other">Khác</option>
          </Select>

          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả độ ưu tiên</option>
            <option value="low">thấp</option>
            <option value="medium">trung bình</option>
            <option value="high">cao</option>
            <option value="urgent">khẩn cấp</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW={{ base: "100%", md: "190px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="scheduled">Đã lên lịch</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </Select>

          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            maxW={{ base: "100%", md: "170px" }}
            borderRadius="16px"
          >
            <option value="">Trạng thái hoạt động</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </Select>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>STT</Th>
                <Th borderColor={borderColor}>Mã</Th>
                <Th borderColor={borderColor}>Tên</Th>
                <Th borderColor={borderColor}>Loại</Th>
                <Th borderColor={borderColor}>Trạng thái</Th>
                <Th borderColor={borderColor}>Độ ưu tiên</Th>
                <Th borderColor={borderColor}>Tiêu đề</Th>
                <Th borderColor={borderColor}>Giao cho</Th>
                <Th borderColor={borderColor}>Hoạt động</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={9} borderColor={borderColor}>
                    <Text py="20px" textAlign="center" color="gray.500">
                      Đang tải dữ liệu...
                    </Text>
                  </Td>
                </Tr>
              ) : paginatedRows.length === 0 ? (
                <Tr>
                  <Td colSpan={9} borderColor={borderColor}>
                    <Text py="20px" textAlign="center" color="gray.500">
                      Không có dữ liệu bảo trì phù hợp.
                    </Text>
                  </Td>
                </Tr>
              ) : (
                paginatedRows.map((row) => (
                  <Tr
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    cursor="pointer"
                    _hover={{ bg: rowHoverBg }}
                  >
                    <Td borderColor={borderColor}>{row.stt}</Td>
                    <Td borderColor={borderColor}>{row.maintenance_code}</Td>
                    <Td borderColor={borderColor}>{row.asset_label}</Td>
                    <Td borderColor={borderColor}>{TypeFunc(row.maintenance_type)}</Td>
                    <Td borderColor={borderColor}>
                      <StatusBadge status={row.status} />
                    </Td>
                    <Td borderColor={borderColor}>
                      <PriorityBadge priority={row.priority} />
                    </Td>
                    <Td borderColor={borderColor}>{row.title}</Td>
                    <Td borderColor={borderColor}>{row.assigned_to_user}</Td>
                    <Td borderColor={borderColor}>
                      <ActiveBadge isActive={row.is_active} />
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        <Flex
          px="25px"
          py="18px"
          align="center"
          justify="space-between"
          wrap="wrap"
          gap="12px"
        >
          <Text fontSize="sm" color="gray.500">
            {filteredData.length === 0
              ? "Không có bản ghi"
              : `Hiển thị ${startRow}-${endRow} trong ${filteredData.length} bản ghi`}
          </Text>

          <Flex gap="10px">
            <Button
              variant="outline"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              isDisabled={currentPage === 0}
            >
              Trước
            </Button>
            <Button variant="ghost" isDisabled>
              Trang {currentPage + 1} / {totalPages}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))
              }
              isDisabled={currentPage >= totalPages - 1}
            >
              Tiếp
            </Button>
          </Flex>
        </Flex>
      </Card>

      <MaintenanceModal
        maintenance={selectedMaintenance}
        assetOptions={assetOptions}
        userOptions={userOptions}
        isOpen={isModalOpen}
        isSubmitting={
          modalMode === "create"
            ? Boolean(onCreateMaintenance?.loading)
            : Boolean(
                selectedMaintenance &&
                  selectedMaintenance.id === onSaveMaintenance?.loadingId
              )
        }
        isUpdatingStatus={Boolean(
          selectedMaintenance &&
            selectedMaintenance.id === onUpdateMaintenanceStatus?.loadingId
        )}
        isDeactivating={Boolean(
          selectedMaintenance &&
            selectedMaintenance.id === onDeactivateMaintenance?.loadingId
        )}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onUpdateStatus={handleUpdateStatus}
        onDeactivate={handleDeactivate}
        mode={modalMode}
        canEditMaintenances={canEditMaintenances}
        canUpdateMaintenanceStatus={canUpdateMaintenanceStatus}
        canDeactivateMaintenanceByRole={canDeactivateMaintenanceByRole}
        currentUserRole={currentUserRole}
      />
    </>
  );
}