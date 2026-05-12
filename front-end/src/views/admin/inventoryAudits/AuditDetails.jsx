import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
  Divider,
} from "@chakra-ui/react";
import { ArrowBackIcon, CheckIcon } from "@chakra-ui/icons";
import { useParams, useNavigate } from "react-router-dom";

import Card from "components/card/Card";
import { getCurrentUser } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import {
  getInventoryAuditDetail,
  bulkUpdateInventoryAuditItems,
  startInventoryAudit,
  submitInventoryAudit,
  approveInventoryAudit,
  completeInventoryAudit,
  cancelInventoryAudit,
} from "api/inventoryAuditsApi";

const STATUS_COLOR = {
  scheduled: "gray",
  in_progress: "blue",
  submitted: "orange",
  approved: "teal",
  completed: "green",
  cancelled: "red",
};

const STATUS_LABEL = {
  scheduled: "Lên lịch",
  in_progress: "Đang kiểm kê",
  submitted: "Chờ duyệt",
  approved: "Đã duyệt",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

export default function AuditDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = React.useState(true);
  const [audit, setAudit] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  
  // Local state for table editing
  const [editData, setEditData] = React.useState({});

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const bgCard = useColorModeValue("white", "navy.800");

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [user, auditData] = await Promise.all([
        getCurrentUser(),
        getInventoryAuditDetail(id),
      ]);
      setCurrentUser(user);
      setAudit(auditData);
      setItems(auditData.items || []);

      // Init edit state
      const initialEdits = {};
      (auditData.items || []).forEach(item => {
        initialEdits[item.id] = {
          actual_quantity: item.actual_quantity,
          damaged_quantity: item.damaged_quantity,
          notes: item.notes || "",
        };
      });
      setEditData(initialEdits);

    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: error.message,
        status: "error",
        duration: 3000,
      });
      if (!isUnauthorizedError(error)) {
        navigate("/admin/inventory-audits");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditChange = (itemId, field, value) => {
    setEditData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      }
    }));
  };

  const handleSaveItems = async () => {
    try {
      setSaving(true);
      const payloads = Object.keys(editData).map(itemId => ({
        id: parseInt(itemId, 10),
        actual_quantity: parseInt(editData[itemId].actual_quantity, 10) || 0,
        damaged_quantity: parseInt(editData[itemId].damaged_quantity, 10) || 0,
        notes: editData[itemId].notes,
      }));
      await bulkUpdateInventoryAuditItems(id, payloads);
      toast({ title: "Đã lưu số liệu", status: "success", duration: 2000 });
      await loadData();
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, status: "error", duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleWorkflow = async (action) => {
    try {
      setSaving(true);
      if (action === "start") await startInventoryAudit(id);
      if (action === "submit") await submitInventoryAudit(id);
      if (action === "approve") await approveInventoryAudit(id);
      if (action === "complete") await completeInventoryAudit(id);
      if (action === "cancel") await cancelInventoryAudit(id);
      toast({ title: "Thành công", status: "success", duration: 2000 });
      await loadData();
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, status: "error", duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box pt={{ base: "130px", md: "80px" }}>
        <Flex justify="center" py="40px"><Spinner size="xl" /></Flex>
      </Box>
    );
  }

  if (!audit) return null;

  const role = currentUser?.role;
  const isAssigned = audit.assigned_to_user_id === currentUser?.id;
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  
  const canEditItems = audit.status === "in_progress" && (isAdmin || isAssigned);

  return (
    <Box pt={{ base: "130px", md: "80px" }}>
      <Flex mb="20px">
        <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => navigate("/admin/inventory-audits")}>
          Quay lại
        </Button>
      </Flex>

      <Card bg={bgCard} p="24px" mb="24px">
        <Flex justify="space-between" align="center" mb="20px">
          <Text fontSize="xl" fontWeight="bold" color={textColor}>Chi tiết đợt kiểm kê #{audit.code}</Text>
          <Badge colorScheme={STATUS_COLOR[audit.status]} px="3" py="1" borderRadius="md" fontSize="md">
            {STATUS_LABEL[audit.status]}
          </Badge>
        </Flex>

        <HStack spacing={10} align="flex-start">
          <VStack align="start" spacing={3}>
            <Text><b>Phòng ban:</b> {audit.department_code} - {audit.department_name}</Text>
            <Text><b>Ngày dự kiến:</b> {new Date(audit.scheduled_date).toLocaleDateString("vi-VN")}</Text>
            <Text><b>Ngày hoàn tất:</b> {audit.completed_at ? new Date(audit.completed_at).toLocaleString("vi-VN") : "-"}</Text>
          </VStack>
          <VStack align="start" spacing={3}>
            <Text><b>Người tạo:</b> {audit.created_by_user_name || "-"}</Text>
            <Text><b>Được phân công:</b> {audit.assigned_to_user_name || "-"}</Text>
            <Text><b>Người duyệt:</b> {audit.approved_by_user_name || "-"}</Text>
          </VStack>
        </HStack>

        <Divider my="20px" />

        <Flex gap={3} flexWrap="wrap">
          {audit.status === "scheduled" && (isAdmin || isAssigned) && (
            <Button colorScheme="blue" onClick={() => handleWorkflow("start")} isLoading={saving}>Bắt đầu kiểm kê</Button>
          )}
          {audit.status === "in_progress" && (isAdmin || isAssigned) && (
            <Button colorScheme="orange" onClick={() => handleWorkflow("submit")} isLoading={saving}>Gửi duyệt</Button>
          )}
          {audit.status === "submitted" && isAdmin && (
            <Button colorScheme="teal" onClick={() => handleWorkflow("approve")} isLoading={saving}>Phê duyệt</Button>
          )}
          {audit.status === "approved" && isAdmin && (
            <Button colorScheme="green" onClick={() => handleWorkflow("complete")} isLoading={saving}>Hoàn tất (Chốt số liệu)</Button>
          )}
          {(audit.status === "scheduled" || audit.status === "in_progress") && isAdmin && (
            <Button colorScheme="red" variant="outline" onClick={() => handleWorkflow("cancel")} isLoading={saving}>Hủy</Button>
          )}
        </Flex>
      </Card>

      <Card bg={bgCard} p="24px">
        <Flex justify="space-between" align="center" mb="20px">
          <Text fontSize="lg" fontWeight="bold" color={textColor}>Danh sách tài sản cần kiểm kê</Text>
          {canEditItems && (
            <Button colorScheme="blue" leftIcon={<CheckIcon />} onClick={handleSaveItems} isLoading={saving}>
              Lưu số liệu
            </Button>
          )}
        </Flex>

        {items.length === 0 ? (
          <Text>Không có tài sản nào để kiểm kê.</Text>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th borderColor={borderColor}>Mã TS</Th>
                  <Th borderColor={borderColor}>Tên TS</Th>
                  <Th borderColor={borderColor} isNumeric>Dự kiến</Th>
                  <Th borderColor={borderColor}>Thực tế (Tốt)</Th>
                  <Th borderColor={borderColor}>Hỏng</Th>
                  <Th borderColor={borderColor} isNumeric>Thiếu</Th>
                  <Th borderColor={borderColor}>Ghi chú</Th>
                  {audit.status === "completed" && <Th borderColor={borderColor}>Hành động</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {items.map(item => {
                  const editRow = editData[item.id] || {};
                  const actual = parseInt(editRow.actual_quantity) || 0;
                  const damaged = parseInt(editRow.damaged_quantity) || 0;
                  const missing = Math.max(item.expected_quantity - actual - damaged, 0);

                  return (
                    <Tr key={item.id} _hover={{ bg: "gray.50" }}>
                      <Td borderColor={borderColor}>{item.quantity_asset_code}</Td>
                      <Td borderColor={borderColor}>
                        <Text fontWeight="bold">{item.quantity_asset_name}</Text>
                      </Td>
                      <Td borderColor={borderColor} isNumeric fontWeight="bold">{item.expected_quantity}</Td>
                      <Td borderColor={borderColor}>
                        {canEditItems ? (
                          <Input 
                            type="number" 
                            min={0} 
                            w="80px" 
                            value={editRow.actual_quantity} 
                            onChange={(e) => handleEditChange(item.id, "actual_quantity", e.target.value)} 
                          />
                        ) : (
                          <Text>{item.actual_quantity}</Text>
                        )}
                      </Td>
                      <Td borderColor={borderColor}>
                        {canEditItems ? (
                          <Input 
                            type="number" 
                            min={0} 
                            w="80px" 
                            value={editRow.damaged_quantity} 
                            onChange={(e) => handleEditChange(item.id, "damaged_quantity", e.target.value)} 
                          />
                        ) : (
                          <Text>{item.damaged_quantity}</Text>
                        )}
                      </Td>
                      <Td borderColor={borderColor} isNumeric>
                        <Text color={missing > 0 ? "red.500" : "inherit"} fontWeight={missing > 0 ? "bold" : "normal"}>
                          {audit.status === "in_progress" ? missing : Math.max(item.expected_quantity - item.actual_quantity - item.damaged_quantity, 0)}
                        </Text>
                      </Td>
                      <Td borderColor={borderColor}>
                        {canEditItems ? (
                          <Input 
                            placeholder="Ghi chú..." 
                            value={editRow.notes} 
                            onChange={(e) => handleEditChange(item.id, "notes", e.target.value)} 
                          />
                        ) : (
                          <Text>{item.notes || "-"}</Text>
                        )}
                      </Td>
                      
                      {audit.status === "completed" && (
                        <Td borderColor={borderColor}>
                          {(Math.max(item.expected_quantity - item.actual_quantity - item.damaged_quantity, 0) > 0 || item.damaged_quantity > 0) && (
                            <Button 
                              size="sm" 
                              colorScheme="orange" 
                              variant="outline"
                              onClick={() => {
                                // Mở form tạo CategoryNeed (có thể chuyển hướng sang trang tạo phiếu nhu cầu kèm params)
                                navigate(`/admin/asset-needs?create=true&asset_id=${item.quantity_asset_id}&dept_id=${audit.department_id}`);
                              }}
                            >
                              Tạo phiếu nhu cầu
                            </Button>
                          )}
                        </Td>
                      )}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
}
