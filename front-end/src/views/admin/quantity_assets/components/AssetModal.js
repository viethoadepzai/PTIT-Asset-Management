/*! =========================================================
* Horizon UI - Asset Modal
========================================================= */

import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";

import {
  AddIcon,
  DeleteIcon,
  CheckIcon,
} from "@chakra-ui/icons";

import {
  createLocation,
  createLostLocation,
  deleteLocation,
  approveLocation,
  approveLostLocation,
  listLocations,
} from "api/quantityAssetsApi";

const STATUS_OPTIONS = [
  { value: "available", label: "Sẵn sàng" },
  { value: "in_use", label: "Đang sử dụng" },
  { value: "under_maintenance", label: "Đang bảo trì" },
  { value: "damaged", label: "Bị hỏng" },
  { value: "liquidated", label: "Đã thanh lý" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "Mới" },
  { value: "good", label: "Tốt" },
  { value: "fair", label: "Khá" },
  { value: "poor", label: "Kém" },
  { value: "broken", label: "Hỏng" },
];

const APPROVAL_COLOR = {
  approved: "green",
  pending: "yellow",
  rejected: "red",
};

const APPROVAL_LABEL = {
  approved: "Đã duyệt",
  pending: "Chờ duyệt",
  rejected: "Từ chối",
};

const LOCATION_APPROVAL_COLOR = {
  approval: "green",
  pending: "yellow",
  not_approval: "red",
};

const LOCATION_APPROVAL_LABEL = {
  approval: "Đã duyệt",
  pending: "Chờ duyệt",
  not_approval: "Không duyệt",
};

