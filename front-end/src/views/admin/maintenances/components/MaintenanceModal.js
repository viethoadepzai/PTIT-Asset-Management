import React from "react";
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

const MAINTENANCE_TYPE_OPTIONS = [
  { value: "preventive", label: "preventive" },
  { value: "corrective", label: "corrective" },
  { value: "inspection", label: "inspection" },
  { value: "warranty", label: "warranty" },
  { value: "other", label: "other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
  { value: "urgent", label: "urgent" },
];

const STATUS_OPTIONS = [
  { value: "scheduled", label: "scheduled" },
  { value: "in_progress", label: "in_progress" },
  { value: "completed", label: "completed" },
  { value: "cancelled", label: "cancelled" },
];

const initialFormData = {
  maintenance_code: "",
  asset_id: "",
  maintenance_type: "corrective",
  status: "scheduled",
  priority: "medium",
  title: "",
  description: "",
  scheduled_date: "",
  next_maintenance_date: "",
  cost: "",
  vendor_name: "",
  resolution_note: "",
  assigned_to_user_id: "",
  is_active: true,
};

const initialStatusForm = {
  status: "scheduled",
  resolution_note: "",
  cost: "",
  next_maintenance_date: "",
};

export default function MaintenanceModal(props) {
  const {
    maintenance,
    assetOptions = [],
    userOptions = [],
    isOpen,
    isSubmitting,
    isUpdatingStatus,
    isDeactivating,
    onClose,
    onSave,
    onUpdateStatus,
    onDeactivate,
    mode = "edit",
    canEditMaintenances = false,
    canUpdateMaintenanceStatus = false,
    canDeactivateMaintenanceByRole = false,
    currentUserRole = "",
  } = props;

  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();
  const isStaff = normalizedRole === "staff";
  const isCreateMode = mode === "create";

  const [isEditing, setIsEditing] = React.useState(isCreateMode);

  const modalBg = useColorModeValue("white", "navy.800");
  const readOnlyTextColor = useColorModeValue("secondaryGray.900", "white");
  const readOnlyBorderColor = useColorModeValue(
    "secondaryGray.100",
    "whiteAlpha.100"
  );
  const readOnlyBg = useColorModeValue("secondaryGray.300", "navy.700");
  const sectionBorderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const [formData, setFormData] = React.useState(initialFormData);
  const [statusForm, setStatusForm] = React.useState(initialStatusForm);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isCreateMode) {
      setFormData({
        ...initialFormData,
        status: "scheduled",
      });
      setStatusForm(initialStatusForm);
      setIsEditing(true);
      return;
    }

    if (!maintenance) return;

    setFormData({
      maintenance_code: maintenance.maintenance_code || "",
      asset_id: maintenance.asset_id ?? "",
      maintenance_type: maintenance.maintenance_type || "corrective",
      status: maintenance.status || "scheduled",
      priority: maintenance.priority || "medium",
      title: maintenance.title || "",
      description: maintenance.description || "",
      scheduled_date: maintenance.scheduled_date || "",
      next_maintenance_date: maintenance.next_maintenance_date || "",
      cost: maintenance.cost || "",
      vendor_name: maintenance.vendor_name || "",
      resolution_note: maintenance.resolution_note || "",
      assigned_to_user_id: maintenance.assigned_to_user_id ?? "",
      is_active: maintenance.is_active ?? true,
    });

    setStatusForm({
      status: maintenance.status || "scheduled",
      resolution_note: maintenance.resolution_note || "",
      cost: maintenance.cost || "",
      next_maintenance_date: maintenance.next_maintenance_date || "",
    });

    setIsEditing(false);
  }, [isCreateMode, isOpen, maintenance]);

  if (!isCreateMode && !maintenance) return null;

  const isReadOnly = !isCreateMode && (!isEditing || !canEditMaintenances);
  const assetLabel = maintenance?.asset_label || "-";

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStatusChange = (field, value) => {
    setStatusForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: maintenance.id }),
      maintenance_code: formData.maintenance_code,
      asset_id: formData.asset_id,
      maintenance_type: formData.maintenance_type,
      status: formData.status,
      priority: formData.priority,
      title: formData.title,
      description: formData.description,
      scheduled_date: formData.scheduled_date,
      next_maintenance_date: formData.next_maintenance_date,
      cost: formData.cost,
      vendor_name: formData.vendor_name,
      resolution_note: formData.resolution_note,
      assigned_to_user_id: formData.assigned_to_user_id,
      is_active: formData.is_active,
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  const handleSubmitStatus = async () => {
    await onUpdateStatus?.({
      id: maintenance.id,
      status: statusForm.status,
      resolution_note: statusForm.resolution_note,
      cost: statusForm.cost,
      next_maintenance_date: statusForm.next_maintenance_date,
    });
  };

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  const titleText = isCreateMode
    ? isStaff
      ? "Tạo yêu cầu bảo trì"
      : "Thêm maintenance"
    : "Chi tiết bảo trì";

  const canShowStatusSection = !isCreateMode && canUpdateMaintenanceStatus;

  const valueMap = {
    preventive: "Phòng ngừa",
    corrective: "Sửa chữa",
    inspection: "Kiểm tra",
    warranty: "Bảo hành",
    other: "Khác",
    low: "Thấp",
    medium: "Trung bình",
    high: "Cao",
    urgent: "Khẩn cấp",
    scheduled: "Đã lên lịch",
    in_progress: "Đang thực hiện",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="20px">
        <ModalHeader>{titleText}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Stack spacing="16px">
            {!isCreateMode && !formData.is_active ? (
              <Badge
                colorScheme="gray"
                borderRadius="999px"
                px="12px"
                py="6px"
                w="fit-content"
              >
                Maintenance này đang ở trạng thái không hoạt động
              </Badge>
            ) : null}

            {!isCreateMode ? (
              <Badge
                colorScheme="blue"
                borderRadius="999px"
                px="12px"
                py="6px"
                w="fit-content"
              >
                Asset: {assetLabel}
              </Badge>
            ) : null}

            {isStaff && isCreateMode ? (
              <Box
                border="1px solid"
                borderColor={sectionBorderColor}
                borderRadius="16px"
                p="14px"
              >
                <Text fontSize="sm" color="gray.500">
                  Nhân viên chỉ tạo <b>yêu cầu bảo trì</b>. Trạng thái sẽ được hệ thống
                  xử lý theo quyền của quản trị viên hoặc quản lí.
                </Text>
              </Box>
            ) : null}

            {isReadOnly ? (
              <>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                  <GridItem>
                    <FormControl>
                      <FormLabel>ID</FormLabel>
                      <Input value={maintenance?.id || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Trạng thái hoạt động</FormLabel>
                      <Input
                        value={maintenance?.is_active ? "Hoạt động" : "Không hoạt động"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Mã</FormLabel>
                      <Input
                        value={maintenance?.maintenance_code || ""}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Tài sản</FormLabel>
                      <Input value={assetLabel} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Loại bảo trì</FormLabel>
                      <Input
                        value={valueMap[maintenance?.maintenance_type] || "Không xác định"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Trạng thái</FormLabel>
                      <Input value={valueMap[maintenance?.status] || "Không xác định"} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ưu tiên</FormLabel>
                      <Input value={valueMap[maintenance?.priority] || "Không xác định"} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Người phụ trách</FormLabel>
                      <Input
                        value={maintenance?.assigned_to_user || "-"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Người báo cáo</FormLabel>
                      <Input
                        value={maintenance?.reported_by_user || "-"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ngày lên kế hoạch</FormLabel>
                      <Input
                        value={maintenance?.scheduled_date || ""}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ngày bảo trì tiếp theo</FormLabel>
                      <Input
                        value={maintenance?.next_maintenance_date || ""}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ngày bắt đầu</FormLabel>
                      <Input value={maintenance?.started_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ngày hoàn thành</FormLabel>
                      <Input
                        value={maintenance?.completed_at || ""}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Giá</FormLabel>
                      <Input value={maintenance?.cost || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Nhà cung cấp</FormLabel>
                      <Input
                        value={maintenance?.vendor_name || ""}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Thời gian tạo</FormLabel>
                      <Input value={maintenance?.created_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Thời gian cập nhật gần nhất</FormLabel>
                      <Input value={maintenance?.updated_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl>
                  <FormLabel>Tiêu đề</FormLabel>
                  <Input value={maintenance?.title || ""} {...readOnlyFieldProps} />
                </FormControl>

                <FormControl>
                  <FormLabel>Mô tả</FormLabel>
                  <Textarea
                    value={maintenance?.description || ""}
                    resize="vertical"
                    {...readOnlyFieldProps}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ghi chú giải quyết</FormLabel>
                  <Textarea
                    value={maintenance?.resolution_note || ""}
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
                      <FormLabel>Mã</FormLabel>
                      <Input
                        value={formData.maintenance_code}
                        onChange={(e) =>
                          handleChange("maintenance_code", e.target.value)
                        }
                        placeholder="VD: MT-001"
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Tài sản</FormLabel>
                      <Select
                        value={formData.asset_id}
                        onChange={(e) => handleChange("asset_id", e.target.value)}
                        isDisabled={!isCreateMode}
                      >
                        <option value="">Chọn tài sản</option>
                        {assetOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Loại bảo trì</FormLabel>
                      <Select
                        value={formData.maintenance_type}
                        onChange={(e) =>
                          handleChange("maintenance_type", e.target.value)
                        }
                      >
                        {MAINTENANCE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {valueMap[option.value] || option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  {!isStaff ? (
                    <GridItem>
                      <FormControl>
                        <FormLabel>Trạng thái</FormLabel>
                        <Select
                          value={formData.status}
                          onChange={(e) => handleChange("status", e.target.value)}
                          isDisabled={!isCreateMode}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {valueMap[option.value] || option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                  ) : null}

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ưu tiên</FormLabel>
                      <Select
                        value={formData.priority}
                        onChange={(e) => handleChange("priority", e.target.value)}
                      >
                        {PRIORITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {valueMap[option.value] || option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  {!isStaff ? (
                    <GridItem>
                      <FormControl>
                        <FormLabel>Được gán cho</FormLabel>
                        <Select
                          value={formData.assigned_to_user_id}
                          onChange={(e) =>
                            handleChange("assigned_to_user_id", e.target.value)
                          }
                        >
                          <option value="">Chưa gán người xử lý</option>
                          {userOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                  ) : null}

                  <GridItem>
                    <FormControl>
                      <FormLabel>Thời gian lên lịch</FormLabel>
                      <Input
                        type="date"
                        value={formData.scheduled_date}
                        onChange={(e) =>
                          handleChange("scheduled_date", e.target.value)
                        }
                      />
                    </FormControl>
                  </GridItem>

                  {!isStaff ? (
                    <>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Ngày bảo trì tiếp theo</FormLabel>
                          <Input
                            type="date"
                            value={formData.next_maintenance_date}
                            onChange={(e) =>
                              handleChange("next_maintenance_date", e.target.value)
                            }
                          />
                        </FormControl>
                      </GridItem>

                      <GridItem>
                        <FormControl>
                          <FormLabel>Chi phí</FormLabel>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.cost}
                            onChange={(e) => handleChange("cost", e.target.value)}
                          />
                        </FormControl>
                      </GridItem>
                    </>
                  ) : null}

                  <GridItem>
                    <FormControl>
                      <FormLabel>Nhà cung cấp</FormLabel>
                      <Input
                        value={formData.vendor_name}
                        onChange={(e) => handleChange("vendor_name", e.target.value)}
                      />
                    </FormControl>
                  </GridItem>

                  {!isCreateMode && !isStaff ? (
                    <GridItem>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">Active</FormLabel>
                        <Switch
                          isChecked={formData.is_active}
                          onChange={(e) =>
                            handleChange("is_active", e.target.checked)
                          }
                          isDisabled
                        />
                      </FormControl>
                    </GridItem>
                  ) : null}
                </Grid>

                <FormControl isRequired>
                  <FormLabel>Tiêu đề</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Nhập tiêu đề maintenance"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Mô tả</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Mô tả maintenance"
                    resize="vertical"
                  />
                </FormControl>

                {!isStaff ? (
                  <FormControl>
                    <FormLabel>Ghi chú xử lý</FormLabel>
                    <Textarea
                      value={formData.resolution_note}
                      onChange={(e) =>
                        handleChange("resolution_note", e.target.value)
                      }
                      placeholder="Ghi chú xử lý"
                      resize="vertical"
                    />
                  </FormControl>
                ) : null}
              </>
            )}

            {canShowStatusSection ? (
              <Box
                border="1px solid"
                borderColor={sectionBorderColor}
                borderRadius="16px"
                p="16px"
              >
                <Stack spacing="14px">
                  <Text fontSize="md" fontWeight="700">
                    Cập nhật trạng thái
                  </Text>

                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                    <GridItem>
                      <FormControl>
                        <FormLabel>Trạng thái</FormLabel>
                        <Select
                          value={statusForm.status}
                          onChange={(e) =>
                            handleStatusChange("status", e.target.value)
                          }
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
                        <FormLabel>Ngày bảo trì tiếp theo</FormLabel>
                        <Input
                          type="date"
                          value={statusForm.next_maintenance_date}
                          onChange={(e) =>
                            handleStatusChange("next_maintenance_date", e.target.value)
                          }
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl>
                        <FormLabel>Chi phí</FormLabel>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={statusForm.cost}
                          onChange={(e) =>
                            handleStatusChange("cost", e.target.value)
                          }
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl>
                        <FormLabel>Ghi chú xử lý</FormLabel>
                        <Input
                          value={statusForm.resolution_note}
                          onChange={(e) =>
                            handleStatusChange("resolution_note", e.target.value)
                          }
                          placeholder="Ghi chú cho trạng thái mới"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </Stack>
              </Box>
            ) : null}

            {isStaff && !isCreateMode ? (
              <Text fontSize="sm" color="gray.500">
                Nhân viên chỉ có quyền xem chi tiết bảo trì. Việc cập nhật trạng thái
                được thực hiện bởi quản trị viên hoặc quản lí.
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
                {isStaff ? "Gửi yêu cầu" : "Lưu"}
              </Button>
            </>
          ) : isReadOnly ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>

              {canShowStatusSection ? (
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={handleSubmitStatus}
                  isLoading={isUpdatingStatus}
                >
                  Cập nhật trạng thái
                </Button>
              ) : null}

              {canEditMaintenances ? (
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

              {canShowStatusSection ? (
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={handleSubmitStatus}
                  isLoading={isUpdatingStatus}
                >
                  Cập nhật trạng thái
                </Button>
              ) : null}

              {canDeactivateMaintenanceByRole && maintenance?.is_active ? (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onDeactivate?.(maintenance)}
                  isLoading={isDeactivating}
                >
                  Vô hiệu hóa
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