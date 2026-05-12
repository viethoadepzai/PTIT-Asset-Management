import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
} from "@chakra-ui/react";

export default function AuditModal({
  isOpen,
  onClose,
  mode, // "create" | "edit"
  formData,
  setFormData,
  departmentOptions,
  userOptions,
  onSave,
  saving,
}) {
  const isEdit = mode === "edit";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEdit ? "Sửa đợt kiểm kê" : "Tạo lịch kiểm kê mới"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {!isEdit && (
              <FormControl isRequired>
                <FormLabel>Mã đợt kiểm kê</FormLabel>
                <Input
                  placeholder="VD: AUD-2026-01"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </FormControl>
            )}

            {!isEdit && (
              <FormControl isRequired>
                <FormLabel>Phòng ban</FormLabel>
                <Select
                  placeholder="-- Chọn phòng ban --"
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value })
                  }
                >
                  {departmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl isRequired>
              <FormLabel>Ngày dự kiến kiểm kê</FormLabel>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Người kiểm tra (Phân công)</FormLabel>
              <Select
                placeholder="-- Chưa phân công --"
                value={formData.assigned_to_user_id}
                onChange={(e) =>
                  setFormData({ ...formData, assigned_to_user_id: e.target.value })
                }
              >
                {userOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={saving}>
            Hủy
          </Button>
          <Button colorScheme="blue" onClick={onSave} isLoading={saving}>
            Lưu
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
