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
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

const initialFormData = {
  username: "",
  email: "",
  is_active: true,
  full_name: "",
  phone_number: "",
  role: "staff",
  department_id: "",
  password: "",
  confirm_password: "",
};

export default function UserModal(props) {
  const {
    user,
    departmentOptions = [],
    isOpen,
    isSubmitting,
    isTogglingActive,
    onClose,
    onToggleActive,
    onSave,
    mode = "edit",
    canManageUsers = false,
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

    if (!user) return;

    setFormData({
      username: user.username || "",
      email: user.email || "",
      full_name: user.full_name || "",
      phone_number: user.phone_number || "",
      role: user.role || "staff",
      is_active: user.is_active ?? true,
      department_id: user.department_id ?? "",
      password: "",
      confirm_password: "",
    });

    setIsEditing(false);
  }, [isCreateMode, isOpen, user]);

  const isAdminTarget = user?.role === "admin";
  const isReadOnly = !isCreateMode && (!isEditing || !canManageUsers);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: user.id }),
      username: formData.username.trim(),
      email: formData.email.trim(),
      full_name: formData.full_name.trim(),
      phone_number: formData.phone_number.trim(),
      role: formData.role,
      is_active: formData.is_active,
      department_id:
        formData.department_id === "" ? null : Number(formData.department_id),
      ...(isCreateMode
        ? {
            password: formData.password,
            confirm_password: formData.confirm_password,
          }
        : {}),
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  if (!isCreateMode && !user) return null;

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="20px">
        <ModalHeader>
          {isCreateMode ? "Thêm người dùng" : "Chi tiết người dùng"}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isReadOnly ? (
            <Stack spacing="16px">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing="16px">
                <FormControl>
                  <FormLabel>ID</FormLabel>
                  <Input value={user?.id || ""} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Trạng thái</FormLabel>
                  <Input
                    value={
                      isAdminTarget
                        ? "Hoạt động (Quản trị viên)"
                        : user?.is_active
                          ? "Hoạt động"
                          : "Không hoạt động"
                    }
                    {...readOnlyFieldProps}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Tên đăng nhập</FormLabel>
                  <Input value={user?.username || ""} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input value={user?.email || ""} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Họ và tên</FormLabel>
                  <Input value={user?.full_name || ""} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Số điện thoại</FormLabel>
                  <Input value={user?.phone_number || ""} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Chức vụ</FormLabel>
                  <Input value={user?.role || ""} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Phòng ban</FormLabel>
                  <Input value={user?.department || "-"} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Thời gian tạo</FormLabel>
                  <Input value={user?.created_at || ""} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Thời gian cập nhật gần nhất</FormLabel>
                  <Input value={user?.updated_at || ""} {...readOnlyFieldProps} />
                </FormControl>
              </SimpleGrid>

              {!canManageUsers ? (
                <Text fontSize="sm" color="gray.500">
                  Tài khoản của bạn chỉ có quyền xem danh sách người dùng.
                </Text>
              ) : null}
            </Stack>
          ) : (
            <Stack spacing="16px">
              {!isCreateMode && isAdminTarget ? (
                <Badge colorScheme="purple" borderRadius="999px" px="12px" py="6px" w="fit-content">
                  Tài khoản admin không thể đổi role hoặc bị vô hiệu hóa
                </Badge>
              ) : null}

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing="16px">
                <FormControl isRequired>
                  <FormLabel>Tên đăng nhập</FormLabel>
                  <Input
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Họ và tên</FormLabel>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Số điện thoại</FormLabel>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => handleChange("phone_number", e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Chức vụ</FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    isDisabled={!isCreateMode && isAdminTarget}
                  >
                    <option value="manager">Quản lí</option>
                    <option value="staff">Nhân viên</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Phòng ban</FormLabel>
                  <Select
                    value={formData.department_id}
                    onChange={(e) => handleChange("department_id", e.target.value)}
                  >
                    <option value="">Chưa có phòng ban</option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Hoạt động</FormLabel>
                  <Switch
                    isChecked={formData.is_active}
                    onChange={(e) => handleChange("is_active", e.target.checked)}
                    isDisabled={!isCreateMode && isAdminTarget}
                  />
                </FormControl>

                {isCreateMode ? (
                  <>
                    <FormControl isRequired>
                      <FormLabel>Mật khẩu</FormLabel>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <Input
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) =>
                          handleChange("confirm_password", e.target.value)
                        }
                      />
                    </FormControl>
                  </>
                ) : null}
              </SimpleGrid>
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
              {canManageUsers ? (
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

              {!isAdminTarget ? (
                <Button
                  colorScheme={user?.is_active ? "red" : "green"}
                  variant="outline"
                  onClick={() => onToggleActive?.(user)}
                  isLoading={isTogglingActive}
                >
                  {user?.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
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