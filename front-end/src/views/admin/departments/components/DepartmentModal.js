import React from "react";
import {
  Badge,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Switch,
  Text,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";

const initialFormData = {
  code: "",
  name: "",
  description: "",
  is_active: true,
};

export default function DepartmentModal(props) {
  const {
    department,
    isOpen,
    isSubmitting,
    isDeleting,
    isDeactivating, // giữ tương thích code cũ
    onClose,
    onDelete,
    onDeactivate, // giữ tương thích code cũ
    onSave,
    mode = "edit",
    canManageDepartments = false,
    canDeleteDepartmentByRole,
    canDeactivateDepartmentByRole, // giữ tương thích code cũ
  } = props;

  const isCreateMode = mode === "create";
  const [isEditing, setIsEditing] = React.useState(isCreateMode);

  const modalBg = useColorModeValue("white", "navy.800");
  const readOnlyTextColor = useColorModeValue("secondaryGray.900", "white");
  const readOnlyBorderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  const readOnlyBg = useColorModeValue("secondaryGray.300", "navy.700");

  const [formData, setFormData] = React.useState(initialFormData);

  const deleteHandler = onDelete || onDeactivate;
  const deletingState = Boolean(isDeleting || isDeactivating);
  const canDeleteByRole =
    typeof canDeleteDepartmentByRole === "boolean"
      ? canDeleteDepartmentByRole
      : Boolean(canDeactivateDepartmentByRole);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isCreateMode) {
      setFormData(initialFormData);
      setIsEditing(true);
      return;
    }

    if (!department) return;

    setFormData({
      code: department.code || "",
      name: department.name || "",
      description: department.description || "",
      is_active: department.is_active ?? true,
    });

    setIsEditing(false);
  }, [department, isCreateMode, isOpen]);

  if (!isCreateMode && !department) return null;

  const isReadOnly = !isCreateMode && (!isEditing || !canManageDepartments);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: department.id }),
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      is_active: formData.is_active,
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await deleteHandler?.(department);
  };

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="20px">
        <ModalHeader>
          {isCreateMode ? "Thêm phòng ban" : "Chi tiết phòng ban"}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isReadOnly ? (
            <Stack spacing="16px">
              <FormControl>
                <FormLabel>ID</FormLabel>
                <Input value={department?.id || ""} {...readOnlyFieldProps} />
              </FormControl>

              <FormControl>
                <FormLabel>Mã</FormLabel>
                <Input value={department?.code || ""} {...readOnlyFieldProps} />
              </FormControl>

              <FormControl>
                <FormLabel>Tên</FormLabel>
                <Input value={department?.name || ""} {...readOnlyFieldProps} />
              </FormControl>

              <FormControl>
                <FormLabel>Mô tả</FormLabel>
                <Textarea
                  value={department?.description || ""}
                  resize="vertical"
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Trạng thái</FormLabel>
                <Input
                  value={department?.is_active ? "Hoạt động" : "Không hoạt động"}
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Thời gian tạo</FormLabel>
                <Input value={department?.created_at || ""} {...readOnlyFieldProps} />
              </FormControl>

              <FormControl>
                <FormLabel>Thời gian cập nhật gần nhất</FormLabel>
                <Input value={department?.updated_at || ""} {...readOnlyFieldProps} />
              </FormControl>

              {!canManageDepartments ? (
                <Text fontSize="sm" color="gray.500">
                  Tài khoản của bạn chỉ có quyền xem phòng ban.
                </Text>
              ) : null}
            </Stack>
          ) : (
            <Stack spacing="16px">
              {!department?.is_active && !isCreateMode ? (
                <Badge colorScheme="red" borderRadius="999px" px="12px" py="6px" w="fit-content">
                  Phòng ban này đang ở trạng thái không hoạt động
                </Badge>
              ) : null}

              <FormControl isRequired>
                <FormLabel>Mã</FormLabel>
                <Input
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder="VD: IT, HR, FIN"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tên</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Nhập tên phòng ban"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Mô tả</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Mô tả ngắn về phòng ban"
                  resize="vertical"
                />
              </FormControl>

              {!isCreateMode ? (
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Hoạt động</FormLabel>
                  <Switch
                    isChecked={formData.is_active}
                    onChange={(e) => handleChange("is_active", e.target.checked)}
                    isDisabled
                  />
                </FormControl>
              ) : null}
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
              {canManageDepartments ? (
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

              {canDeleteByRole && department?.is_active ? (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={handleDelete}
                  isLoading={deletingState}
                >
                  Xóa phòng ban
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