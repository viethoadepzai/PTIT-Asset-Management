import React from "react";
import {
  Badge,
  Box,
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
  Text,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";

const ALLOCATION_TYPE_OPTIONS = [
  { value: "asset", label: "asset" },
  { value: "supply", label: "supply" },
];

const initialFormData = {
  allocation_code: "",
  allocation_type: "asset",
  asset_id: "",
  supply_id: "",
  quantity: "1",
  allocated_department_id: "",
  allocated_user_id: "",
  expected_return_date: "",
  purpose: "",
  note: "",
  is_active: true,
};

const initialStatusForm = {
  status: "",
  note: "",
};

function getStatusOptions({ allocation, role }) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const currentStatus = String(allocation?.status || "").trim().toLowerCase();
  const allocationType = String(allocation?.allocation_type || "")
    .trim()
    .toLowerCase();

  if (!currentStatus) return [];

  if (normalizedRole === "staff") {
    if (allocationType === "supply" && currentStatus === "active") {
      return [{ value: "completed", label: "completed" }];
    }
    return [];
  }

  if (currentStatus === "requested") {
    return [
      { value: "active", label: "active" },
      { value: "cancelled", label: "cancelled" },
    ];
  }

  if (allocationType === "asset" && currentStatus === "active") {
    return [
      { value: "returned", label: "returned" },
      { value: "cancelled", label: "cancelled" },
    ];
  }

  if (allocationType === "supply" && currentStatus === "active") {
    return [
      { value: "completed", label: "completed" },
      { value: "cancelled", label: "cancelled" },
    ];
  }

  return [];
}

function getStatusActionLabel({ allocation, role }) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const currentStatus = String(allocation?.status || "").trim().toLowerCase();
  const allocationType = String(allocation?.allocation_type || "")
    .trim()
    .toLowerCase();

  if (normalizedRole === "staff") {
    if (allocationType === "supply" && currentStatus === "active") {
      return "Xác nhận đã nhận vật tư";
    }
    return "Cập nhật trạng thái";
  }

  if (currentStatus === "requested") {
    return "Xử lý đề nghị";
  }

  return "Cập nhật trạng thái";
}

