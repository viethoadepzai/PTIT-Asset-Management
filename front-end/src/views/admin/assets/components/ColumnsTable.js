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
import AssetModal from "./AssetModal";

const PAGE_SIZE = 10;

const APPROVAL_COLOR = { approved: "green", pending: "yellow", rejected: "red" };
const APPROVAL_LABEL = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Không duyệt" };

function StatusBadge({ status }) {
  const colorMap = {
    available: "green",
    in_use: "blue",
    under_maintenance: "orange",
    damaged: "red",
    liquidated: "gray",
  };
  const valueMap = {
    available: "Có sẵn",
    in_use: "Đang sử dụng",
    under_maintenance: "Đang bảo trì",
    damaged: "Hỏng",
    liquidated: "Đã thanh lý",
  };

  return (
    <Badge
      colorScheme={colorMap[status] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {valueMap[status] || "unknown"}
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

function UseFulLifeBadge({ purchaseDate, usefulLifeMonths }) {
  const calcDepreciationPercent = () => {
    if (!purchaseDate || !usefulLifeMonths) return 0;

    const start = new Date(purchaseDate);
    const now = new Date();

    let months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    if (now.getDate() < start.getDate()) {
      months--;
    }

    const percent = (months / usefulLifeMonths) * 100;

    return Math.min(Math.max(percent, 0), 100); // clamp 0–100
  };

  const percent = calcDepreciationPercent();

  const getColor = () => {
    if (percent < 25) return "green";
    if (percent < 50) return "yellow";
    if (percent < 75) return "orange";
    return "red";
  };

  return (
    <Badge
      colorScheme={getColor()}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {percent.toFixed(0)}%
    </Badge>
  );
}

export default function ColumnsTable(props) {
  const {
    tableData = [],
    title,
    departmentOptions = [],
    categoryOptions = [],
    userOptions = [],
    onSaveAsset,
    onDeactivateAsset,
    onActivateAsset,
    onCreateAsset,
    addLabel = "Yêu cầu thêm tài sản",
    canManageAssets = false,
    canDeactivateAssetByRole = false,
    loading = false,
  } = props;

  const [keyword, setKeyword] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [conditionFilter, setConditionFilter] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedAsset, setSelectedAsset] = React.useState(null);
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
      const matchesKeyword =
        !normalizedKeyword ||
        [
          row.code,
          row.name,
          row.category,
          row.serial_number,
          row.location,
          row.assigned_department,
          row.assigned_user,
          row.status,
          row.condition,
        ].some(
          (value) =>
            value != null &&
            String(value).toLowerCase().includes(normalizedKeyword)
        );

      const matchesCategory =
        !categoryFilter ||
        String(row.category_id ?? "") === categoryFilter;

      const matchesStatus =
        !statusFilter || String(row.status || "") === statusFilter;

      const matchesCondition =
        !conditionFilter || String(row.condition || "") === conditionFilter;

      const matchesActive =
        !activeFilter ||
        (activeFilter === "active" && Boolean(row.is_active)) ||
        (activeFilter === "inactive" && !Boolean(row.is_active));

      return (
        matchesKeyword &&
        matchesCategory &&
        matchesStatus &&
        matchesCondition &&
        matchesActive
      );
    });
  }, [activeFilter, categoryFilter, conditionFilter, keyword, statusFilter, tableData]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, categoryFilter, statusFilter, conditionFilter, activeFilter, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (asset) => {
    console.log("row data: ", asset)
    setSelectedAsset(asset);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedAsset?.id === onSaveAsset?.loadingId ||
      selectedAsset?.id === onDeactivateAsset?.loadingId ||
      selectedAsset?.id === onActivateAsset?.loadingId ||
      onCreateAsset?.loading
    ) {
      return;
    }

    setSelectedAsset(null);
    setIsModalOpen(false);
  };

  const handleSave = async (asset) => {
    await onSaveAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleDeactivate = async (asset) => {
    await onDeactivateAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleActivate = async (asset) => {
    await onActivateAsset?.handler?.(asset);
    console.log("Xử lí xong kích hoạt")
    handleCloseModal();
  };

  const handleCreate = async (asset) => {
    await onCreateAsset?.handler?.(asset);
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
              {title || "Quản lý tài sản"}
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {canManageAssets
                ? "Admin và manager có thể tạo hoặc sửa tài sản. Chỉ admin mới được vô hiệu hóa."
                : "Bạn đang ở chế độ chỉ xem."}
            </Text>
          </Box>

          {canManageAssets ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={() => {
                setSelectedAsset(null);
                setModalMode("create");
                setIsModalOpen(true);
              }}
            >
              {addLabel}
            </Button>
          ) : null}
        </Flex>

        <Flex px="25px" pb="18px" gap="12px" wrap="wrap" align="center">
          <InputGroup maxW={{ base: "100%", md: "280px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm mã, tên, số seri..." 
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            maxW={{ base: "100%", md: "190px" }}
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW={{ base: "100%", md: "190px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="available">Có sẵn</option>
            <option value="in_use">Đang sử dụng</option>
            <option value="under_maintenance">Đang bảo trì</option>
            <option value="damaged">Hỏng</option>
            <option value="liquidated">Đã thanh lý</option>
          </Select>

          <Select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả tình trạng </option>
            <option value="new">Mới</option>
            <option value="good">Tốt</option>
            <option value="fair">Trung bình</option>
            <option value="poor">Kém</option>
            <option value="broken">Hỏng</option>
          </Select>

          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
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
                <Th borderColor={borderColor}>Danh mục</Th>
                <Th borderColor={borderColor}>Phòng ban</Th>
                <Th borderColor={borderColor}>Trạng thái</Th>
                <Th borderColor={borderColor}>Khấu hao</Th>
                <Th borderColor={borderColor}>Hoạt động</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={8} borderColor={borderColor}>
                    <Text py="20px" textAlign="center" color="gray.500">
                      Đang tải dữ liệu...
                    </Text>
                  </Td>
                </Tr>
              ) : paginatedRows.length === 0 ? (
                <Tr>
                  <Td colSpan={8} borderColor={borderColor}>
                    <Text py="20px" textAlign="center" color="gray.500">
                      Không có tài sản phù hợp.
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
                    <Td borderColor={borderColor}>{row.assigned_department}</Td>
                    <Td borderColor={borderColor}>
                      <StatusBadge status={row.status} />
                    </Td>
                    <Td borderColor={borderColor}>
                      <UseFulLifeBadge purchaseDate={row.purchase_date} usefulLifeMonths={row.useful_life} />
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

      <AssetModal
        asset={selectedAsset}
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        userOptions={userOptions}
        isOpen={isModalOpen}
        isSubmitting={
          modalMode === "create"
            ? Boolean(onCreateAsset?.loading)
            : Boolean(selectedAsset && selectedAsset.id === onSaveAsset?.loadingId)
        }
        isDeactivating={Boolean(
          selectedAsset && selectedAsset.id === onDeactivateAsset?.loadingId
        )}
        isActivating={Boolean(
          selectedAsset && selectedAsset.id === onActivateAsset?.loadingId
        )}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
        mode={modalMode}
        canManageAssets={canManageAssets}
        canDeactivateAssetByRole={canDeactivateAssetByRole}
      />
    </>
  );
}