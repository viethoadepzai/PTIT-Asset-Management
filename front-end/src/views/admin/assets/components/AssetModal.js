import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Badge,
  Box,
  Button,
  FormControl,
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

const STATUS_OPTIONS = [
  { value: "available", label: "available" },
  { value: "in_use", label: "in_use" },
  { value: "under_maintenance", label: "under_maintenance" },
  { value: "damaged", label: "damaged" },
  { value: "liquidated", label: "liquidated" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "new" },
  { value: "good", label: "good" },
  { value: "fair", label: "fair" },
  { value: "poor", label: "poor" },
  { value: "broken", label: "broken" },
];

const initialFormData = {
  code: "",
  qr_code: "",
  name: "",
  category_id: "",
  serial_number: "",
  specification: "",
  purchase_date: "",
  useful_life: 0,
  purchase_cost: "",
  status: "available",
  condition: "good",
  location: "",
  note: "",
  assigned_department_id: "",
  assigned_user_id: "",
  is_active: true,
};

export default function AssetModal(props) {
  const {
    asset,
    departmentOptions = [],
    categoryOptions = [],
    userOptions = [],
    isOpen,
    isSubmitting,
    isDeactivating,
    isActivating,
    onClose,
    onDeactivate,
    onActivate,
    onSave,
    mode = "edit",
    canManageAssets = false,
    canDeactivateAssetByRole = false,
  } = props;
  const isCreateMode = mode === "create";
  const [isEditing, setIsEditing] = React.useState(isCreateMode);

  const modalBg = useColorModeValue("white", "navy.800");
  const readOnlyTextColor = useColorModeValue("secondaryGray.900", "white");
  const readOnlyBorderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  const readOnlyBg = useColorModeValue("secondaryGray.300", "navy.700");

  const [formData, setFormData] = React.useState(initialFormData);
  React.useEffect(() => {
    if (!isOpen) return;

    if (isCreateMode) {
      setFormData(initialFormData);
      setIsEditing(true);
      return;
    }

    if (!asset) return;

    setFormData({
      code: asset.code || "",
      qr_code: asset.qr_code || "",
      name: asset.name || "",
      category_id: asset.category_id ? String(asset.category_id) : "",
      serial_number: asset.serial_number || "",
      specification: asset.specification || "",
      purchase_date: asset.purchase_date || "",
      useful_life: asset.useful_life || 0,
      purchase_cost: asset.purchase_cost || "",
      status: asset.status || "available",
      condition: asset.condition || "good",
      location: asset.location || "",
      note: asset.note || "",
      assigned_department_id: asset.assigned_department_id ?? "",
      assigned_user_id: asset.assigned_user_id ?? "",
      is_active: asset.is_active ?? true,
    });

    setIsEditing(false);
  }, [asset, isCreateMode, isOpen]);

  const valueMap = {
    new: "Mới",
    good: "Tốt",
    fair: "Khá",
    poor: "Kém",
    broken: "Hỏng",
    available: "Sẵn sàng",
    in_use: "Đang sử dụng",
    under_maintenance: "Đang bảo trì",
    damaged: "Bị hỏng",
    liquidated: "Đã thanh lý",
  };

  const qrPayload = React.useMemo(() => {
    if (!asset) return "";
    return `Tên tài sản: ${asset.name}
Mã tài sản: ${asset.code}
Phòng ban quản lý: ${asset.assigned_department || "Chưa giao"}
Người phụ trách: ${asset.assigned_user || "Chưa giao"}
Tình trạng: ${valueMap[asset.condition] || asset.condition}
Bảo hành: ${asset.useful_life || 0} tháng
Lịch sử bảo trì: ${asset.note || "Không có"}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  if (!isCreateMode && !asset) return null;

  const isReadOnly = !isCreateMode && (!isEditing || !canManageAssets);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: asset.id }),
      code: formData.code,
      qr_code: formData.qr_code || null,
      name: formData.name,
      category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
      serial_number: formData.serial_number,
      specification: formData.specification,
      purchase_date: formData.purchase_date,
      useful_life: formData.useful_life,
      purchase_cost: formData.purchase_cost,
      status: formData.status,
      condition: formData.condition,
      location: formData.location,
      note: formData.note,
      assigned_department_id: formData.assigned_department_id,
      assigned_user_id: formData.assigned_user_id,
      is_active: formData.is_active,
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };



  if(isReadOnly) console.log("Chỉ được đọc")
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="20px">
        <ModalHeader>
          {isCreateMode ? "Thêm tài sản" : "Chi tiết tài sản"}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isReadOnly ? (
            <Stack spacing="16px">
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                <GridItem>
                  <FormControl>
                    <FormLabel>ID</FormLabel>
                    <Input value={asset?.id || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Trạng thái hoạt động</FormLabel>
                    <Input
                      value={asset?.is_active ? "Hoạt động" : "Không hoạt động"}
                      {...readOnlyFieldProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Mã</FormLabel>
                    <Input value={asset?.code || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Tên</FormLabel>
                    <Input value={asset?.name || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Danh mục</FormLabel>
                    <Input value={asset?.category || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Số seri</FormLabel>
                    <Input value={asset?.serial_number || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Ngày mua</FormLabel>
                    <Input value={asset?.purchase_date || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Thời gian khấu hao (Tháng)</FormLabel>
                    <Input value={asset?.useful_life ?? 0} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Giá mua</FormLabel>
                    <Input value={asset?.purchase_cost || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Trạng thái</FormLabel>
                    <Input value={valueMap[asset.status] || "Không xác định"} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Tình trạng</FormLabel>
                    <Input value={valueMap[asset.condition] || "Không xác định"} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Vị trí</FormLabel>
                    <Input value={asset?.location || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Phòng ban phụ trách</FormLabel>
                    <Input
                      value={asset?.assigned_department || "-"}
                      {...readOnlyFieldProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Người phụ trách</FormLabel>
                    <Input value={asset?.assigned_user || "-"} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Thời gian tạo</FormLabel>
                    <Input value={asset?.created_at || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Thời gian cập nhật gần nhất</FormLabel>
                    <Input value={asset?.updated_at || ""} {...readOnlyFieldProps} />
                  </FormControl>
                </GridItem>
              </Grid>

              {asset?.code && (
                <FormControl>
                  <FormLabel>QR Code (PTIT-{asset.code})</FormLabel>
                  <Box bg="white" p="10px" borderRadius="10px" w="fit-content">
                    <QRCodeCanvas value={qrPayload} size={150} includeMargin />
                  </Box>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Thông số</FormLabel>
                <Textarea
                  value={asset?.specification || ""}
                  resize="vertical"
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ghi chú</FormLabel>
                <Textarea
                  value={asset?.note || ""}
                  resize="vertical"
                  {...readOnlyFieldProps}
                />
              </FormControl>

              {!canManageAssets ? (
                <Text fontSize="sm" color="gray.500">
                  Tài khoản của bạn chỉ có quyền xem tài sản.
                </Text>
              ) : null}
            </Stack>
          ) : (
            <Stack spacing="16px">
              {!asset?.is_active && !isCreateMode ? (
                <Badge colorScheme="red" borderRadius="999px" px="12px" py="6px" w="fit-content">
                  Tài sản này đang ở trạng thái không hoạt động
                </Badge>
              ) : null}

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Mã</FormLabel>
                    <Input
                      value={formData.code}
                      onChange={(e) => handleChange("code", e.target.value)}
                      placeholder="VD: AS-001"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Tên</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Nhập tên tài sản"
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
                    <FormLabel>Số seri</FormLabel>
                    <Input
                      value={formData.serial_number}
                      onChange={(e) => handleChange("serial_number", e.target.value)}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Ngày mua</FormLabel>
                    <Input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => handleChange("purchase_date", e.target.value)}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Thời gian khấu hao (Tháng)</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.useful_life}
                      onChange={(e) => handleChange("useful_life", e.target.value)}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Giá mua</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchase_cost}
                      onChange={(e) => handleChange("purchase_cost", e.target.value)}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Trạng thái</FormLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {valueMap[option.value] || option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Tình trạng</FormLabel>
                    <Select
                      value={formData.condition}
                      onChange={(e) => handleChange("condition", e.target.value)}
                    >
                      {CONDITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {valueMap[option.value] || option.label}
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

                <GridItem>
                  <FormControl>
                    <FormLabel>Phòng ban phụ trách</FormLabel>
                    <Select
                      value={formData.assigned_department_id}
                      onChange={(e) =>
                        handleChange("assigned_department_id", e.target.value)
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
                    <FormLabel>Người phụ trách</FormLabel>
                    <Select
                      value={formData.assigned_user_id}
                      onChange={(e) =>
                        handleChange("assigned_user_id", e.target.value)
                      }
                    >
                      <option value="">Chưa giao người dùng</option>
                      {userOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl>
                <FormLabel>Thông số</FormLabel>
                <Textarea
                  value={formData.specification}
                  onChange={(e) => handleChange("specification", e.target.value)}
                  placeholder="Thông số kỹ thuật"
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
            </Stack>
          )}
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
              {canManageAssets ? (
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

              {canDeactivateAssetByRole && (asset?.is_active ? (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onDeactivate?.(asset)}
                  isLoading={isDeactivating}
                >
                  Vô hiệu hóa
                </Button>
              ) : (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onActivate?.(asset)}
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