export default function AllocationModal(props) {
  const {
    allocation,
    departmentOptions = [],
    userOptions = [],
    assetOptions = [],
    supplyOptions = [],
    isOpen,
    isSubmitting,
    isUpdatingStatus,
    isDeactivating,
    onClose,
    onSave,
    onUpdateStatus,
    onDeactivate,
    mode = "edit",
    canCreateAllocations = false,
    canEditAllocations = false,
    canManageAllocations = false,
    canDeactivateAllocationByRole = false,
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
        allocation_type: isStaff ? "Vật tư" : "Tài sản",
      });
      setStatusForm(initialStatusForm);
      setIsEditing(true);
      return;
    }

    if (!allocation) return;

    setFormData({
      allocation_code: allocation.allocation_code || "",
      allocation_type: allocation.allocation_type || "asset",
      asset_id: allocation.asset_id ?? "",
      supply_id: allocation.supply_id ?? "",
      quantity: allocation.quantity || "1",
      allocated_department_id: allocation.allocated_department_id ?? "",
      allocated_user_id: allocation.allocated_user_id ?? "",
      expected_return_date: allocation.expected_return_date || "",
      purpose: allocation.purpose || "",
      note: allocation.note || "",
      is_active: allocation.is_active ?? true,
    });

    const statusOptions = getStatusOptions({
      allocation,
      role: currentUserRole,
    });

    setStatusForm({
      status: statusOptions[0]?.value || allocation.status || "",
      note: allocation.note || "",
    });

    setIsEditing(false);
  }, [allocation, currentUserRole, isCreateMode, isOpen, isStaff]);

  if (!isCreateMode && !allocation) return null;

  const statusOptions = getStatusOptions({
    allocation,
    role: currentUserRole,
  });

  const canShowStatusSection =
    !isCreateMode &&
    statusOptions.length > 0 &&
    (canManageAllocations || isStaff);

  const canOpenEditMode = !isCreateMode && canEditAllocations;
  const isReadOnly = !isCreateMode && (!isEditing || !canEditAllocations);

  const isAssetType = formData.allocation_type === "asset";
  const isSupplyType = formData.allocation_type === "supply";

  const resourceLabel = allocation?.resource_label || "-";

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === "allocation_type") {
        if (value === "asset") {
          next.supply_id = "";
          next.quantity = "1";
        } else {
          next.asset_id = "";
          if (!next.quantity) {
            next.quantity = "1";
          }
        }
      }

      return next;
    });
  };

  const handleStatusChange = (field, value) => {
    setStatusForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: allocation.id }),
      allocation_code: formData.allocation_code,
      allocation_type: formData.allocation_type,
      asset_id: formData.asset_id,
      supply_id: formData.supply_id,
      quantity: formData.quantity,
      allocated_department_id: formData.allocated_department_id,
      allocated_user_id: formData.allocated_user_id,
      expected_return_date: formData.expected_return_date,
      purpose: formData.purpose,
      note: formData.note,
      is_active: formData.is_active,
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  const handleSubmitStatus = async () => {
    await onUpdateStatus?.({
      id: allocation.id,
      status: statusForm.status,
      note: statusForm.note,
    });
  };

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  const valuemap = {
    asset: "Tài sản",
    supply: "Vật tư",
    cancelled: "Đã huỷ",
    completed: "Hoàn thành",
    requested: "Đã yêu cầu",
    active: "Hoạt động",
    inactive: "Không hoạt động",
    returned: "Đã trả",
  };

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
        <ModalHeader>
          {isCreateMode
            ? isStaff
              ? "Tạo đề nghị cấp phát vật tư"
              : "Thêm allocation"
            : "Chi tiết bản cấp phát"}
        </ModalHeader>
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
                Allocation này đang ở trạng thái không hoạt động
              </Badge>
            ) : null}

            {!isCreateMode && (
              <Badge
                colorScheme="blue"
                borderRadius="999px"
                px="12px"
                py="6px"
                w="fit-content"
              >
                Resource: {resourceLabel}
              </Badge>
            )}

            {isStaff && isCreateMode ? (
              <Box
                border="1px solid"
                borderColor={sectionBorderColor}
                borderRadius="16px"
                p="14px"
              >
                <Text fontSize="sm" color="gray.500">
                  Staff chỉ có thể xem phiếu cấp phát của phòng ban mình và xác nhận đã nhận vật tư khi được cấp phát.
                </Text>
              </Box>
            ) : null}

            {isReadOnly ? (
              <>
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  gap="16px"
                >
                  <GridItem>
                    <FormControl>
                      <FormLabel>ID</FormLabel>
                      <Input value={allocation?.id || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Trạng thái hoạt động</FormLabel>
                      <Input
                        value={allocation?.is_active ? "Hoạt động" : "Không hoạt động"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Mã</FormLabel>
                      <Input
                        value={allocation?.allocation_code || ""}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Loại phân bổ</FormLabel>
                      <Input
                        value={valuemap[allocation.allocation_type] || "Không xác định"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Trạng thái</FormLabel>
                      <Input value={valuemap[allocation.status] || "Không xác định"} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Số lượng</FormLabel>
                      <Input value={allocation?.quantity || "1"} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Phòng ban được phân bổ</FormLabel>
                      <Input
                        value={allocation?.allocated_department || "-"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Người được phân bổ</FormLabel>
                      <Input
                        value={allocation?.allocated_user || "-"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Người phân bổ</FormLabel>
                      <Input
                        value={allocation?.allocated_by_user || "-"}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ngày dự kiến trả</FormLabel>
                      <Input
                        value={allocation?.expected_return_date || ""}
                        {...readOnlyFieldProps}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ngày phân bổ</FormLabel>
                      <Input value={allocation?.allocated_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Ngày trả</FormLabel>
                      <Input value={allocation?.returned_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Thời gian tạo</FormLabel>
                      <Input value={allocation?.created_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Thời gian cập nhật gần nhất</FormLabel>
                      <Input value={allocation?.updated_at || ""} {...readOnlyFieldProps} />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl>
                  <FormLabel>Mục đích</FormLabel>
                  <Textarea
                    value={allocation?.purpose || ""}
                    resize="vertical"
                    {...readOnlyFieldProps}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ghi chú</FormLabel>
                  <Textarea
                    value={allocation?.note || ""}
                    resize="vertical"
                    {...readOnlyFieldProps}
                  />
                </FormControl>
              </>
            ) : (
              <>
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  gap="16px"
                >
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Mã</FormLabel>
                      <Input
                        value={formData.allocation_code}
                        onChange={(e) =>
                          handleChange("allocation_code", e.target.value)
                        }
                        placeholder="VD: AL-001"
                        isReadOnly={!isCreateMode}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Loại phân bổ</FormLabel>
                      <Select
                        value={formData.allocation_type}
                        onChange={(e) =>
                          handleChange("allocation_type", e.target.value)
                        }
                        isDisabled={!isCreateMode || isStaff}
                      >
                        {(isStaff
                          ? ALLOCATION_TYPE_OPTIONS.filter(
                              (item) => item.value === "supply"
                            )
                          : ALLOCATION_TYPE_OPTIONS
                        ).map((option) => (
                          <option key={option.value} value={option.value}>
                            {valuemap[option.label] || option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  {isAssetType && !isStaff ? (
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
                  ) : null}

                  {isSupplyType ? (
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Vật tư</FormLabel>
                        <Select
                          value={formData.supply_id}
                          onChange={(e) => handleChange("supply_id", e.target.value)}
                          isDisabled={!isCreateMode}
                        >
                          <option value="">Chọn vật tư</option>
                          {supplyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                  ) : null}

                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Số lượng</FormLabel>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) => handleChange("quantity", e.target.value)}
                        isReadOnly={!isCreateMode || isAssetType}
                      />
                      <FormHelperText>
                        {isAssetType
                          ? "Phân bổ tài sản luôn có số lượng = 1."
                          : "Số lượng vật tư cần cấp phát."}
                      </FormHelperText>
                    </FormControl>
                  </GridItem>

                  {!isStaff ? (
                    <>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Phòng ban được phân bổ</FormLabel>
                          <Select
                            value={formData.allocated_department_id}
                            onChange={(e) =>
                              handleChange("allocated_department_id", e.target.value)
                            }
                          >
                            <option value="">Chưa chọn phòng ban</option>
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
                          <FormLabel>Người được phân bổ</FormLabel>
                          <Select
                            value={formData.allocated_user_id}
                            onChange={(e) =>
                              handleChange("allocated_user_id", e.target.value)
                            }
                          >
                            <option value="">Chưa chọn người dùng</option>
                            {userOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </GridItem>
                    </>
                  ) : null}

                  {!isStaff && isAssetType ? (
                    <GridItem>
                      <FormControl>
                        <FormLabel>Ngày dự kiến trả</FormLabel>
                        <Input
                          type="date"
                          value={formData.expected_return_date}
                          onChange={(e) =>
                            handleChange("expected_return_date", e.target.value)
                          }
                        />
                      </FormControl>
                    </GridItem>
                  ) : null}
                </Grid>

                <FormControl>
                  <FormLabel>Mục đích</FormLabel>
                  <Textarea
                    value={formData.purpose}
                    onChange={(e) => handleChange("purpose", e.target.value)}
                    placeholder={
                      isStaff
                        ? "Ví dụ: Đề nghị cấp giấy in cho phòng ban"
                        : "Mục đích cấp phát"
                    }
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

            {canShowStatusSection ? (
              <Box
                border="1px solid"
                borderColor={sectionBorderColor}
                borderRadius="16px"
                p="16px"
              >
                <Stack spacing="14px">
                  <Text fontSize="md" fontWeight="700">
                    {getStatusActionLabel({
                      allocation,
                      role: currentUserRole,
                    })}
                  </Text>

                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap="16px"
                  >
                    <GridItem>
                      <FormControl>
                        <FormLabel>Trạng thái</FormLabel>
                        <Select
                          value={statusForm.status}
                          onChange={(e) =>
                            handleStatusChange("status", e.target.value)
                          }
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl>
                        <FormLabel>Ghi chú cho cập nhật trạng thái</FormLabel>
                        <Input
                          value={statusForm.note}
                          onChange={(e) =>
                            handleStatusChange("note", e.target.value)
                          }
                          placeholder="Ghi chú cho trạng thái mới"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </Stack>
              </Box>
            ) : null}

            {!isCreateMode && isStaff && !canShowStatusSection ? (
              <Text fontSize="sm" color="gray.500">
                Tài khoản Staff của bạn có thể xem chi tiết phiếu. Với phiếu vật tư
                đang ở trạng thái <b>Hoạt động</b>, bạn sẽ thấy thêm nút xác nhận đã
                nhận.
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
                isDisabled={!canCreateAllocations}
              >
                {isStaff ? "Gửi đề nghị" : "Lưu"}
              </Button>
            </>
          ) : isReadOnly ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>

              {canShowStatusSection ? (
                <Button
                  colorScheme={isStaff ? "teal" : "teal"}
                  variant={isStaff ? "solid" : "outline"}
                  onClick={handleSubmitStatus}
                  isLoading={isUpdatingStatus}
                >
                  {isStaff ? "Xác nhận đã nhận" : "Cập nhật trạng thái"}
                </Button>
              ) : null}

              {canOpenEditMode ? (
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

              {canManageAllocations && canShowStatusSection ? (
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={handleSubmitStatus}
                  isLoading={isUpdatingStatus}
                >
                  Cập nhật trạng thái
                </Button>
              ) : null}

              {canDeactivateAllocationByRole && allocation?.is_active ? (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onDeactivate?.(allocation)}
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