const VALUE_LABELS = {
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

const initialFormData = {
  code: "",
  name: "",
  category_id: "",
  quantity: 0,
  specification: "",
  purchase_date: "",
  useful_life: 1,
  purchase_cost: "",
  status: "available",
  condition: "good",
  location: "",
  note: "",
  assigned_department_id: "",
  assigned_user_id: "",
  is_active: true,
};

function LocationTable({
  assetId,
  canManage,
  currentUserRole,
}) {
  const toast = useToast();

  const [locations, setLocations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const [roomCode, setRoomCode] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [reason, setReason] = React.useState("");

  const [adding, setAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const [approvingId, setApprovingId] = React.useState(null);

  const borderColor = useColorModeValue(
    "gray.200",
    "whiteAlpha.200"
  );

  const khoBg = useColorModeValue(
    "purple.50",
    "purple.900"
  );

  const fetchLocations = React.useCallback(async () => {
    try {
      setLoading(true);

      const data = await listLocations(assetId);

      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Không tải được danh sách vị trí",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [assetId, toast]);

  React.useEffect(() => {
    if (!assetId) return;

    fetchLocations();
  }, [assetId, fetchLocations]);

  const resetForm = () => {
    setRoomCode("");
    setQuantity("");
    setReason("");
  };

  const handleCreate = async () => {
    const qty = parseInt(quantity, 10);

    if (!roomCode.trim()) {
      toast({
        title: "Vui lòng nhập mã phòng",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Số lượng không hợp lệ",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      setAdding(true);

      await createLocation(assetId, {
        room_code: roomCode.trim(),
        quantity: qty,
        reason: reason?.trim() || null,
      });

      resetForm();

      await fetchLocations();

      toast({
        title: "Thêm vị trí thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Thêm vị trí thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setAdding(false);
    }
  };

  const handleCreateLost = async () => {
    const qty = parseInt(quantity, 10);

    if (!roomCode.trim()) {
      toast({
        title: "Vui lòng nhập mã phòng",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (isNaN(qty)) {
      toast({
        title: "Số lượng không hợp lệ",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      setAdding(true);

      await createLostLocation(assetId, {
        room_code: roomCode.trim(),
        quantity: qty,
        reason: reason?.trim() || null,
      });

      resetForm();

      await fetchLocations();

      toast({
        title: "Báo mất thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Báo mất thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (locationId) => {
    try {
      setDeletingId(locationId);

      await deleteLocation(assetId, locationId);

      await fetchLocations();

      toast({
        title: "Xóa vị trí thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Xóa vị trí thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleApprove = async (location) => {
    try {
      setApprovingId(location.id);

      if (location.quantity > 0) {
        await approveLocation(assetId, location.id, {
          room_code: location.room_code,
        });
      } else {
        await approveLostLocation(assetId, location.id, {
          room_code: location.room_code,
        });
      }

      await fetchLocations();

      toast({
        title: "Duyệt vị trí thành công",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Duyệt vị trí thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <Box py="10px">
        <Spinner size="sm" />
      </Box>
    );
  }

  return (
    <Box>
      <Box overflowX="auto">
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th borderColor={borderColor}>
                Mã phòng
              </Th>

              <Th borderColor={borderColor} isNumeric>
                Số lượng
              </Th>

              <Th borderColor={borderColor}>
                Lí do
              </Th>

              <Th borderColor={borderColor}>
                Trạng thái
              </Th>

              {canManage && (
                <Th borderColor={borderColor}>
                  Thao tác
                </Th>
              )}
            </Tr>
          </Thead>

          <Tbody>
            {locations.map((loc) => {
              const isKho = loc.room_code === "KHO";

              return (
                <Tr
                  key={loc.id}
                  bg={isKho ? khoBg : undefined}
                >
                  <Td fontWeight={isKho ? "700" : "500"}>
                    {loc.room_code}
                  </Td>

                  <Td isNumeric>
                    {loc.quantity}
                  </Td>

                  <Td>
                    {loc.reason || "-"}
                  </Td>

                  <Td>
                    <Badge
                      colorScheme={
                        LOCATION_APPROVAL_COLOR[
                        loc.status_approval
                        ] || "gray"
                      }
                      borderRadius="999px"
                      px="10px"
                    >
                      {
                        LOCATION_APPROVAL_LABEL[
                        loc.status_approval
                        ]
                      }
                    </Badge>
                  </Td>

                  {canManage && (
                    <Td>
                      <HStack spacing="6px">
                        {!(isKho && loc.status_approval?.toLowerCase() === "approval") && (
                          <IconButton
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            icon={<DeleteIcon />}
                            aria-label="delete"
                            isLoading={
                              deletingId === loc.id
                            }
                            onClick={() =>
                              handleDelete(loc.id)
                            }
                          />
                        )}

                        {currentUserRole ===
                          "admin" &&
                          loc.status_approval?.toLowerCase() !==
                          "approval" && (
                            <IconButton
                              size="xs"
                              colorScheme="green"
                              variant="ghost"
                              icon={<CheckIcon />}
                              aria-label="approve"
                              isLoading={
                                approvingId ===
                                loc.id
                              }
                              onClick={() =>
                                handleApprove(loc)
                              }
                            />
                          )}
                      </HStack>
                    </Td>
                  )}
                </Tr>
              );
            })}

            {locations.length === 0 && (
              <Tr>
                <Td
                  colSpan={5}
                  textAlign="center"
                  color="gray.500"
                >
                  Chưa có vị trí nào
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {canManage && (
        <HStack mt="12px" spacing="8px" flexWrap="wrap">
          <Input
            size="sm"
            placeholder="Mã phòng"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value)
            }
            maxW="150px"
          />

          <Input
            size="sm"
            type="number"
            placeholder="Số lượng"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
            maxW="120px"
          />

          <Input
            size="sm"
            placeholder="Lí do"
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            maxW="300px"
          />

          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<AddIcon />}
            isLoading={adding}
            onClick={handleCreate}
          >
            Thêm
          </Button>


        </HStack>
      )}
    </Box>
  );
}

export default function AssetModal(props) {
  const {
    asset,
    departmentOptions = [],
    categoryOptions = [],
    userOptions = [],

    isOpen,
    mode = "edit",

    isSubmitting = false,
    isApproving = false,
    isRejecting = false,
    isActivating = false,
    isDeactivating = false,

    onClose,
    onSave,
    onApprove,
    onReject,
    onActivate,
    onDeactivate,

    canManageAssets = false,
    canDeactivateAssetByRole = false,

    currentUserRole = "",
  } = props;

  const isCreateMode = mode === "create";

  const [isEditing, setIsEditing] =
    React.useState(isCreateMode);

  const [formData, setFormData] =
    React.useState(initialFormData);

  const modalBg = useColorModeValue(
    "white",
    "navy.800"
  );

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
      name: asset.name || "",
      category_id: asset.category_id
        ? String(asset.category_id)
        : "",

      quantity: asset.quantity || 0,

      specification:
        asset.specification || "",

      purchase_date:
        asset.purchase_date || "",

      useful_life:
        asset.useful_life || 1,

      purchase_cost:
        asset.purchase_cost || "",

      status:
        asset.status || "available",

      condition:
        asset.condition || "good",

      location:
        asset.location || "",

      note:
        asset.note || "",

      assigned_department_id:
        asset.assigned_department_id || "",

      assigned_user_id:
        asset.assigned_user_id || "",

      is_active:
        asset.is_active ?? true,
    });

    setIsEditing(false);
  }, [asset, isCreateMode, isOpen]);

  if (!isCreateMode && !asset) {
    return null;
  }

  const approvalStatus =
    asset?.approval_status || "pending";

  const isApproved =
    approvalStatus === "approved";

  const isPending =
    approvalStatus === "pending";

  const canApproveReject =
    canDeactivateAssetByRole &&
    isPending &&
    !isCreateMode;

  const isReadOnly =
    !isCreateMode &&
    (!isEditing || !canManageAssets);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode
        ? {}
        : { id: asset.id }),

      code: formData.code,
      name: formData.name,

      category_id: formData.category_id
        ? parseInt(formData.category_id, 10)
        : null,

      quantity: parseInt(
        formData.quantity,
        10
      ),

      specification:
        formData.specification,

      purchase_date:
        formData.purchase_date,

      useful_life: parseInt(
        formData.useful_life,
        10
      ),

      purchase_cost:
        formData.purchase_cost,

      status: formData.status,

      condition: formData.condition,

      location: formData.location,

      note: formData.note,

      assigned_department_id:
        formData.assigned_department_id ||
        null,

      assigned_user_id:
        formData.assigned_user_id ||
        null,

      is_active:
        formData.is_active,
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  const readOnlyProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  const modalTitle = isCreateMode
    ? currentUserRole === "manager"
      ? "Yêu cầu thêm lô tài sản"
      : "Thêm lô tài sản"
    : "Chi tiết lô tài sản";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />

      <ModalContent
        bg={modalBg}
        borderRadius="20px"
      >
        <ModalHeader>
          {modalTitle}
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          {isReadOnly ? (
            <Stack spacing="16px">
              <HStack>
                <Badge
                  colorScheme={
                    APPROVAL_COLOR[
                    approvalStatus
                    ]
                  }
                  borderRadius="999px"
                  px="12px"
                  py="6px"
                >
                  {
                    APPROVAL_LABEL[
                    approvalStatus
                    ]
                  }
                </Badge>

                {!asset?.is_active && (
                  <Badge
                    colorScheme="red"
                    borderRadius="999px"
                    px="12px"
                    py="6px"
                  >
                    Không hoạt động
                  </Badge>
                )}
              </HStack>

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap="16px"
              >
                <GridItem>
                  <FormControl>
                    <FormLabel>
                      ID
                    </FormLabel>

                    <Input
                      value={
                        asset?.id || ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Mã lô
                    </FormLabel>

                    <Input
                      value={
                        asset?.code || ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Tên
                    </FormLabel>

                    <Input
                      value={
                        asset?.name || ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Danh mục
                    </FormLabel>

                    <Input
                      value={
                        asset?.category ||
                        ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Trạng thái
                    </FormLabel>

                    <Input
                      value={
                        VALUE_LABELS[
                        asset?.status
                        ] || ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Tình trạng
                    </FormLabel>

                    <Input
                      value={
                        VALUE_LABELS[
                        asset?.condition
                        ] || ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Số lượng
                    </FormLabel>

                    <Input
                      value={
                        asset?.quantity || 0
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Giá mua
                    </FormLabel>

                    <Input
                      value={
                        asset?.purchase_cost ||
                        ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Ngày mua
                    </FormLabel>

                    <Input
                      value={
                        asset?.purchase_date ||
                        ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Khấu hao
                    </FormLabel>

                    <Input
                      value={
                        asset?.useful_life ||
                        0
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Vị trí
                    </FormLabel>

                    <Input
                      value={
                        asset?.location ||
                        ""
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Phòng ban
                    </FormLabel>

                    <Input
                      value={
                        asset?.assigned_department ||
                        "-"
                      }
                      {...readOnlyProps}
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              {/* QR Code removed for QuantityAssets */}

              <FormControl>
                <FormLabel>
                  Thông số
                </FormLabel>

                <Textarea
                  value={
                    asset?.specification ||
                    ""
                  }
                  resize="vertical"
                  {...readOnlyProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Ghi chú
                </FormLabel>

                <Textarea
                  value={
                    asset?.note || ""
                  }
                  resize="vertical"
                  {...readOnlyProps}
                />
              </FormControl>

              {isApproved && (
                <>
                  <Divider />

                  <Box>
                    <Text
                      fontWeight="700"
                      mb="10px"
                    >
                      Phân bổ vị trí
                    </Text>

                    <LocationTable
                      assetId={asset?.id}
                      canManage={
                        canManageAssets
                      }
                      currentUserRole={
                        currentUserRole
                      }
                    />
                  </Box>
                </>
              )}
            </Stack>
          ) : (
            <Stack spacing="16px">
              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap="16px"
              >
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>
                      Mã lô
                    </FormLabel>

                    <Input
                      value={formData.code}
                      onChange={(e) =>
                        handleChange(
                          "code",
                          e.target.value
                        )
                      }
                      isDisabled={
                        !isCreateMode
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>
                      Tên
                    </FormLabel>

                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        handleChange(
                          "name",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>
                      Danh mục
                    </FormLabel>

                    <Select
                      value={
                        formData.category_id
                      }
                      onChange={(e) =>
                        handleChange(
                          "category_id",
                          e.target.value
                        )
                      }
                      isDisabled={
                        !isCreateMode
                      }
                    >
                      <option value="">
                        -- Chọn danh mục --
                      </option>

                      {categoryOptions.map(
                        (item) => (
                          <option
                            key={item.value}
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Trạng thái
                    </FormLabel>

                    <Select
                      value={
                        formData.status
                      }
                      onChange={(e) =>
                        handleChange(
                          "status",
                          e.target.value
                        )
                      }
                    >
                      {STATUS_OPTIONS.map(
                        (item) => (
                          <option
                            key={item.value}
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>
                      Số lượng
                    </FormLabel>

                    <Input
                      type="number"
                      min="0"
                      value={
                        formData.quantity
                      }
                      onChange={(e) =>
                        handleChange(
                          "quantity",
                          e.target.value
                        )
                      }
                      isDisabled={
                        !isCreateMode
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Giá mua
                    </FormLabel>

                    <Input
                      type="number"
                      min="0"
                      value={
                        formData.purchase_cost
                      }
                      onChange={(e) =>
                        handleChange(
                          "purchase_cost",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Ngày mua
                    </FormLabel>

                    <Input
                      type="date"
                      value={
                        formData.purchase_date
                      }
                      onChange={(e) =>
                        handleChange(
                          "purchase_date",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Khấu hao
                    </FormLabel>

                    <Input
                      type="number"
                      min="0"
                      value={
                        formData.useful_life
                      }
                      onChange={(e) =>
                        handleChange(
                          "useful_life",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Tình trạng
                    </FormLabel>

                    <Select
                      value={
                        formData.condition
                      }
                      onChange={(e) =>
                        handleChange(
                          "condition",
                          e.target.value
                        )
                      }
                    >
                      {CONDITION_OPTIONS.map(
                        (item) => (
                          <option
                            key={item.value}
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Vị trí
                    </FormLabel>

                    <Input
                      value={
                        formData.location
                      }
                      onChange={(e) =>
                        handleChange(
                          "location",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Phòng ban
                    </FormLabel>

                    <Select
                      value={
                        formData.assigned_department_id
                      }
                      onChange={(e) =>
                        handleChange(
                          "assigned_department_id",
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Chưa giao
                      </option>

                      {departmentOptions.map(
                        (item) => (
                          <option
                            key={item.value}
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>
                      Người phụ trách
                    </FormLabel>

                    <Select
                      value={
                        formData.assigned_user_id
                      }
                      onChange={(e) =>
                        handleChange(
                          "assigned_user_id",
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Chưa giao
                      </option>

                      {userOptions.map(
                        (item) => (
                          <option
                            key={item.value}
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </Select>
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl>
                <FormLabel>
                  Thông số
                </FormLabel>

                <Textarea
                  value={
                    formData.specification
                  }
                  onChange={(e) =>
                    handleChange(
                      "specification",
                      e.target.value
                    )
                  }
                  resize="vertical"
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Ghi chú
                </FormLabel>

                <Textarea
                  value={formData.note}
                  onChange={(e) =>
                    handleChange(
                      "note",
                      e.target.value
                    )
                  }
                  resize="vertical"
                />
              </FormControl>

              {!isCreateMode && (
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
                      handleChange(
                        "is_active",
                        e.target.checked
                      )
                    }
                  />
                </FormControl>
              )}
            </Stack>
          )}
        </ModalBody>

        <ModalFooter gap="12px" flexWrap="wrap">
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
                isLoading={
                  isSubmitting
                }
              >
                {currentUserRole ===
                  "manager"
                  ? "Gửi yêu cầu"
                  : "Lưu"}
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

              {canApproveReject && (
                <>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={() =>
                      onReject?.(asset)
                    }
                    isLoading={
                      isRejecting
                    }
                  >
                    Không duyệt
                  </Button>

                  <Button
                    colorScheme="green"
                    onClick={() =>
                      onApprove?.(asset)
                    }
                    isLoading={
                      isApproving
                    }
                  >
                    Duyệt
                  </Button>
                </>
              )}

              {canManageAssets && (
                <Button
                  colorScheme="blue"
                  onClick={() =>
                    setIsEditing(true)
                  }
                >
                  Sửa
                </Button>
              )}
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

              {canDeactivateAssetByRole &&
                (asset?.is_active ? (
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={() =>
                      onDeactivate?.(
                        asset
                      )
                    }
                    isLoading={
                      isDeactivating
                    }
                  >
                    Vô hiệu hóa
                  </Button>
                ) : (
                  <Button
                    colorScheme="green"
                    variant="outline"
                    onClick={() =>
                      onActivate?.(
                        asset
                      )
                    }
                    isLoading={
                      isActivating
                    }
                  >
                    Kích hoạt
                  </Button>
                ))}

              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={
                  isSubmitting
                }
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