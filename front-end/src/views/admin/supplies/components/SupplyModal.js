import React from "react";
import {
  Badge,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";

const initialFormData = {
  code: "",
  name: "",
  category_id: "",
  unit: "item",
  quantity_in_stock: "0",
  minimum_stock_level: "0",
  unit_price: "",
  location: "",
  description: "",
  note: "",
  managed_department_id: "",
  is_active: true,
};

const initialStockForm = {
  quantity_change: "",
  note: "",
};

function isLowStock(quantityInStock, minimumStockLevel) {
  const stock = Number(quantityInStock || 0);
  const min = Number(minimumStockLevel || 0);
  return Number.isFinite(stock) && Number.isFinite(min) && stock <= min;
}

export default function SupplyModal(props) {
  const {
    supply,
    departmentOptions = [],
    categoryOptions = [],
    isOpen,
    isSubmitting,
    isDeactivating,
    isActivating,
    isUpdatingStock,
    onClose,
    onDeactivate,
    onActivate,
    onSave,
    onUpdateStock,
    mode = "edit",
    canManageSupplies = false,
    canUpdateStock = false,
    canDeactivateSupplyByRole = false,
  } = props;

  const isCreateMode = mode === "create";
  const [isEditing, setIsEditing] = React.useState(isCreateMode);

  const modalBg = useColorModeValue("white", "navy.800");
  const readOnlyTextColor = useColorModeValue("secondaryGray.900", "white");
  const readOnlyBorderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  const readOnlyBg = useColorModeValue("secondaryGray.300", "navy.700");
  const sectionBorderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const [formData, setFormData] = React.useState(initialFormData);
  const [stockForm, setStockForm] = React.useState(initialStockForm);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isCreateMode) {
      setFormData(initialFormData);
      setStockForm(initialStockForm);
      setIsEditing(true);
      return;
    }

    if (!supply) return;

    setFormData({
      code: supply.code || "",
      name: supply.name || "",
      category_id: supply.category_id ? String(supply.category_id) : "",
      unit: supply.unit || "item",
      quantity_in_stock: supply.quantity_in_stock || "0",
      minimum_stock_level: supply.minimum_stock_level || "0",
      unit_price: supply.unit_price || "",
      location: supply.location || "",
      description: supply.description || "",
      note: supply.note || "",
      managed_department_id: supply.managed_department_id ?? "",
      is_active: supply.is_active ?? false,
    });

    setStockForm({
      quantity_change: "",
      note: supply.note || "",
    });

    setIsEditing(false);
  }, [isCreateMode, isOpen, supply]);

  if (!isCreateMode && !supply) return null;

  const isReadOnly = !isCreateMode && (!isEditing || !canManageSupplies);
  const lowStock = isLowStock(
    formData.quantity_in_stock,
    formData.minimum_stock_level
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStockChange = (field, value) => {
    setStockForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: supply.id }),
      code: formData.code,
      name: formData.name,
      category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
      unit: formData.unit,
      quantity_in_stock: formData.quantity_in_stock,
      minimum_stock_level: formData.minimum_stock_level,
      unit_price: formData.unit_price,
      location: formData.location,
      description: formData.description,
      note: formData.note,
      managed_department_id: formData.managed_department_id,
      is_active: formData.is_active,
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  const handleSubmitStock = async () => {
    await onUpdateStock?.({
      id: supply.id,
      quantity_change: stockForm.quantity_change,
      note: stockForm.note,
    });

    setStockForm((prev) => ({
      ...prev,
      quantity_change: "",
    }));
  };

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="20px">
        <ModalHeader>
          {isCreateMode ? "Thêm vật tư" : "Chi tiết vật tư"}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Stack spacing="16px">
            {!isCreateMode && lowStock ? (
              <Badge colorScheme="red" borderRadius="999px" px="12px" py="6px" w="fit-content">
                Vật tư này đang ở mức tồn kho thấp
              </Badge>
            ) : null}

            {!isCreateMode && !formData.is_active ? (
              <Badge colorScheme="gray" borderRadius="999px" px="12px" py="6px" w="fit-content">
                Vật tư này đang ở trạng thái không hoạt động
              </Badge>
            ) : null}

            {isReadOnly ? (
              <>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                  <GridItem>
                    <FormControl>
                      <FormLabel>ID</FormLabel>
                      <Input value={supply?.id || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Trạng thái hoạt động</FormLabel>
                      <Input
                        value={supply?.is_active ? "Hoạt động" : "Không hoạt động"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Mã</FormLabel>
                      <Input value={supply?.code || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Tên</FormLabel>
                      <Input value={supply?.name || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Danh mục</FormLabel>
                      <Input value={supply?.category || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Đơn vị</FormLabel>
                      <Input value={supply?.unit || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Số lượng trong kho</FormLabel>
                      <Input value={supply?.quantity_in_stock || "0"} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Mức tồn kho tối thiểu</FormLabel>
                      <Input value={supply?.minimum_stock_level || "0"} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Đơn giá</FormLabel>
                      <Input value={supply?.unit_price || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Phòng ban phụ trách</FormLabel>
                      <Input value={supply?.managed_department || "-"} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Vị trí</FormLabel>
                      <Input value={supply?.location || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Thời gian tạo</FormLabel>
                      <Input value={supply?.created_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Thời gian cập nhật gần nhất</FormLabel>
                      <Input value={supply?.updated_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl>
                  <FormLabel>Mô tả</FormLabel>
                  <Textarea
                    value={supply?.description || ""}
                    resize="vertical"
                    {...readOnlyFieldProps}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ghi chú</FormLabel>
                  <Textarea
                    value={supply?.note || ""}
                    resize="vertical"
                    {...readOnlyFieldProps}
                  />
                </FormControl>
              </>
            ) : (
              <>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Mã </FormLabel>
                      <Input
                        value={formData.code}
                        onChange={(e) => handleChange("code", e.target.value)}
                        placeholder="VD: SP-001"
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Tên</FormLabel>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Nhập tên vật tư"
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Danh mục</FormLabel>
                      <Select
                        value={formData.category_id}
                        onChange={(e) => handleChange("category_id", e.target.value)}
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Đơn vị</FormLabel>
                      <Input
                        value={formData.unit}
                        onChange={(e) => handleChange("unit", e.target.value)}
                        placeholder="item"
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Số lượng trong kho</FormLabel>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.quantity_in_stock}
                        onChange={(e) =>
                          handleChange("quantity_in_stock", e.target.value)
                        }
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Mức tồn kho tối thiểu</FormLabel>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.minimum_stock_level}
                        onChange={(e) =>
                          handleChange("minimum_stock_level", e.target.value)
                        }
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Đơn giá</FormLabel>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => handleChange("unit_price", e.target.value)}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Phòng ban quản lý</FormLabel>
                      <Select
                        value={formData.managed_department_id}
                        onChange={(e) =>
                          handleChange("managed_department_id", e.target.value)
                        }
                      >
                        <option value="">Chưa giao phòng ban</option>
                        {departmentOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Vị trí</FormLabel>
                      <Input
                        value={formData.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                      />
                    </FormControl>
                  </GridItem>

                  {!isCreateMode ? (
                    <GridItem>
                      <FormControl>
                        <FormLabel>Trạng thái hoạt động</FormLabel>
                        <Input value={supply?.is_active ? "Hoạt động" : "Không hoạt động"} readOnly />
                      </FormControl>
                    </GridItem>
                  ) : null}
                </Grid>

                <FormControl>
                  <FormLabel>Mô tả</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Mô tả vật tư"
                    resize="vertical"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ghi chú</FormLabel>
                  <Textarea
                    value={formData.note}
                    onChange={(e) => handleChange("note", e.target.value)}
                    placeholder="Ghi chú thêm"
                    resize="vertical"
                  />
                </FormControl>
              </>
            )}

            {!isCreateMode && canUpdateStock ? (
              <Stack
                spacing="14px"
                border="1px solid"
                borderColor={sectionBorderColor}
                borderRadius="16px"
                p="16px"
              >
                <Text fontSize="md" fontWeight="700">
                  Cập nhật tồn kho
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                  <GridItem>
                    <FormControl>
                      <FormLabel>Quantity change</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        value={stockForm.quantity_change}
                        onChange={(e) =>
                          handleStockChange("quantity_change", e.target.value)
                        }
                        placeholder="Ví dụ: 10 hoặc -5"
                      />
                      <FormHelperText>
                        Số dương để nhập thêm, số âm để xuất kho.
                      </FormHelperText>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ghi chú cho lần cập nhật</FormLabel>
                      <Input
                        value={stockForm.note}
                        onChange={(e) => handleStockChange("note", e.target.value)}
                        placeholder="Ví dụ: nhập kho tháng 4"
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </Stack>
            ) : null}

            {!canManageSupplies && !isCreateMode ? (
              <Text fontSize="sm" color="gray.500">
                Tài khoản của bạn chỉ có quyền xem hoặc cập nhật tồn kho theo quyền hiện tại.
              </Text>
            ) : null}
          </Stack>
        </ModalBody>

        <ModalFooter gap="12px" flexWrap="wrap">
          {isCreateMode ? (
            <>
              <Button variant="outline" onClick={onClose}>
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
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>

              {canUpdateStock ? (
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={handleSubmitStock}
                  isLoading={isUpdatingStock}
                >
                  Cập nhật tồn kho
                </Button>
              ) : null}

              {canManageSupplies ? (
                <Button colorScheme="blue" onClick={() => setIsEditing(true)}>
                  Sửa
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Hủy
              </Button>

              {canUpdateStock ? (
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={handleSubmitStock}
                  isLoading={isUpdatingStock}
                >
                  Cập nhật tồn kho
                </Button>
              ) : null}

              {canDeactivateSupplyByRole && (supply?.is_active ? (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onDeactivate?.(supply)}
                  isLoading={isDeactivating}
                >
                  Vô hiệu hóa
                </Button>
              ) : (
                <Button
                  colorScheme="green"
                  variant="outline"
                  onClick={() => onActivate?.(supply)}
                  isLoading={isActivating}
                >
                  Kích hoạt
                </Button>
              ))}

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