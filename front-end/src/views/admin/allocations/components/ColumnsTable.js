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
import AllocationModal from "./AllocationModal";

const PAGE_SIZE = 10;

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toLowerCase();

  const colorMap = {
    requested: "orange",
    active: "green",
    completed: "blue",
    returned: "purple",
    cancelled: "red",
  };

  const valueMap = {
    requested: "Đã yêu cầu",
    active: "Đang cấp phát",
    completed: "Đã hoàn thành",
    returned: "Đã trả lại",
    cancelled: "Đã hủy",
  };

  return (
    <Badge
      colorScheme={colorMap[normalizedStatus] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
      textTransform="capitalize"
    >
      {valueMap[normalizedStatus] || "Không xác định"}
    </Badge>
  );
}

function ActiveBadge({ isActive }) {
  return (
    <Badge
      colorScheme={isActive ? "green" : "red"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {isActive ? "Hoạt động" : "Không hoạt động"}
    </Badge>
  );
}

function TypeBadge({ type }) {
  const normalizedType = String(type || "").toLowerCase();
  const valueMap = {
    asset: "Tài sản",
    supply: "Vật tư",
  };
  return (
    <Badge
      colorScheme={normalizedType === "asset" ? "blue" : "orange"}
      borderRadius="999px"
      px="10px"
      py="4px"
      textTransform="capitalize"
    >
      {valueMap[normalizedType] || "Không xác định"}
    </Badge>
  );
}

export default function ColumnsTable(props) {
  const {
    tableData = [],
    title,
    departmentOptions = [],
    userOptions = [],
    assetOptions = [],
    supplyOptions = [],
    onSaveAllocation,
    onCreateAllocation,
    onUpdateAllocationStatus,
    onDeactivateAllocation,
    addLabel = "Thêm cấp phát",
    canCreateAllocations = false,
    canEditAllocations = false,
    canManageAllocations = false,
    canDeactivateAllocationByRole = false,
    currentUserRole = "",
    loading = false,
  } = props;

  const [keyword, setKeyword] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedAllocation, setSelectedAllocation] = React.useState(null);
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

  const helperText = React.useMemo(() => {
    if (isStaff) {
      return "Staff chỉ có thể xem phiếu cấp phát của phòng ban mình và xác nhận đã nhận vật tư khi được cấp phát.";
    }

    if (canManageAllocations) {
      return "Admin và manager có thể tạo, sửa, duyệt và cập nhật trạng thái allocation. Chỉ admin mới được vô hiệu hóa.";
    }

    return "Bạn đang ở chế độ chỉ xem.";
  }, [canManageAllocations, isStaff]);

  const filteredData = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tableData || []).filter((row) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          row.allocation_code,
          row.resource_label,
          row.allocated_department,
          row.allocated_user,
          row.allocated_by_user,
          row.allocation_type,
          row.status,
          row.purpose,
          row.note,
        ].some(
          (value) =>
            value != null &&
            String(value).toLowerCase().includes(normalizedKeyword)
        );

      const matchesType =
        !typeFilter || String(row.allocation_type || "") === typeFilter;

      const matchesStatus =
        !statusFilter || String(row.status || "") === statusFilter;

      const matchesActive =
        !activeFilter ||
        (activeFilter === "active" && Boolean(row.is_active)) ||
        (activeFilter === "inactive" && !Boolean(row.is_active));

      return matchesKeyword && matchesType && matchesStatus && matchesActive;
    });
  }, [activeFilter, keyword, statusFilter, tableData, typeFilter]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, typeFilter, statusFilter, activeFilter, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (allocation) => {
    setSelectedAllocation(allocation);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedAllocation?.id === onSaveAllocation?.loadingId ||
      selectedAllocation?.id === onUpdateAllocationStatus?.loadingId ||
      selectedAllocation?.id === onDeactivateAllocation?.loadingId ||
      onCreateAllocation?.loading
    ) {
      return;
    }

    setSelectedAllocation(null);
    setIsModalOpen(false);
  };

  const handleSave = async (allocation) => {
    await onSaveAllocation?.handler?.(allocation);
    handleCloseModal();
  };

  const handleCreate = async (allocation) => {
    await onCreateAllocation?.handler?.(allocation);
    handleCloseModal();
  };

  const handleUpdateStatus = async (payload) => {
    await onUpdateAllocationStatus?.handler?.(payload);
    handleCloseModal();
  };

  const handleDeactivate = async (allocation) => {
    await onDeactivateAllocation?.handler?.(allocation);
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
              {title || "Quản lý allocations"}
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {helperText}
            </Text>
          </Box>

          {canCreateAllocations ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={() => {
                setSelectedAllocation(null);
                setModalMode("create");
                setIsModalOpen(true);
              }}
            >
              {isStaff ? "Tạo đề nghị cấp phát" : addLabel}
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
              placeholder="Tìm code, resource, người nhận..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            maxW={{ base: "100%", md: "170px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả loại</option>
            <option value="asset">Tài sản</option>
            <option value="supply">Vật tư</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW={{ base: "100%", md: "190px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="requested">Đang yêu cầu</option>
            <option value="active">Hoạt động</option>
            <option value="completed">Hoàn thành</option>
            <option value="returned">Trả lại</option>
            <option value="cancelled">Đã hủy</option>
          </Select>

          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            maxW={{ base: "100%", md: "170px" }}
            borderRadius="16px"
          >
            <option value="">Trạng thái hoạt động</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </Select>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>STT</Th>
                <Th borderColor={borderColor}>Mã</Th>
                <Th borderColor={borderColor}>Loại</Th>
                <Th borderColor={borderColor}>Nguồn</Th>
                <Th borderColor={borderColor}>Số lượng</Th>
                <Th borderColor={borderColor}>Phòng ban</Th>
                <Th borderColor={borderColor}>Người nhận</Th>
                <Th borderColor={borderColor}>Trạng thái</Th>
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
                      Không có dữ liệu cấp phát phù hợp.
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
                    <Td borderColor={borderColor}>{row.allocation_code}</Td>
                    <Td borderColor={borderColor}>
                      <TypeBadge type={row.allocation_type} />
                    </Td>
                    <Td borderColor={borderColor}>{row.resource_label}</Td>
                    <Td borderColor={borderColor}>{row.quantity}</Td>
                    <Td borderColor={borderColor}>{row.allocated_department}</Td>
                    <Td borderColor={borderColor}>{row.allocated_user}</Td>
                    <Td borderColor={borderColor}>
                      <StatusBadge status={row.status} />
                    </Td>
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

      <AllocationModal
        allocation={selectedAllocation}
        departmentOptions={departmentOptions}
        userOptions={userOptions}
        assetOptions={assetOptions}
        supplyOptions={supplyOptions}
        isOpen={isModalOpen}
        isSubmitting={
          modalMode === "create"
            ? Boolean(onCreateAllocation?.loading)
            : Boolean(
                selectedAllocation &&
                  selectedAllocation.id === onSaveAllocation?.loadingId
              )
        }
        isUpdatingStatus={Boolean(
          selectedAllocation &&
            selectedAllocation.id === onUpdateAllocationStatus?.loadingId
        )}
        isDeactivating={Boolean(
          selectedAllocation &&
            selectedAllocation.id === onDeactivateAllocation?.loadingId
        )}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onUpdateStatus={handleUpdateStatus}
        onDeactivate={handleDeactivate}
        mode={modalMode}
        canCreateAllocations={canCreateAllocations}
        canEditAllocations={canEditAllocations}
        canManageAllocations={canManageAllocations}
        canDeactivateAllocationByRole={canDeactivateAllocationByRole}
        currentUserRole={currentUserRole}
      />
    </>
  );
}