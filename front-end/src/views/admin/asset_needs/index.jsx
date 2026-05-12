/*! =========================================================
* Horizon UI - Asset Needs
========================================================= */

import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  Switch,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalFooter,
  Stack,
  Textarea,
  Spinner,
} from "@chakra-ui/react";

import {
  SearchIcon,
  AddIcon,
  DeleteIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  ArrowForwardIcon,
  WarningIcon,
} from "@chakra-ui/icons";

import { useNavigate } from "react-router-dom";

import Card from "components/card/Card";

import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";

import {
  listCategoryNeeds,
  createCategoryNeed,
  updateCategoryNeed,
  deleteCategoryNeed,
  submitCategoryNeed,
  approveCategoryNeed,
  rejectCategoryNeed,
  cancelCategoryNeed,
} from "api/categoryNeedsApi";

import { listCategories } from "api/categoriesApi";
import { listDepartments } from "api/departmentsApi";

import { listAssetsByCategory } from "api/quantityAssetsApi";

const PAGE_SIZE = 10;

const TYPE_BADGE_COLOR = {
  supply: "blue",
  asset: "purple",
};

const TYPE_LABEL = {
  supply: "Vật tư",
  asset: "Tài sản",
};

const initialForm = {
  category_id: "",
  asset_quantity_id: "",
  department_id: "",
  require_quantity: "",
  detail: "",
  is_active: true,
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

const WORKFLOW_STATUS_COLOR = {
  draft: "gray",
  submitted: "blue",
  approved: "green",
  rejected: "red",
  cancelled: "orange",
};

const WORKFLOW_STATUS_LABEL = {
  draft: "Nháp",
  submitted: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

function WorkflowBadge({ status }) {
  return (
    <Badge
      colorScheme={WORKFLOW_STATUS_COLOR[status] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {WORKFLOW_STATUS_LABEL[status] || status}
    </Badge>
  );
}

export default function AssetNeeds() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = React.useState(true);

  const [needs, setNeeds] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);

  const [assetsByCategory, setAssetsByCategory] = React.useState([]);
  const [loadingAssets, setLoadingAssets] = React.useState(false);

  const [currentUserRole, setCurrentUserRole] = React.useState("");
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const [currentUserDepartmentId, setCurrentUserDepartmentId] = React.useState(null);

  const [keyword, setKeyword] = React.useState("");

  const [deptFilter, setDeptFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");

  const [showAll, setShowAll] = React.useState(false);

  const [pageIndex, setPageIndex] = React.useState(0);

  const [creating, setCreating] = React.useState(false);
  const [savingId, setSavingId] = React.useState(null);
  const [deletingId, setDeletingId] = React.useState(null);
  
  // Workflow states
  const [actionLoadingId, setActionLoadingId] = React.useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [selectedNeed, setSelectedNeed] = React.useState(null);

  const [editingNeed, setEditingNeed] = React.useState(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [modalMode, setModalMode] = React.useState("create");

  const [formData, setFormData] = React.useState(initialForm);

  const canManage =
    currentUserRole === "admin" ||
    currentUserRole === "manager";

  const textColor = useColorModeValue(
    "secondaryGray.900",
    "white"
  );

  const borderColor = useColorModeValue(
    "gray.200",
    "whiteAlpha.100"
  );

  const rowHoverBg = useColorModeValue(
    "gray.100",
    "whiteAlpha.100"
  );

  const searchIconColor = useColorModeValue(
    "gray.400",
    "gray.300"
  );

  const searchInputBg = useColorModeValue(
    "secondaryGray.300",
    "navy.900"
  );

  const searchInputColor = useColorModeValue(
    "gray.700",
    "gray.100"
  );

  const handleUnauthorized = React.useCallback(() => {
    logout();

    toast({
      title: "Phiên đăng nhập đã hết hạn",
      description: "Vui lòng đăng nhập lại.",
      status: "warning",
      duration: 2500,
      isClosable: true,
    });

    navigate("/auth/sign-in", { replace: true });
  }, [navigate, toast]);

  const fetchNeeds = React.useCallback(async (params = {}) => {
    const data = await listCategoryNeeds(params);
    return Array.isArray(data) ? data : [];
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);

      const [profile, cats, depts] = await Promise.all([
        getCurrentUser(),
        listCategories({ limit: 500 }),
        listDepartments({ limit: 500, is_active: true }),
      ]);

      setCurrentUserRole(profile?.role || "");
      setCurrentUserId(profile?.id || null);
      setCurrentUserDepartmentId(profile?.department_id || null);

      setCategories(Array.isArray(cats) ? cats : []);
      setDepartments(Array.isArray(depts) ? depts : []);
    } catch (error) {
      console.error(error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được dữ liệu",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, toast]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  React.useEffect(() => {
    const params = {};

    if (!showAll && deptFilter) {
      params.department_id = parseInt(deptFilter, 10);
    }

    if (categoryFilter) {
      params.category_id = parseInt(categoryFilter, 10);
    }

    (async () => {
      try {
        setLoading(true);

        const data = await fetchNeeds(params);

        setNeeds(data);
      } catch (error) {
        console.error(error);

        toast({
          title: "Không tải được dữ liệu",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [
    showAll,
    deptFilter,
    categoryFilter,
    fetchNeeds,
    toast,
  ]);

  const filteredData = React.useMemo(() => {
    if (!keyword.trim()) return needs;

    const kw = keyword.trim().toLowerCase();

    return needs.filter((item) =>
      [
        item.category_name,
        item.department_name,
        item.category_code,
        item.department_code,
        item.asset_quantity_name,
      ]
        .filter(Boolean)
        .some((v) =>
          String(v).toLowerCase().includes(kw)
        )
    );
  }, [needs, keyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / PAGE_SIZE)
  );

  const currentPage = Math.min(
    pageIndex,
    totalPages - 1
  );

  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleOpenCreate = () => {
    setModalMode("create");

    setEditingNeed(null);

    setFormData({
      ...initialForm,
      department_id: deptFilter || "",
    });

    setAssetsByCategory([]);

    setIsModalOpen(true);
  };

  const handleOpenEdit = async (need) => {
    setModalMode("edit");

    setEditingNeed(need);

    setFormData({
      category_id: String(need.category_id || ""),
      asset_quantity_id: String(
        need.asset_quantity_id || ""
      ),
      department_id: String(
        need.department_id || ""
      ),
      require_quantity: String(
        need.require_quantity || 0
      ),
      detail: need.detail || "",
      is_active: need.is_active ?? true,
    });

    setIsModalOpen(true);

    if (need.category_id) {
      await loadAssetsByCategory(need.category_id);
    }
  };

  const handleCloseModal = () => {
    setEditingNeed(null);

    setAssetsByCategory([]);

    setFormData(initialForm);

    setIsModalOpen(false);
  };

  const loadAssetsByCategory = async (
    categoryId
  ) => {
    try {
      setLoadingAssets(true);

      const data = await listAssetsByCategory(
        categoryId
      );

      setAssetsByCategory(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);

      toast({
        title:
          "Không tải được tài sản theo danh mục",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleCategoryChange = async (value) => {
    setFormData((prev) => ({
      ...prev,
      category_id: value,
      asset_quantity_id: "",
    }));

    if (!value) {
      setAssetsByCategory([]);
      return;
    }

    await loadAssetsByCategory(value);
  };

  const reloadNeeds = async () => {
    const params = {};

    if (!showAll && deptFilter) {
      params.department_id = parseInt(
        deptFilter,
        10
      );
    }

    if (categoryFilter) {
      params.category_id = parseInt(
        categoryFilter,
        10
      );
    }

    const data = await fetchNeeds(params);

    setNeeds(data);
  };

  const handleCreate = async () => {
    try {
      const qty = parseInt(
        formData.require_quantity,
        10
      );

      if (!formData.category_id) {
        toast({
          title: "Vui lòng chọn danh mục",
          status: "warning",
          duration: 2500,
          isClosable: true,
        });

        return;
      }

      if (!formData.asset_quantity_id) {
        toast({
          title: "Vui lòng chọn tài sản",
          status: "warning",
          duration: 2500,
          isClosable: true,
        });

        return;
      }

      if (isNaN(qty) || qty < 0) {
        toast({
          title: "Số lượng không hợp lệ",
          status: "warning",
          duration: 2500,
          isClosable: true,
        });

        return;
      }

      setCreating(true);

      await createCategoryNeed({
        category_id: parseInt(
          formData.category_id,
          10
        ),
        asset_quantity_id: parseInt(
          formData.asset_quantity_id,
          10
        ),
        department_id: formData.department_id
          ? parseInt(formData.department_id, 10)
          : null,
        require_quantity: qty,
        detail: formData.detail || null,
      });

      await reloadNeeds();

      toast({
        title: "Tạo nhu cầu thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
    } catch (error) {
      console.error(error);

      toast({
        title: "Tạo thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const qty = parseInt(
        formData.require_quantity,
        10
      );

      if (isNaN(qty) || qty < 0) {
        toast({
          title: "Số lượng không hợp lệ",
          status: "warning",
          duration: 2500,
          isClosable: true,
        });

        return;
      }

      setSavingId(editingNeed.id);

      await updateCategoryNeed(editingNeed.id, {
        asset_quantity_id: parseInt(
          formData.asset_quantity_id,
          10
        ),
        department_id: formData.department_id
          ? parseInt(formData.department_id, 10)
          : null,
        require_quantity: qty,
        detail: formData.detail || null,
        is_active: formData.is_active,
      });

      await reloadNeeds();

      toast({
        title: "Cập nhật thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      handleCloseModal();
    } catch (error) {
      console.error(error);

      toast({
        title: "Cập nhật thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (need) => {
    try {
      setDeletingId(need.id);

      await deleteCategoryNeed(need.id);

      await reloadNeeds();

      toast({
        title: "Xóa thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error(error);

      toast({
        title: "Xóa thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (need) => {
    try {
      setActionLoadingId(need.id);
      await submitCategoryNeed(need.id);
      await reloadNeeds();
      toast({
        title: "Gửi duyệt thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Gửi duyệt thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = async (need) => {
    try {
      setActionLoadingId(need.id);
      await approveCategoryNeed(need.id);
      await reloadNeeds();
      toast({
        title: "Phê duyệt thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Phê duyệt thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (need) => {
    setSelectedNeed(need);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleCloseReject = () => {
    setSelectedNeed(null);
    setRejectReason("");
    setIsRejectModalOpen(false);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Vui lòng nhập lý do từ chối",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    try {
      setActionLoadingId(selectedNeed.id);
      await rejectCategoryNeed(selectedNeed.id, rejectReason.trim());
      await reloadNeeds();
      toast({
        title: "Đã từ chối phiếu",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      handleCloseReject();
    } catch (error) {
      toast({
        title: "Từ chối thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (need) => {
    try {
      setActionLoadingId(need.id);
      await cancelCategoryNeed(need.id);
      await reloadNeeds();
      toast({
        title: "Đã hủy phiếu",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Hủy phiếu thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px" }}>
      <Card
        flexDirection="column"
        w="100%"
        px="0px"
        overflowX="auto"
      >
        <Flex
          px="25px"
          pt="20px"
          pb="16px"
          justify="space-between"
          align={{
            base: "stretch",
            md: "center",
          }}
          direction={{
            base: "column",
            md: "row",
          }}
          gap="12px"
        >
          <Box>
            <Text
              color={textColor}
              fontSize="22px"
              fontWeight="700"
            >
              Nhu cầu tài sản
            </Text>

            <Text
              mt="4px"
              color="gray.500"
              fontSize="sm"
            >
              Quản lý nhu cầu theo danh mục và
              tài sản cụ thể.
            </Text>
          </Box>

          {canManage && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={handleOpenCreate}
            >
              Thêm nhu cầu
            </Button>
          )}
        </Flex>

        <Flex
          px="25px"
          pb="18px"
          gap="12px"
          wrap="wrap"
          align="center"
        >
          <FormControl
            display="flex"
            alignItems="center"
            w="auto"
          >
            <Switch
              isChecked={showAll}
              onChange={(e) => {
                setShowAll(e.target.checked);
                setDeptFilter("");
              }}
              mr="8px"
            />

            <FormLabel mb="0">
              Tất cả phòng ban
            </FormLabel>
          </FormControl>

          <Select
            value={deptFilter}
            onChange={(e) =>
              setDeptFilter(e.target.value)
            }
            maxW="250px"
            placeholder="Chọn phòng ban"
            isDisabled={showAll}
          >
            {departments.map((d) => (
              <option
                key={d.id}
                value={String(d.id)}
              >
                {d.code} - {d.name}
              </option>
            ))}
          </Select>

          <Select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            maxW="250px"
            placeholder="Tất cả danh mục"
          >
            {categories.map((c) => (
              <option
                key={c.id}
                value={String(c.id)}
              >
                {c.category_name}
              </option>
            ))}
          </Select>

          <InputGroup
            maxW={{ base: "100%", md: "280px" }}
            ml="auto"
          >
            <InputLeftElement pointerEvents="none">
              <SearchIcon
                color={searchIconColor}
              />
            </InputLeftElement>

            <Input
              value={keyword}
              onChange={(e) =>
                setKeyword(e.target.value)
              }
              placeholder="Tìm kiếm..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
            />
          </InputGroup>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>STT</Th>
                <Th>Phòng ban</Th>
                <Th>Danh mục</Th>
                <Th>Tài sản</Th>
                <Th>Loại</Th>
                <Th isNumeric>Hiện có</Th>
                <Th isNumeric>Nhu cầu</Th>
                <Th>Trạng thái duyệt</Th>

                {canManage && (
                  <Th>Thao tác</Th>
                )}
              </Tr>
            </Thead>

            <Tbody>
              {loading ? (
                <Tr>
                  <Td
                    colSpan={9}
                    textAlign="center"
                    py="30px"
                  >
                    <Spinner />
                  </Td>
                </Tr>
              ) : paginatedRows.length === 0 ? (
                <Tr>
                  <Td
                    colSpan={9}
                    textAlign="center"
                    py="30px"
                    color="gray.500"
                  >
                    Không có dữ liệu
                  </Td>
                </Tr>
              ) : (
                paginatedRows.map(
                  (row, index) => (
                    <Tr
                      key={row.id}
                      _hover={{
                        bg: rowHoverBg,
                      }}
                    >
                      <Td>
                        {index + 1}
                      </Td>

                      <Td>
                        {row.department_name ||
                          "—"}
                      </Td>

                      <Td>
                        {row.category_name}
                      </Td>

                      <Td>
                        {row.asset_quantity_name ||
                          "—"}
                      </Td>

                      <Td>
                        <TypeBadge
                          type={
                            row.category_type
                          }
                        />
                      </Td>

                      <Td isNumeric>
                        {row.current_quantity ??
                          0}
                      </Td>

                      <Td
                        isNumeric
                        fontWeight="700"
                      >
                        {
                          row.require_quantity
                        }
                      </Td>

                      <Td>
                        <WorkflowBadge status={row.status} />
                        {row.status === "rejected" && row.rejected_reason && (
                          <Text color="red.500" fontSize="xs" mt="1" maxW="150px" noOfLines={2} title={row.rejected_reason}>
                            Lý do: {row.rejected_reason}
                          </Text>
                        )}
                      </Td>

                      {canManage && (
                        <Td>
                          <HStack flexWrap="wrap" gap="2" minW="150px">
                            {/* Admin & Manager can edit/delete IF draft (Manager only if owner) */}
                            {row.status === "draft" &&
                              (currentUserRole === "admin" ||
                                (currentUserRole === "manager" && row.created_by_user_id === currentUserId)) && (
                                <>
                                  <Button
                                    size="xs"
                                    leftIcon={<EditIcon />}
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => handleOpenEdit(row)}
                                  >
                                    Sửa
                                  </Button>

                                  <Button
                                    size="xs"
                                    leftIcon={<DeleteIcon />}
                                    colorScheme="red"
                                    variant="ghost"
                                    isLoading={deletingId === row.id}
                                    onClick={() => handleDelete(row)}
                                  >
                                    Xóa
                                  </Button>
                                </>
                              )}

                            {/* Manager can Submit IF draft & owner */}
                            {row.status === "draft" &&
                              currentUserRole === "manager" &&
                              row.created_by_user_id === currentUserId && (
                                <Button
                                  size="xs"
                                  leftIcon={<ArrowForwardIcon />}
                                  colorScheme="blue"
                                  isLoading={actionLoadingId === row.id}
                                  onClick={() => handleSubmit(row)}
                                >
                                  Gửi duyệt
                                </Button>
                              )}

                            {/* Admin can Approve/Reject IF submitted */}
                            {row.status === "submitted" && currentUserRole === "admin" && (
                              <>
                                <Button
                                  size="xs"
                                  leftIcon={<CheckIcon />}
                                  colorScheme="green"
                                  isLoading={actionLoadingId === row.id}
                                  onClick={() => handleApprove(row)}
                                >
                                  Duyệt
                                </Button>
                                <Button
                                  size="xs"
                                  leftIcon={<CloseIcon />}
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => handleOpenReject(row)}
                                >
                                  Từ chối
                                </Button>
                              </>
                            )}

                            {/* Admin can Cancel IF draft/submitted. Manager can Cancel IF owner & draft/submitted */}
                            {(row.status === "draft" || row.status === "submitted") &&
                              (currentUserRole === "admin" ||
                                (currentUserRole === "manager" && row.created_by_user_id === currentUserId)) && (
                                <Button
                                  size="xs"
                                  leftIcon={<WarningIcon />}
                                  colorScheme="orange"
                                  variant="ghost"
                                  isLoading={actionLoadingId === row.id}
                                  onClick={() => handleCancel(row)}
                                >
                                  Hủy
                                </Button>
                              )}
                          </HStack>
                        </Td>
                      )}
                    </Tr>
                  )
                )
              )}
            </Tbody>
          </Table>
        </Box>

        <Flex
          px="25px"
          py="18px"
          justify="space-between"
          align="center"
        >
          <Text
            fontSize="sm"
            color="gray.500"
          >
            Tổng: {filteredData.length} bản
            ghi
          </Text>

          <HStack>
            <Button
              variant="outline"
              onClick={() =>
                setPageIndex((p) =>
                  Math.max(p - 1, 0)
                )
              }
              isDisabled={currentPage === 0}
            >
              Trước
            </Button>

            <Button
              variant="ghost"
              isDisabled
            >
              Trang {currentPage + 1} /{" "}
              {totalPages}
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                setPageIndex((p) =>
                  Math.min(
                    p + 1,
                    totalPages - 1
                  )
                )
              }
              isDisabled={
                currentPage >=
                totalPages - 1
              }
            >
              Tiếp
            </Button>
          </HStack>
        </Flex>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isCentered
        size="lg"
      >
        <ModalOverlay />

        <ModalContent borderRadius="20px">
          <ModalHeader>
            {modalMode === "create"
              ? "Thêm nhu cầu"
              : "Cập nhật nhu cầu"}
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody>
            <Stack spacing="16px">
              <FormControl isRequired>
                <FormLabel>
                  Danh mục
                </FormLabel>

                <Select
                  value={
                    formData.category_id
                  }
                  onChange={(e) =>
                    handleCategoryChange(
                      e.target.value
                    )
                  }
                  placeholder="Chọn danh mục"
                  borderRadius="12px"
                >
                  {categories.map((c) => (
                    <option
                      key={c.id}
                      value={String(c.id)}
                    >
                      {c.category_code} —{" "}
                      {c.category_name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  Tài sản
                </FormLabel>

                <Select
                  value={
                    formData.asset_quantity_id
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      asset_quantity_id:
                        e.target.value,
                    }))
                  }
                  placeholder={
                    loadingAssets
                      ? "Đang tải..."
                      : "Chọn tài sản"
                  }
                  borderRadius="12px"
                  isDisabled={
                    !formData.category_id ||
                    loadingAssets
                  }
                >
                  {assetsByCategory.map(
                    (asset) => (
                      <option
                        key={asset.id}
                        value={String(
                          asset.id
                        )}
                      >
                        {asset.code} —{" "}
                        {asset.name}
                      </option>
                    )
                  )}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Phòng ban
                </FormLabel>

                <Select
                  value={
                    formData.department_id
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department_id:
                        e.target.value,
                    }))
                  }
                  placeholder="Chọn phòng ban"
                  borderRadius="12px"
                  isDisabled={currentUserRole === "manager"}
                >
                  {departments.map((d) => (
                    <option
                      key={d.id}
                      value={String(d.id)}
                    >
                      {d.code} — {d.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  Số lượng cần
                </FormLabel>

                <Input
                  type="number"
                  min="0"
                  value={
                    formData.require_quantity
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      require_quantity:
                        e.target.value,
                    }))
                  }
                  borderRadius="12px"
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Ghi chú
                </FormLabel>

                <Textarea
                  value={formData.detail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      detail:
                        e.target.value,
                    }))
                  }
                  borderRadius="12px"
                />
              </FormControl>

              {modalMode === "edit" && (
                <FormControl
                  display="flex"
                  alignItems="center"
                >
                  <FormLabel mb="0">
                    Hoạt động
                  </FormLabel>

                  <Switch
                    colorScheme="green"
                    isChecked={
                      formData.is_active
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active:
                          e.target.checked,
                      }))
                    }
                  />
                </FormControl>
              )}
            </Stack>
          </ModalBody>

          <ModalFooter gap="12px">
            <Button
              variant="outline"
              onClick={handleCloseModal}
            >
              Hủy
            </Button>

            <Button
              colorScheme="blue"
              isLoading={
                modalMode === "create"
                  ? creating
                  : savingId !== null
              }
              onClick={
                modalMode === "create"
                  ? handleCreate
                  : handleSaveEdit
              }
            >
              Lưu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* REJECT MODAL */}
      <Modal isOpen={isRejectModalOpen} onClose={handleCloseReject} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          <ModalHeader>Lý do từ chối</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Nhập lý do từ chối yêu cầu này</FormLabel>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Vật tư hiện đã hết hàng..."
                rows={4}
                borderRadius="12px"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap="12px">
            <Button variant="outline" onClick={handleCloseReject}>
              Hủy
            </Button>
            <Button
              colorScheme="red"
              isLoading={actionLoadingId === selectedNeed?.id}
              onClick={handleConfirmReject}
            >
              Từ chối phiếu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}