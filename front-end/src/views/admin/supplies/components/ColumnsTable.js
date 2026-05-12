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
import SupplyModal from "./SupplyModal";

const PAGE_SIZE = 10;

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

function LowStockBadge({ quantityInStock, minimumStockLevel }) {
  const stock = Number(quantityInStock || 0);
  const min = Number(minimumStockLevel || 0);
  const isLow = Number.isFinite(stock) && Number.isFinite(min) && stock <= min;

  return (
    <Badge
      colorScheme={isLow ? "red" : "green"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {isLow ? "Tồn kho thấp" : "Bình thường"}
    </Badge>
  );
}

export default function ColumnsTable(props) {
  const {
    tableData = [],
    title,
    departmentOptions = [],
    categoryOptions = [],
    onSaveSupply,
    onDeactivateSupply,
    onActivateSupply,
    onCreateSupply,
    onUpdateStock,
    addLabel = "Thêm vật tư",
    canManageSupplies = false,
    canUpdateStock = false,
    canDeactivateSupplyByRole = false,
    loading = false,
  } = props;

  const [keyword, setKeyword] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("");
  const [lowStockOnly, setLowStockOnly] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedSupply, setSelectedSupply] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("edit");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

  // const categoryOptions = React.useMemo(() => {
  //   const unique = new Set(
  //     tableData
  //       .map((item) => String(item.category || "").trim())
  //       .filter(Boolean)
  //   );
  //   return Array.from(unique).sort();
  // }, [tableData]);

  const filteredData = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tableData || []).filter((row) => {
      const stock = Number(row.quantity_in_stock || 0);
      const min = Number(row.minimum_stock_level || 0);
      const isLowStock =
        Number.isFinite(stock) && Number.isFinite(min) && stock <= min;

      const matchesKeyword =
        !normalizedKeyword ||
        [
          row.code,
          row.name,
          row.category,
          row.unit,
          row.location,
          row.managed_department,
        ].some(
          (value) =>
            value != null &&
            String(value).toLowerCase().includes(normalizedKeyword)
        );

      const matchesCategory =
        !categoryFilter ||
        String(row.category_id ?? "") === categoryFilter;

      const matchesDepartment =
        !departmentFilter ||
        String(row.managed_department_id ?? "") === String(departmentFilter);

      const matchesActive =
        !activeFilter ||
        (activeFilter === "active" && Boolean(row.is_active)) ||
        (activeFilter === "inactive" && !Boolean(row.is_active));

      const matchesLowStock =
        !lowStockOnly ||
        (lowStockOnly === "yes" && isLowStock) ||
        (lowStockOnly === "no" && !isLowStock);

      return (
        matchesKeyword &&
        matchesCategory &&
        matchesDepartment &&
        matchesActive &&
        matchesLowStock
      );
    });
  }, [activeFilter, categoryFilter, departmentFilter, keyword, lowStockOnly, tableData]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, categoryFilter, departmentFilter, activeFilter, lowStockOnly, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (supply) => {
    setSelectedSupply(supply);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedSupply?.id === onSaveSupply?.loadingId ||
      selectedSupply?.id === onDeactivateSupply?.loadingId ||
      selectedSupply?.id === onActivateSupply?.loadingId ||
      selectedSupply?.id === onUpdateStock?.loadingId ||
      onCreateSupply?.loading
    ) {
      return;
    }

    setSelectedSupply(null);
    setIsModalOpen(false);
  };

  const handleSave = async (supply) => {
    await onSaveSupply?.handler?.(supply);
    handleCloseModal();
  };

  const handleDeactivate = async (supply) => {
    await onDeactivateSupply?.handler?.(supply);
    handleCloseModal();
  };
  const handleActivate = async (supply) => {
    await onActivateSupply?.handler?.(supply);
    handleCloseModal();
  };

  const handleCreate = async (supply) => {
    await onCreateSupply?.handler?.(supply);
    handleCloseModal();
  };

  const handleUpdateStock = async (payload) => {
    await onUpdateStock?.handler?.(payload);
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
              {title || "Quản lý vật tư"}
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {canManageSupplies
                ? "Admin và manager có thể tạo hoặc sửa vật tư. Mọi role hợp lệ có thể cập nhật tồn kho."
                : canUpdateStock
                  ? "Bạn đang ở chế độ xem, nhưng vẫn có thể cập nhật tồn kho."
                  : "Bạn đang ở chế độ chỉ xem."}
            </Text>
          </Box>

          {canManageSupplies ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={() => {
                setSelectedSupply(null);
                setModalMode("create");
                setIsModalOpen(true);
              }}
            >
              {addLabel}
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
              placeholder="Tìm mã, tên, danh mục..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả danh mục</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            maxW={{ base: "100%", md: "220px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả phòng ban</option>
            {departmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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

          <Select
            value={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.value)}
            maxW={{ base: "100%", md: "170px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả tồn kho</option>
            <option value="yes">Tồn kho thấp</option>
            <option value="no">Bình thường</option>
          </Select>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>STT</Th>
                <Th borderColor={borderColor}>Mã vật tư</Th>
                <Th borderColor={borderColor}>Tên</Th>
                <Th borderColor={borderColor}>Danh mục</Th>
                <Th borderColor={borderColor}>Tồn kho</Th>
                <Th borderColor={borderColor}>Tối thiểu</Th>
                <Th borderColor={borderColor}>Phòng ban</Th>
                <Th borderColor={borderColor}>Tình trạng tồn kho</Th>
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
                      Không có vật tư phù hợp.
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
                    <Td borderColor={borderColor}>{row.category}</Td>
                    <Td borderColor={borderColor}>{row.quantity_in_stock}</Td>
                    <Td borderColor={borderColor}>{row.minimum_stock_level}</Td>
                    <Td borderColor={borderColor}>{row.managed_department}</Td>
                    <Td borderColor={borderColor}>
                      <LowStockBadge
                        quantityInStock={row.quantity_in_stock}
                        minimumStockLevel={row.minimum_stock_level}
                      />
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

      <SupplyModal
        supply={selectedSupply}
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        isOpen={isModalOpen}
        isSubmitting={
          modalMode === "create"
            ? Boolean(onCreateSupply?.loading)
            : Boolean(selectedSupply && selectedSupply.id === onSaveSupply?.loadingId)
        }
        isDeactivating={Boolean(
          selectedSupply && selectedSupply.id === onDeactivateSupply?.loadingId
        )}
        isActivating={Boolean(
          selectedSupply && selectedSupply.id === onActivateSupply?.loadingId
        )}
        isUpdatingStock={Boolean(
          selectedSupply && selectedSupply.id === onUpdateStock?.loadingId
        )}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
        onUpdateStock={handleUpdateStock}
        mode={modalMode}
        canManageSupplies={canManageSupplies}
        canUpdateStock={canUpdateStock}
        canDeactivateSupplyByRole={canDeactivateSupplyByRole}
      />
    </>
  );
}