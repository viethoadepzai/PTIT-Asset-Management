/* eslint-disable */
import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";

import Card from "components/card/Card";
import DepartmentModal from "./DepartmentModal";

const PAGE_SIZE = 10;

function StatusBadge({ isActive }) {
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

export default function ColumnsTable(props) {
  const {
    tableData = [],
    title,
    onSaveDepartment,
    onDeleteDepartment,
    onDeactivateDepartment, // giữ tương thích code cũ
    onCreateDepartment,
    addLabel = "Thêm phòng ban",
    canManageDepartments = false,
    canDeleteDepartmentByRole,
    canDeactivateDepartmentByRole, // giữ tương thích code cũ
    loading = false,
  } = props;

  const [keyword, setKeyword] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedDepartment, setSelectedDepartment] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("edit");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

  // ưu tiên prop mới, fallback prop cũ
  const deleteAction = onDeleteDepartment || onDeactivateDepartment;
  const canDeleteByRole =
    typeof canDeleteDepartmentByRole === "boolean"
      ? canDeleteDepartmentByRole
      : Boolean(canDeactivateDepartmentByRole);

  const filteredData = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tableData || []).filter((row) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [row.code, row.name, row.description].some(
          (value) =>
            value != null &&
            String(value).toLowerCase().includes(normalizedKeyword)
        );

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && Boolean(row.is_active)) ||
        (statusFilter === "inactive" && !Boolean(row.is_active));

      return matchesKeyword && matchesStatus;
    });
  }, [keyword, statusFilter, tableData]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, statusFilter, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (department) => {
    setSelectedDepartment(department);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedDepartment?.id === onSaveDepartment?.loadingId ||
      selectedDepartment?.id === deleteAction?.loadingId ||
      onCreateDepartment?.loading
    ) {
      return;
    }

    setSelectedDepartment(null);
    setIsModalOpen(false);
  };

  const handleSave = async (department) => {
    await onSaveDepartment?.handler?.(department);
    handleCloseModal();
  };

  const handleDelete = async (department) => {
    await deleteAction?.handler?.(department);
    handleCloseModal();
  };

  const handleCreate = async (department) => {
    await onCreateDepartment?.handler?.(department);
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
              {title || "Quản lý phòng ban"}
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {canManageDepartments
                ? "Admin và manager có thể tạo hoặc sửa phòng ban. Chỉ admin mới được xóa phòng ban."
                : "Bạn đang ở chế độ chỉ xem."}
            </Text>
          </Box>

          {canManageDepartments ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={() => {
                setSelectedDepartment(null);
                setModalMode("create");
                setIsModalOpen(true);
              }}
            >
              {addLabel}
            </Button>
          ) : null}
        </Flex>

        <Flex
          px="25px"
          pb="18px"
          gap="12px"
          wrap="wrap"
          align="center"
        >
          <InputGroup maxW={{ base: "100%", md: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm mã, tên hoặc mô tả..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
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
                <Th borderColor={borderColor}>Tên</Th>
                <Th borderColor={borderColor}>Mô tả</Th>
                <Th borderColor={borderColor}>Trạng thái</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={5} borderColor={borderColor}>
                    <Text py="20px" textAlign="center" color="gray.500">
                      Đang tải dữ liệu...
                    </Text>
                  </Td>
                </Tr>
              ) : paginatedRows.length === 0 ? (
                <Tr>
                  <Td colSpan={5} borderColor={borderColor}>
                    <Text py="20px" textAlign="center" color="gray.500">
                      Không có phòng ban phù hợp.
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
                    <Td borderColor={borderColor}>{row.code}</Td>
                    <Td borderColor={borderColor}>{row.name}</Td>
                    <Td borderColor={borderColor}>
                      <Text noOfLines={2}>{row.description || "-"}</Text>
                    </Td>
                    <Td borderColor={borderColor}>
                      <StatusBadge isActive={row.is_active} />
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

      <DepartmentModal
        department={selectedDepartment}
        isOpen={isModalOpen}
        isSubmitting={
          modalMode === "create"
            ? Boolean(onCreateDepartment?.loading)
            : Boolean(
                selectedDepartment &&
                  selectedDepartment.id === onSaveDepartment?.loadingId
              )
        }
        isDeleting={Boolean(
          selectedDepartment &&
            selectedDepartment.id === deleteAction?.loadingId
        )}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onDelete={handleDelete}
        mode={modalMode}
        canManageDepartments={canManageDepartments}
        canDeleteDepartmentByRole={canDeleteByRole}
      />
    </>
  );
}