import React from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
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
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";

const createEmptyExportItem = () => ({
  supply_id: "",
  quantity: 1,
  note: "",
});

export default function SupplyExportModal({
  isOpen,
  onClose,
  mode,
  activeVoucher,
  createForm,
  setCreateForm,
  cancelNote,
  setCancelNote,
  departments = [],
  availableSupplies = [],
  currentUserRole = "",
  loading = false,
  onSubmit,
}) {
  if (!mode) return null;

  const updateCreateItem = (index, field, value) => {
    setCreateForm((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value,
      };
      return {
        ...prev,
        items: nextItems,
      };
    });
  };

  const addCreateItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyExportItem()],
    }));
  };

  const removeCreateItem = (index) => {
    setCreateForm((prev) => {
      if (prev.items.length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const getTitle = () => {
    if (mode === "create") return "Tạo phiếu xuất vật tư";
    if (mode === "cancel") {
      return `Hủy phiếu xuất${
        activeVoucher?.voucher_code ? ` - ${activeVoucher.voucher_code}` : ""
      }`;
    }
    return "";
  };

  const getSubmitText = () => {
    if (mode === "create") return "Lưu phiếu xuất";
    if (mode === "cancel") return "Xác nhận hủy";
    return "Lưu";
  };

  const getSubmitColor = () => {
    if (mode === "create") return "blue";
    if (mode === "cancel") return "red";
    return "blue";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={mode === "create" ? "5xl" : "xl"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{getTitle()}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {mode === "create" && (
            <VStack spacing="16px" align="stretch">
              <FormControl isRequired>
                <FormLabel>Phòng ban nhận</FormLabel>
                <Select
                  placeholder="Chọn phòng ban"
                  value={createForm.recipient_department_id}
                  isDisabled={currentUserRole === "staff"}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      recipient_department_id: e.target.value,
                    }))
                  }
                >
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Lý do xuất</FormLabel>
                <Textarea
                  rows={3}
                  value={createForm.reason}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ghi chú chung</FormLabel>
                <Textarea
                  rows={3}
                  value={createForm.note}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
              </FormControl>

              <Box borderWidth="1px" borderRadius="12px" p="16px">
                <HStack justify="space-between" mb="12px">
                  <Text fontWeight="bold">Danh sách vật tư</Text>
                  <Button size="sm" leftIcon={<AddIcon />} onClick={addCreateItem}>
                    Thêm vật tư
                  </Button>
                </HStack>

                <VStack spacing="12px" align="stretch">
                  {createForm.items.map((item, index) => (
                    <Box key={index} borderWidth="1px" borderRadius="10px" p="12px">
                      <HStack spacing="12px" align="start">
                        <FormControl isRequired>
                          <FormLabel>Vật tư</FormLabel>
                          <Select
                            placeholder="Chọn vật tư"
                            value={item.supply_id}
                            onChange={(e) =>
                              updateCreateItem(index, "supply_id", e.target.value)
                            }
                          >
                            {availableSupplies.map((supply) => (
                              <option key={supply.id} value={supply.id}>
                                {supply.supply_code || supply.code || `#${supply.id}`} -{" "}
                                {supply.name}
                                {supply.current_stock !== undefined
                                  ? ` (Tồn: ${supply.current_stock})`
                                  : ""}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl isRequired maxW="150px">
                          <FormLabel>Số lượng</FormLabel>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCreateItem(index, "quantity", e.target.value)
                            }
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Ghi chú item</FormLabel>
                          <Input
                            value={item.note}
                            onChange={(e) => updateCreateItem(index, "note", e.target.value)}
                          />
                        </FormControl>

                        <FormControl maxW="52px">
                          <FormLabel>&nbsp;</FormLabel>
                          <IconButton
                            aria-label="Xóa item"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeCreateItem(index)}
                            isDisabled={createForm.items.length <= 1}
                          />
                        </FormControl>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          )}

          {mode === "cancel" && (
            <FormControl>
              <FormLabel>Lý do hủy / ghi chú</FormLabel>
              <Textarea
                rows={4}
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
              />
            </FormControl>
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