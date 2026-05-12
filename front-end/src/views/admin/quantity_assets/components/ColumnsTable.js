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
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  AddIcon,
  SearchIcon,
  ViewIcon,
  CheckIcon,
  CloseIcon,
} from "@chakra-ui/icons";

import Card from "components/card/Card";
import AssetModal from "./AssetModal";

const PAGE_SIZE = 10;

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
    under_maintenance: "Bảo trì",
    damaged: "Hỏng",
    liquidated: "Thanh lý",
  };

  return (
    <Badge
      colorScheme={colorMap[status] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {valueMap[status] || "Không xác định"}
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

function ApprovalBadge({ status }) {
  const colorMap = {
    approved: "green",
    pending: "yellow",
    rejected: "red",
  };

  const labelMap = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Không duyệt",
  };

  return (
    <Badge
      colorScheme={colorMap[status] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {labelMap[status] || status}
    </Badge>
  );
}

function ConditionBadge({ condition }) {
  const colorMap = {
    new: "green",
    good: "blue",
    fair: "yellow",
    poor: "orange",
    broken: "red",
  };

  const labelMap = {
    new: "Mới",
    good: "Tốt",
    fair: "Khá",
    poor: "Kém",
    broken: "Hỏng",
  };

  return (
    <Badge
      colorScheme={colorMap[condition] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {labelMap[condition] || condition}
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

    return Math.min(Math.max(percent, 0), 100);
  };

  const percent = calcDepreciationPercent();

  const getColor = () => {
    if (percent < 25) return "green";
    if (percent < 50) return "yellow";
    if (percent < 75) return "orange";
    return "red";
  };

  return (
    <Tooltip
      label={`Khấu hao ${percent.toFixed(0)}%`}
      hasArrow
      placement="top"
    >
      <Badge
        colorScheme={getColor()}
        borderRadius="999px"
        px="10px"
        py="4px"
      >
        KH:{percent.toFixed(0)}%
      </Badge>
    </Tooltip>
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
    onApproveAsset,
    onRejectAsset,
    canManageAssets = false,
    canDeactivateAssetByRole = false,
    currentUserRole = "",
    loading = false,
  } = props;

  const addLabel =
    currentUserRole === "manager"
      ? "Yêu cầu thêm tài sản"
      : "Thêm tài sản";

  const [keyword, setKeyword] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [conditionFilter, setConditionFilter] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("");
  const [approvalFilter, setApprovalFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedAsset, setSelectedAsset] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("edit");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const secondaryText = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const cardBg = useColorModeValue("white", "navy.800");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

  const hoverShadow = useColorModeValue(
    "0px 18px 40px rgba(112, 144, 176, 0.12)",
    "0px 18px 40px rgba(0,0,0,0.4)"
  );

  const filteredData = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tableData || []).filter((row) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          row.name,
          row.code,
          row.category,
          row.location,
          row.assigned_department,
          row.assigned_user,
          row.note,
          row.specification,
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
        !conditionFilter ||
        String(row.condition || "") === conditionFilter;

      const matchesApproval =
        !approvalFilter ||
        String(row.approval_status || "") === approvalFilter;

      const matchesActive =
        !activeFilter ||
        (activeFilter === "active" && Boolean(row.is_active)) ||
        (activeFilter === "inactive" && !Boolean(row.is_active));

      return (
        matchesKeyword &&
        matchesCategory &&
        matchesStatus &&
        matchesCondition &&
        matchesApproval &&
        matchesActive
      );
    });
  }, [
    activeFilter,
    approvalFilter,
    categoryFilter,
    conditionFilter,
    keyword,
    statusFilter,
    tableData,
  ]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [
    keyword,
    categoryFilter,
    statusFilter,
    conditionFilter,
    approvalFilter,
    activeFilter,
    tableData,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / PAGE_SIZE)
  );

  const currentPage = Math.min(pageIndex, totalPages - 1);

  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedAsset?.id === onSaveAsset?.loadingId ||
      selectedAsset?.id === onDeactivateAsset?.loadingId ||
      selectedAsset?.id === onActivateAsset?.loadingId ||
      selectedAsset?.id === onApproveAsset?.loadingId ||
      selectedAsset?.id === onRejectAsset?.loadingId ||
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
    handleCloseModal();
  };

  const handleCreate = async (asset) => {
    await onCreateAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleApprove = async (asset) => {
    await onApproveAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleReject = async (asset) => {
    await onRejectAsset?.handler?.(asset);
    handleCloseModal();
  };

  const startRow =
    filteredData.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;

  const endRow = Math.min(
    (currentPage + 1) * PAGE_SIZE,
    filteredData.length
  );

  return (
    <>
      <Card
        flexDirection="column"
        w="100%"
        px="0px"
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          px="25px"
          pt="22px"
          pb="18px"
          justify="space-between"
          align={{ base: "stretch", lg: "center" }}
          direction={{ base: "column", lg: "row" }}
          gap="16px"
        >
          <Box>
            <Text
              color={textColor}
              fontSize="24px"
              fontWeight="700"
            >
              {title || "Quản lý tài sản số lượng"}
            </Text>

            <Text
              mt="6px"
              color="gray.500"
              fontSize="sm"
              maxW="900px"
            >
              {canManageAssets
                ? "Admin và manager có thể tạo hoặc chỉnh sửa tài sản. Chỉ admin mới được duyệt, từ chối hoặc vô hiệu hóa tài sản."
                : "Bạn đang ở chế độ chỉ xem."}
            </Text>
          </Box>

          {canManageAssets && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="14px"
              minW="190px"
              onClick={() => {
                setSelectedAsset(null);
                setModalMode("create");
                setIsModalOpen(true);
              }}
            >
              {addLabel}
            </Button>
          )}
        </Flex>

        {/* Filter */}
        <Flex
          px="25px"
          pb="20px"
          gap="12px"
          wrap="wrap"
          align="center"
        >
          <InputGroup maxW={{ base: "100%", md: "300px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>

            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên, mã, vị trí..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            maxW={{ base: "100%", md: "220px" }}
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
            maxW={{ base: "100%", md: "220px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="available">Có sẵn</option>
            <option value="in_use">Đang sử dụng</option>
            <option value="under_maintenance">Bảo trì</option>
            <option value="damaged">Hỏng</option>
            <option value="liquidated">Thanh lý</option>
          </Select>

          <Select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            maxW={{ base: "100%", md: "220px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả tình trạng</option>
            <option value="new">Mới</option>
            <option value="good">Tốt</option>
            <option value="fair">Khá</option>
            <option value="poor">Kém</option>
            <option value="broken">Hỏng</option>
          </Select>

          <Select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            maxW={{ base: "100%", md: "200px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="rejected">Không duyệt</option>
          </Select>

          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            maxW={{ base: "100%", md: "220px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả hoạt động</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </Select>
        </Flex>

        {/* Content */}
        <Box px="25px" pb="20px">
          {loading ? (
            <Flex justify="center" py="40px">
              <Spinner size="lg" />
            </Flex>
          ) : paginatedRows.length === 0 ? (
            <Text py="40px" textAlign="center" color="gray.500">
              Không có tài sản phù hợp.
            </Text>
          ) : (
            <SimpleGrid
              columns={{ base: 1, md: 2, xl: 3 }}
              spacing="18px"
            >
              {paginatedRows.map((row) => {
                const isPending = row.approval_status === "pending";

                return (
                  <Card
                    key={row.id}
                    role="group"
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    p="18px"
                    cursor="pointer"
                    transition="all 0.2s ease"
                    _hover={{
                      transform: "translateY(-3px)",
                      boxShadow: hoverShadow,
                    }}
                    onClick={() => handleRowClick(row)}
                  >
                    {/* top */}
                    <Flex
                      justify="space-between"
                      align="flex-start"
                      gap="12px"
                    >
                      <Box flex="1" minW="0">
                        <Text
                          color={textColor}
                          fontWeight="700"
                          fontSize="lg"
                          noOfLines={2}
                        >
                          {row.name || "-"}
                        </Text>

                        <Text
                          mt="4px"
                          fontSize="sm"
                          color="gray.500"
                          noOfLines={1}
                        >
                          {row.code || "-"}
                        </Text>

                        <Text
                          mt="2px"
                          fontSize="sm"
                          color="gray.500"
                          noOfLines={1}
                        >
                          {row.category || "-"}
                        </Text>
                      </Box>

                      <StatusBadge status={row.status} />
                    </Flex>

                    {/* badges */}
                    <Flex
                      mt="14px"
                      gap="10px"
                      wrap="wrap"
                      align="center"
                    >
                      <Badge
                        borderRadius="999px"
                        px="10px"
                        py="4px"
                        colorScheme="purple"
                      >
                        SL: {row.quantity ?? 0}
                      </Badge>

                      <ConditionBadge condition={row.condition} />

                      <UseFulLifeBadge
                        purchaseDate={row.purchase_date}
                        usefulLifeMonths={row.useful_life}
                      />

                      <ApprovalBadge
                        status={row.approval_status}
                      />

                      <ActiveBadge isActive={row.is_active} />
                    </Flex>

                    {/* info */}
                    <Box mt="14px">
                      <Text
                        fontSize="sm"
                        color={secondaryText}
                        noOfLines={1}
                      >
                        PB: {row.assigned_department || "-"}
                      </Text>

                      <Text
                        mt="6px"
                        fontSize="sm"
                        color={secondaryText}
                        noOfLines={1}
                      >
                        ND: {row.assigned_user || "-"}
                      </Text>

                      <Text
                        mt="6px"
                        fontSize="sm"
                        color={secondaryText}
                        noOfLines={1}
                      >
                        Vị trí: {row.location || "-"}
                      </Text>
                    </Box>

                    {/* hover detail */}
                    <Box
                      mt="14px"
                      pt="12px"
                      borderTop="1px solid"
                      borderColor={borderColor}
                    >
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        noOfLines={2}
                      >
                        {row.specification || "Không có thông số"}
                      </Text>

                      <Text
                        mt="8px"
                        fontSize="xs"
                        color="gray.500"
                      >
                        Cập nhật: {row.updated_at || "-"}
                      </Text>
                    </Box>

                    {/* actions */}
                    <Flex
                      mt="16px"
                      justify="space-between"
                      align="center"
                      gap="10px"
                    >
                      <Button
                        size="sm"
                        leftIcon={<ViewIcon />}
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row);
                        }}
                      >
                        Chi tiết
                      </Button>

                      {canDeactivateAssetByRole && isPending && (
                        <Flex gap="8px">
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<CheckIcon />}
                            isLoading={
                              row.id ===
                              onApproveAsset?.loadingId
                            }
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleApprove(row);
                            }}
                          >
                            Duyệt
                          </Button>

                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<CloseIcon />}
                            isLoading={
                              row.id ===
                              onRejectAsset?.loadingId
                            }
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleReject(row);
                            }}
                          >
                            Từ chối
                          </Button>
                        </Flex>
                      )}
                    </Flex>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Box>

        {/* pagination */}
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
              onClick={() =>
                setPageIndex((prev) => Math.max(prev - 1, 0))
              }
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
                setPageIndex((prev) =>
                  Math.min(prev + 1, totalPages - 1)
                )
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
            : Boolean(
              selectedAsset &&
              selectedAsset.id === onSaveAsset?.loadingId
            )
        }
        isDeactivating={Boolean(
          selectedAsset &&
          selectedAsset.id === onDeactivateAsset?.loadingId
        )}
        isActivating={Boolean(
          selectedAsset &&
          selectedAsset.id === onActivateAsset?.loadingId
        )}
        isApproving={Boolean(
          selectedAsset &&
          selectedAsset.id === onApproveAsset?.loadingId
        )}
        isRejecting={Boolean(
          selectedAsset &&
          selectedAsset.id === onRejectAsset?.loadingId
        )}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
        onApprove={handleApprove}
        onReject={handleReject}
        mode={modalMode}
        canManageAssets={canManageAssets}
        canDeactivateAssetByRole={canDeactivateAssetByRole}
        currentUserRole={currentUserRole}
      />
    </>
  );
}