import React from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";

import {
  EditIcon,
} from "@chakra-ui/icons";

import {
  createCategoryNeed,
  updateCategoryNeed,
  deleteCategoryNeed,
} from "api/categoryNeedsApi";

const TYPE_OPTIONS = [
  { value: "supply", label: "Vật tư (supply)" },
  { value: "asset", label: "Tài sản (asset)" },
];

const TYPE_BADGE_COLOR = {
  supply: "blue",
  asset: "purple",
};

const initialFormData = {
  category_code: "",
  category_name: "",
  category_type: "supply",
  description: "",
  note: "",
  is_active: true,
};

export default function CategoryModal(props) {
  const {
    category,
    departments,
    isOpen,
    isSubmitting,
    isDeleting,
    onClose,
    onDelete,
    onSave,
    onRefreshCategory,
    mode = "edit",
    canManageCategories = false,
    canDeleteCategoryByRole = false,
  } = props;

  const isCreateMode = mode === "create";

  const [isEditing, setIsEditing] = React.useState(isCreateMode);

  const modalBg = useColorModeValue("white", "navy.800");

  const readOnlyTextColor = useColorModeValue(
    "secondaryGray.900",
    "white"
  );

  const readOnlyBorderColor = useColorModeValue(
    "secondaryGray.100",
    "whiteAlpha.100"
  );

  const readOnlyBg = useColorModeValue(
    "secondaryGray.300",
    "navy.700"
  );

  const borderColor = useColorModeValue(
    "gray.200",
    "whiteAlpha.100"
  );

  const [formData, setFormData] = React.useState(initialFormData);

  const [needs, setNeeds] = React.useState([]);

  const [needDeptId, setNeedDeptId] = React.useState("");

  const [needQuantity, setNeedQuantity] = React.useState("");

  const [savingNeedId, setSavingNeedId] = React.useState(null);

  const [categoryDetailLoading, setCategoryDetailLoading] =
    React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isCreateMode) {
      setFormData(initialFormData);
      setNeeds([]);
      setIsEditing(true);
      return;
    }

    if (!category) return;

    setFormData({
      category_code: category.category_code || "",
      category_name: category.category_name || "",
      category_type: category.category_type || "supply",
      description: category.description || "",
      note: category.note || "",
      is_active: category.is_active ?? true,
    });

    setIsEditing(false);
  }, [category, isCreateMode, isOpen]);

  React.useEffect(() => {
    if (!isOpen || !category?.id || isCreateMode) return;

    if (!canManageCategories) return;

    (async () => {
      try {
        setCategoryDetailLoading(true);

        const detail = await onRefreshCategory?.(category.id);

        setNeeds(detail?.needs || []);
      } catch (err) {
        console.error("Load category detail failed:", err);
      } finally {
        setCategoryDetailLoading(false);
      }
    })();
  }, [
    isOpen,
    category?.id,
    isCreateMode,
    canManageCategories,
    onRefreshCategory,
  ]);

  React.useEffect(() => {
    if (!needDeptId) {
      setNeedQuantity("");
      return;
    }

    const existing = needs.find(
      (n) => String(n.department_id) === String(needDeptId)
    );

    setNeedQuantity(
      existing ? String(existing.require_quantity) : ""
    );
  }, [needDeptId, needs]);

  if (!isCreateMode && !category) return null;

  const isReadOnly =
    !isCreateMode &&
    (!isEditing || !canManageCategories);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: category.id }),

      category_code: formData.category_code.trim(),

      category_name: formData.category_name.trim(),

      category_type: formData.category_type,

      description: formData.description.trim() || null,

      note: formData.note.trim() || null,
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await onDelete?.(category);
  };

  const getDeptName = (deptId) => {
    const d = departments?.find(
      (de) => String(de.id) === String(deptId)
    );

    return d
      ? `${d.code} - ${d.name} `
      : deptId;
  };

  // =====================================================
  // SAVE CATEGORY NEED
  // =====================================================

  const handleSaveNeed = async () => {
    if (!needDeptId) return;

    const qty = parseInt(needQuantity, 10);

    if (isNaN(qty) || qty < 0) {
      return;
    }

    try {
      setSavingNeedId(needDeptId);

      const existing = needs.find(
        (n) =>
          String(n.department_id) ===
          String(needDeptId)
      );

      // =========================================
      // UPDATE EXISTING NEED
      // =========================================

      if (existing?.id) {
        await updateCategoryNeed(existing.id, {
          department_id: parseInt(
            needDeptId,
            10
          ),

          require_quantity: qty,

          detail: existing.detail || null,
        });
      }

      // =========================================
      // CREATE NEW NEED
      // =========================================

      else {
        await createCategoryNeed({
          category_id: category.id,

          department_id: parseInt(
            needDeptId,
            10
          ),

          require_quantity: qty,

          detail: null,
        });
      }

      // reload data

      const detail = await onRefreshCategory?.(
        category.id
      );

      setNeeds(detail?.needs || []);

      setNeedDeptId("");

      setNeedQuantity("");
    } catch (err) {
      console.error("Save need failed:", err);
    } finally {
      setSavingNeedId(null);
    }
  };

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />

      <ModalContent
        bg={modalBg}
        borderRadius="20px"
      >
        <ModalHeader>
          {isCreateMode
            ? "Thêm danh mục"
            : "Chi tiết danh mục"}
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          {isReadOnly ? (
            <Stack spacing="16px">
              <FormControl>
                <FormLabel>ID</FormLabel>

                <Input
                  value={category?.id || ""}
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Mã danh mục
                </FormLabel>

                <Input
                  value={
                    category?.category_code || ""
                  }
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Tên danh mục
                </FormLabel>

                <Input
                  value={
                    category?.category_name || ""
                  }
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Loại</FormLabel>

                <Input
                  value={
                    category?.category_type ===
                      "supply"
                      ? "Vật tư (supply)"
                      : "Tài sản (asset)"
                  }
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Mô tả</FormLabel>

                <Textarea
                  value={
                    category?.description || ""
                  }
                  resize="vertical"
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ghi chú</FormLabel>

                <Textarea
                  value={category?.note || ""}
                  resize="vertical"
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Trạng thái
                </FormLabel>

                <Input
                  value={
                    category?.is_active
                      ? "Hoạt động"
                      : "Không hoạt động"
                  }
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Thời gian tạo
                </FormLabel>

                <Input
                  value={
                    category?.created_at || ""
                  }
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Thời gian cập nhật gần nhất
                </FormLabel>

                <Input
                  value={
                    category?.updated_at || ""
                  }
                  {...readOnlyFieldProps}
                />
              </FormControl>

              {!canManageCategories ? (
                <Text
                  fontSize="sm"
                  color="gray.500"
                >
                  Tài khoản của bạn chỉ có
                  quyền xem danh mục.
                </Text>
              ) : null}
            </Stack>
          ) : (
            <Stack spacing="16px">
              {!category?.is_active &&
                !isCreateMode ? (
                <Badge
                  colorScheme="red"
                  borderRadius="999px"
                  px="12px"
                  py="6px"
                  w="fit-content"
                >
                  Danh mục này đang ở trạng
                  thái không hoạt động
                </Badge>
              ) : null}

              <FormControl isRequired>
                <FormLabel>
                  Mã danh mục
                </FormLabel>

                <Input
                  value={formData.category_code}
                  onChange={(e) =>
                    handleChange(
                      "category_code",
                      e.target.value
                    )
                  }
                  placeholder="VD: CAT001"
                  maxLength={50}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  Tên danh mục
                </FormLabel>

                <Input
                  value={formData.category_name}
                  onChange={(e) =>
                    handleChange(
                      "category_name",
                      e.target.value
                    )
                  }
                  placeholder="VD: Laptop"
                  maxLength={100}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  Loại danh mục
                </FormLabel>

                <Stack
                  direction="row"
                  spacing="12px"
                  pt="4px"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <Badge
                      key={opt.value}
                      colorScheme={
                        TYPE_BADGE_COLOR[
                        opt.value
                        ]
                      }
                      borderRadius="999px"
                      px="16px"
                      py="8px"
                      fontSize="sm"
                      cursor="pointer"
                      opacity={
                        formData.category_type ===
                          opt.value
                          ? 1
                          : 0.5
                      }
                      onClick={() =>
                        handleChange(
                          "category_type",
                          opt.value
                        )
                      }
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Stack>
              </FormControl>

              <FormControl>
                <FormLabel>Mô tả</FormLabel>

                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleChange(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Mô tả ngắn"
                  resize="vertical"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ghi chú</FormLabel>

                <Textarea
                  value={formData.note}
                  onChange={(e) =>
                    handleChange(
                      "note",
                      e.target.value
                    )
                  }
                  placeholder="Ghi chú"
                  resize="vertical"
                />
              </FormControl>
            </Stack>
          )}

          {!isCreateMode &&
            canManageCategories && (
              <>
                <Divider my="20px" />

                <Box>
                  <Text
                    fontSize="md"
                    fontWeight="600"
                    mb="12px"
                  >
                    Nhu cầu theo phòng ban
                  </Text>

                  <Text
                    fontSize="sm"
                    color="gray.500"
                    mb="14px"
                  >
                    Chọn phòng ban và nhập số
                    lượng cần thiết.
                  </Text>

                  <Stack
                    spacing="12px"
                    mb="16px"
                  >
                    <HStack
                      spacing="12px"
                      align="flex-start"
                    >
                      <FormControl flex="1">
                        <FormLabel fontSize="sm">
                          Phòng ban
                        </FormLabel>

                        <Box
                          as="select"
                          w="100%"
                          px="12px"
                          py="7px"
                          borderRadius="12px"
                          border="1px solid"
                          borderColor={
                            borderColor
                          }
                          bg={readOnlyBg}
                          color={readOnlyTextColor}
                          value={needDeptId}
                          onChange={(e) =>
                            setNeedDeptId(
                              e.target.value
                            )
                          }
                          cursor="pointer"
                        >
                          <option value="">
                            -- Chọn phòng ban --
                          </option>

                          {departments?.map(
                            (d) => (
                              <option
                                key={d.id}
                                value={String(
                                  d.id
                                )}
                              >
                                {d.code} -{" "}
                                {d.name}
                              </option>
                            )
                          )}
                        </Box>
                      </FormControl>

                      <FormControl flex="1">
                        <FormLabel fontSize="sm">
                          Số lượng cần
                        </FormLabel>

                        <Input
                          type="number"
                          min="0"
                          placeholder="VD: 10"
                          value={needQuantity}
                          onChange={(e) =>
                            setNeedQuantity(
                              e.target.value
                            )
                          }
                        />
                      </FormControl>

                      <Box pt="22px">
                        <Button
                          colorScheme="blue"
                          size="sm"
                          leftIcon={
                            <EditIcon />
                          }
                          isDisabled={
                            !needDeptId ||
                            needQuantity === ""
                          }
                          isLoading={
                            savingNeedId !==
                            null
                          }
                          onClick={
                            handleSaveNeed
                          }
                        >
                          Lưu
                        </Button>
                      </Box>
                    </HStack>
                  </Stack>

                  <Box
                    overflowX="auto"
                    borderRadius="12px"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Table
                      variant="simple"
                      size="sm"
                    >
                      <Thead>
                        <Tr>
                          <Th
                            borderColor={
                              borderColor
                            }
                          >
                            STT
                          </Th>

                          <Th
                            borderColor={
                              borderColor
                            }
                          >
                            Phòng ban
                          </Th>

                          <Th
                            borderColor={
                              borderColor
                            }
                            isNumeric
                          >
                            Số lượng cần
                          </Th>
                        </Tr>
                      </Thead>

                      <Tbody>
                        {categoryDetailLoading ? (
                          <Tr>
                            <Td
                              colSpan={3}
                              borderColor={
                                borderColor
                              }
                              textAlign="center"
                              py="16px"
                              color="gray.500"
                            >
                              Đang tải...
                            </Td>
                          </Tr>
                        ) : needs.length ===
                          0 ? (
                          <Tr>
                            <Td
                              colSpan={3}
                              borderColor={
                                borderColor
                              }
                              textAlign="center"
                              py="16px"
                              color="gray.500"
                            >
                              Chưa có nhu cầu
                              nào cho danh mục
                              này.
                            </Td>
                          </Tr>
                        ) : (
                          needs.map(
                            (n, idx) => (
                              <Tr
                                key={
                                  n.id || idx
                                }
                              >
                                <Td
                                  borderColor={
                                    borderColor
                                  }
                                >
                                  {idx + 1}
                                </Td>

                                <Td
                                  borderColor={
                                    borderColor
                                  }
                                >
                                  {getDeptName(
                                    n.department_id
                                  )}
                                </Td>

                                <Td
                                  borderColor={
                                    borderColor
                                  }
                                  isNumeric
                                >
                                  {
                                    n.require_quantity
                                  }
                                </Td>
                              </Tr>
                            )
                          )
                        )}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </>
            )}
        </ModalBody>

        <ModalFooter
          gap="12px"
          flexWrap="wrap"
        >
          {isCreateMode ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Hủy
              </Button>

              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={isSubmitting}
              >
                Lưu
              </Button>
            </>
          ) : isReadOnly ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Đóng
              </Button>

              {canManageCategories ? (
                <Button
                  colorScheme="blue"
                  onClick={() =>
                    setIsEditing(true)
                  }
                >
                  Sửa
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  setIsEditing(false)
                }
              >
                Hủy
              </Button>

              {canDeleteCategoryByRole &&
                category?.is_active ? (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Xóa danh mục
                </Button>
              ) : null}

              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={isSubmitting}
              >
                Lưu
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

