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
import CategoryModal from "./CategoryModal";

const PAGE_SIZE = 10;

const TYPE_BADGE_COLOR = {
  supply: "blue",
  asset: "purple",
};

const TYPE_LABEL = {
  supply: "Vật tư",
  asset: "Tài sản",
};

function TypeBadge({ type }) {
  return (
    <Badge
      colorScheme={TYPE_BADGE_COLOR[type] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {TYPE_LABEL[type] || type}
    </Badge>
  );
}

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
    departments = [],
    onSaveCategory,
    onDeleteCategory,
    onCreateCategory,
    onRefreshCategory,
    addLabel = "Thêm danh mục",
    canManageCategories = false,
    canDeleteCategoryByRole = false,
    loading = false,
  } = props;

  const [keyword, setKeyword] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("edit");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

  const filteredData = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tableData || []).filter((row) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [row.category_code, row.category_name].some(
          (value) =>
            value != null &&
            String(value).toLowerCase().includes(normalizedKeyword)
        );

      const matchesType =
        !typeFilter || row.category_type === typeFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && Boolean(row.is_active)) ||
        (statusFilter === "inactive" && !Boolean(row.is_active));

      return matchesKeyword && matchesType && matchesStatus;
    });
  }, [keyword, typeFilter, statusFilter, tableData]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, typeFilter, statusFilter, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (category) => {
    setSelectedCategory(category);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedCategory?.id === onSaveCategory?.loadingId ||
      selectedCategory?.id === onDeleteCategory?.loadingId ||
      onCreateCategory?.loading
    ) {
      return;
    }

    setSelectedCategory(null);
    setIsModalOpen(false);
  };

  const handleSave = async (category) => {
    await onSaveCategory?.handler?.(category);
    handleCloseModal();
  };

  const handleDelete = async (category) => {
    await onDeleteCategory?.handler?.(category);
    handleCloseModal();
  };

  const handleCreate = async (category) => {
    await onCreateCategory?.handler?.(category);
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
              {title || "Quản lý danh mục"}
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {canManageCategories
                ? "Admin có thể tạo, sửa hoặc xóa danh mục. Danh mục dùng để phân loại tài sản và vật tư."
                : "Bạn đang ở chế độ chỉ xem."}
            </Text>
          </Box>

          {canManageCategories ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={() => {
                setSelectedCategory(null);
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
              placeholder="Tìm mã hoặc tên danh mục..."
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
            <option value="supply">Vật tư</option>
            <option value="asset">Tài sản</option>
          </Select>

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
                <Th borderColor={borderColor}>Loại</Th>
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
                      Không có danh mục phù hợp.
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
                    <Td borderColor={borderColor}>{row.category_code}</Td>
                    <Td borderColor={borderColor}>{row.category_name}</Td>
                    <Td borderColor={borderColor}>
                      <TypeBadge type={row.category_type} />
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

      <CategoryModal
        category={selectedCategory}
        departments={departments}
        isOpen={isModalOpen}
        isSubmitting={
          modalMode === "create"
            ? Boolean(onCreateCategory?.loading)
            : Boolean(
                selectedCategory &&
                  selectedCategory.id === onSaveCategory?.loadingId
              )
        }
        isDeleting={Boolean(
          selectedCategory &&
            selectedCategory.id === onDeleteCategory?.loadingId
        )}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onDelete={handleDelete}
        onRefreshCategory={onRefreshCategory}
        mode={modalMode}
        canManageCategories={canManageCategories}
        canDeleteCategoryByRole={canDeleteCategoryByRole}
      />
    </>
  );
}
