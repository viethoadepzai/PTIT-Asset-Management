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

const createEmptyLoanItem = () => ({
  asset_id: "",
  note: "",
});

export default function AssetLoanModal({
  isOpen,
  onClose,
  mode,
  activeLoan,
  createForm,
  setCreateForm,
  receiveForm,
  setReceiveForm,
  returnForm,
  setReturnForm,
  cancelNote,
  setCancelNote,
  departments = [],
  users = [],
  availableAssets = [],
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
      items: [...prev.items, createEmptyLoanItem()],
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

  const updateReturnItem = (index, field, value) => {
    setReturnForm((prev) => {
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

  const getTitle = () => {
    if (mode === "create") return "Tạo phiếu mượn tài sản";
    if (mode === "receive") {
      return `Xác nhận đã nhận tài sản${
        activeLoan?.voucher_code ? ` - ${activeLoan.voucher_code}` : ""
      }`;
    }
    if (mode === "return") {
      return `Trả tài sản${
        activeLoan?.voucher_code ? ` - ${activeLoan.voucher_code}` : ""
      }`;
    }
    if (mode === "cancel") {
      return `Hủy phiếu mượn${
        activeLoan?.voucher_code ? ` - ${activeLoan.voucher_code}` : ""
      }`;
    }
    return "";
  };

  const getSubmitText = () => {
    if (mode === "create") return "Lưu phiếu mượn";
    if (mode === "receive") return "Xác nhận đã nhận";
    if (mode === "return") return "Xác nhận trả";
    if (mode === "cancel") return "Xác nhận hủy";
    return "Lưu";
  };

  const getSubmitColor = () => {
    if (mode === "create") return "blue";
    if (mode === "receive") return "teal";
    if (mode === "return") return "green";
    if (mode === "cancel") return "red";
    return "blue";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={mode === "create" ? "5xl" : "xl"}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{getTitle()}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {mode === "create" && (
            <VStack spacing="16px" align="stretch">
              <HStack spacing="16px" align="start">
                <FormControl isRequired>
                  <FormLabel>Ngày mượn</FormLabel>
                  <Input
                    type="date"
                    value={createForm.loan_date}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        loan_date: e.target.value,
                      }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ngày trả dự kiến</FormLabel>
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

              <HStack spacing="16px" align="start">
                <FormControl>
                  <FormLabel>Phòng ban mượn</FormLabel>
                  <Select
                    placeholder="Chọn phòng ban"
                    value={createForm.borrower_department_id}
                    isDisabled={currentUserRole === "staff"}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        borrower_department_id: e.target.value,
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
                  <FormLabel>Người mượn</FormLabel>
                  <Select
                    placeholder="Chọn người mượn"
                    value={createForm.borrower_user_id}
                    isDisabled={currentUserRole === "staff"}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        borrower_user_id: e.target.value,
                      }))
                    }
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.username}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Mục đích mượn</FormLabel>
                <Textarea
                  rows={3}
                  value={createForm.purpose}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      purpose: e.target.value,
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ghi chú chung</FormLabel>
                <Textarea
                  rows={3}
                  value={createForm.note}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                />
              </FormControl>

              <Box borderWidth="1px" borderRadius="12px" p="16px">
                <HStack justify="space-between" mb="12px">
                  <Text fontWeight="bold">Danh sách tài sản</Text>
                  <Button size="sm" leftIcon={<AddIcon />} onClick={addCreateItem}>
                    Thêm tài sản
                  </Button>
                </HStack>

                <VStack spacing="12px" align="stretch">
                  {createForm.items.map((item, index) => (
                    <Box key={index} borderWidth="1px" borderRadius="10px" p="12px">
                      <HStack spacing="12px" align="start">
                        <FormControl isRequired>
                          <FormLabel>Tài sản</FormLabel>
                          <Select
                            placeholder="Chọn tài sản"
                            value={item.asset_id}
                            onChange={(e) =>
                              updateCreateItem(index, "asset_id", e.target.value)
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

                        <FormControl>
                          <FormLabel>Ghi chú item</FormLabel>
                          <Input
                            value={item.note}
                            onChange={(e) =>
                              updateCreateItem(index, "note", e.target.value)
                            }
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

          {mode === "receive" && (
            <VStack spacing="16px" align="stretch">
              <Box borderWidth="1px" borderRadius="12px" p="14px">
                <Text fontWeight="semibold" mb="6px">
                  Phiếu mượn
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {activeLoan?.voucher_code || "-"}
                </Text>
              </Box>

              <Box borderWidth="1px" borderRadius="12px" p="14px">
                <Text fontWeight="semibold" mb="6px">
                  Danh sách tài sản
                </Text>
                <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">
                  {activeLoan?.items_summary || "Không có dữ liệu tài sản."}
                </Text>
              </Box>

              <FormControl>
                <FormLabel>Ghi chú khi nhận</FormLabel>
                <Textarea
                  rows={4}
                  value={receiveForm?.note || ""}
                  onChange={(e) =>
                    setReceiveForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Đã nhận đủ tài sản, kiểm tra ngoại quan đầy đủ..."
                />
              </FormControl>
            </VStack>
          )}

          {mode === "return" && (
            <VStack spacing="16px" align="stretch">
              <HStack spacing="16px" align="start">
                <FormControl isRequired>
                  <FormLabel>Ngày trả thực tế</FormLabel>
                  <Input
                    type="date"
                    value={returnForm.actual_return_date}
                    onChange={(e) =>
                      setReturnForm((prev) => ({
                        ...prev,
                        actual_return_date: e.target.value,
                      }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ghi chú khi trả</FormLabel>
                  <Input
                    value={returnForm.note}
                    onChange={(e) =>
                      setReturnForm((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                  />
                </FormControl>
              </HStack>

              <VStack spacing="12px" align="stretch">
                {returnForm.items.map((item, index) => (
                  <Box key={item.item_id} borderWidth="1px" borderRadius="10px" p="12px">
                    <Text fontWeight="semibold" mb="12px">
                      {item.asset_label}
                    </Text>

                    <HStack spacing="12px" align="start">
                      <FormControl isRequired>
                        <FormLabel>Tình trạng sau khi trả</FormLabel>
                        <Input
                          placeholder="Ví dụ: good, damaged..."
                          value={item.condition_after_return}
                          onChange={(e) =>
                            updateReturnItem(
                              index,
                              "condition_after_return",
                              e.target.value
                            )
                          }
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Ghi chú item</FormLabel>
                        <Input
                          value={item.note}
                          onChange={(e) =>
                            updateReturnItem(index, "note", e.target.value)
                          }
                        />
                      </FormControl>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </VStack>
          )}

          {mode === "cancel" && (
            <FormControl>
              <FormLabel>Lý do hủy</FormLabel>
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