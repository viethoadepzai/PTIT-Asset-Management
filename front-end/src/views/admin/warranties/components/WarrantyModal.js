import React from "react";
import {
  Box,
  Button,
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
  Select,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

export default function WarrantyModal({
  isOpen,
  onClose,
  mode,
  activeTicket,
  createForm,
  setCreateForm,
  sendForm,
  setSendForm,
  completeForm,
  setCompleteForm,
  cancelNote,
  setCancelNote,
  availableAssets = [],
  currentUserRole = "",
  loading = false,
  onSubmit,
}) {
  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();
  const isStaff = normalizedRole === "staff";

  const modalBg = useColorModeValue("white", "navy.800");
  const infoBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const infoBorderColor = useColorModeValue("gray.200", "whiteAlpha.200");

  if (!mode) return null;

  const getTitle = () => {
    if (mode === "create") {
      return isStaff ? "Tạo yêu cầu bảo hành" : "Tạo phiếu bảo hành";
    }
    if (mode === "send") {
      return `Gửi bảo hành${
        activeTicket?.warranty_code ? ` - ${activeTicket.warranty_code}` : ""
      }`;
    }
    if (mode === "complete") {
      return `Hoàn tất bảo hành${
        activeTicket?.warranty_code ? ` - ${activeTicket.warranty_code}` : ""
      }`;
    }
    if (mode === "cancel") {
      return `Hủy phiếu bảo hành${
        activeTicket?.warranty_code ? ` - ${activeTicket.warranty_code}` : ""
      }`;
    }
    return "";
  };

  const getSubmitText = () => {
    if (mode === "create") return isStaff ? "Gửi yêu cầu" : "Lưu phiếu bảo hành";
    if (mode === "send") return "Xác nhận gửi";
    if (mode === "complete") return "Xác nhận hoàn tất";
    if (mode === "cancel") return "Xác nhận hủy";
    return "Lưu";
  };

  const getSubmitColor = () => {
    if (mode === "create") return "blue";
    if (mode === "send") return "blue";
    if (mode === "complete") return "green";
    if (mode === "cancel") return "red";
    return "blue";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={mode === "create" ? "4xl" : "xl"}>
      <ModalOverlay />
      <ModalContent bg={modalBg}>
        <ModalHeader>{getTitle()}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {mode === "create" && (
            <VStack spacing="16px" align="stretch">
              {isStaff ? (
                <Box
                  border="1px solid"
                  borderColor={infoBorderColor}
                  bg={infoBg}
                  borderRadius="14px"
                  p="14px"
                >
                  <Text fontSize="sm" color="gray.500">
                    Staff chỉ tạo <b>yêu cầu bảo hành</b>. Các bước gửi bảo hành,
                    hoàn tất hoặc hủy sẽ do admin hoặc manager xử lý.
                  </Text>
                </Box>
              ) : null}

              <FormControl isRequired>
                <FormLabel>Tài sản</FormLabel>
                <Select
                  placeholder="Chọn tài sản"
                  value={createForm.asset_id}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, asset_id: e.target.value }))
                  }
                >
                  {availableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_code || asset.code || `#${asset.id}`} -{" "}
                      {asset.name || asset.asset_name || ""}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <HStack spacing="16px" align="start">
                <FormControl>
                  <FormLabel>Nhà cung cấp</FormLabel>
                  <Input
                    value={createForm.vendor_name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, vendor_name: e.target.value }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Liên hệ nhà cung cấp</FormLabel>
                  <Input
                    value={createForm.provider_contact}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        provider_contact: e.target.value,
                      }))
                    }
                  />
                </FormControl>
              </HStack>

              <HStack spacing="16px" align="start">
                <FormControl>
                  <FormLabel>Ngày bắt đầu BH</FormLabel>
                  <Input
                    type="date"
                    value={createForm.warranty_start_date}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        warranty_start_date: e.target.value,
                      }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ngày hết hạn BH</FormLabel>
                  <Input
                    type="date"
                    value={createForm.warranty_end_date}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        warranty_end_date: e.target.value,
                      }))
                    }
                  />
                </FormControl>
              </HStack>

              {!isStaff ? (
                <HStack spacing="16px" align="start">
                  <FormControl>
                    <FormLabel>Ngày gửi BH</FormLabel>
                    <Input
                      type="date"
                      value={createForm.sent_date}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          sent_date: e.target.value,
                        }))
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Ngày dự kiến nhận lại</FormLabel>
                    <Input
                      type="date"
                      value={createForm.expected_return_date}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          expected_return_date: e.target.value,
                        }))
                      }
                    />
                  </FormControl>
                </HStack>
              ) : null}

              <FormControl isRequired>
                <FormLabel>Mô tả lỗi / sự cố</FormLabel>
                <Textarea
                  rows={4}
                  value={createForm.issue_description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      issue_description: e.target.value,
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ghi chú</FormLabel>
                <Textarea
                  rows={3}
                  value={createForm.note}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
              </FormControl>
            </VStack>
          )}

          {mode === "send" && (
            <VStack spacing="16px" align="stretch">
              <Box
                border="1px solid"
                borderColor={infoBorderColor}
                bg={infoBg}
                borderRadius="14px"
                p="14px"
              >
                <Text fontSize="sm" color="gray.500">
                  Phiếu: <b>{activeTicket?.warranty_code || "-"}</b>
                </Text>
              </Box>

              <HStack spacing="16px" align="start">
                <FormControl>
                  <FormLabel>Ngày gửi</FormLabel>
                  <Input
                    type="date"
                    value={sendForm.sent_date}
                    onChange={(e) =>
                      setSendForm((prev) => ({ ...prev, sent_date: e.target.value }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ngày dự kiến nhận lại</FormLabel>
                  <Input
                    type="date"
                    value={sendForm.expected_return_date}
                    onChange={(e) =>
                      setSendForm((prev) => ({
                        ...prev,
                        expected_return_date: e.target.value,
                      }))
                    }
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Ghi chú</FormLabel>
                <Textarea
                  rows={3}
                  value={sendForm.note}
                  onChange={(e) =>
                    setSendForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
              </FormControl>
            </VStack>
          )}

          {mode === "complete" && (
            <VStack spacing="16px" align="stretch">
              <Box
                border="1px solid"
                borderColor={infoBorderColor}
                bg={infoBg}
                borderRadius="14px"
                p="14px"
              >
                <Text fontSize="sm" color="gray.500">
                  Phiếu: <b>{activeTicket?.warranty_code || "-"}</b>
                </Text>
              </Box>

              <FormControl isRequired>
                <FormLabel>Ngày nhận lại</FormLabel>
                <Input
                  type="date"
                  value={completeForm.received_back_date}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({
                      ...prev,
                      received_back_date: e.target.value,
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Nội dung xử lý</FormLabel>
                <Textarea
                  rows={4}
                  value={completeForm.resolution_note}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({
                      ...prev,
                      resolution_note: e.target.value,
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Chi phí bảo trì / sửa chữa</FormLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={completeForm.maintenance_cost}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({
                      ...prev,
                      maintenance_cost: e.target.value,
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ghi chú</FormLabel>
                <Textarea
                  rows={3}
                  value={completeForm.note}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
              </FormControl>
            </VStack>
          )}

          {mode === "cancel" && (
            <VStack spacing="16px" align="stretch">
              <Box
                border="1px solid"
                borderColor={infoBorderColor}
                bg={infoBg}
                borderRadius="14px"
                p="14px"
              >
                <Text fontSize="sm" color="gray.500">
                  Phiếu: <b>{activeTicket?.warranty_code || "-"}</b>
                </Text>
              </Box>

              <FormControl>
                <FormLabel>Ghi chú hủy</FormLabel>
                <Textarea
                  rows={4}
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                />
              </FormControl>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing="12px">
            <Button variant="ghost" onClick={onClose} isDisabled={loading}>
              Hủy
            </Button>
            <Button
              colorScheme={getSubmitColor()}
              onClick={onSubmit}
              isLoading={loading}
            >
              {getSubmitText()}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}