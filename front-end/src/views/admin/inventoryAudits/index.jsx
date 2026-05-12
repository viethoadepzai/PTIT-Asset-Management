import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
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
  IconButton,
} from "@chakra-ui/react";
import { SearchIcon, AddIcon, EditIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import Card from "components/card/Card";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import { listInventoryAudits, createInventoryAudit, updateInventoryAudit } from "api/inventoryAuditsApi";
import { listDepartments } from "api/departmentsApi";
import { listUsers } from "api/usersApi";

import AuditModal from "./components/AuditModal";

const PAGE_SIZE = 15;

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

export default function InventoryAudits() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = React.useState(true);
  const [audits, setAudits] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const [keyword, setKeyword] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("create");
  const [saving, setSaving] = React.useState(false);
  const [editingAudit, setEditingAudit] = React.useState(null);

  const [formData, setFormData] = React.useState({
    code: "",
    department_id: "",
    scheduled_date: "",
    assigned_to_user_id: "",
  });

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

  const isAdmin = currentUserRole === "admin";

  const handleUnauthorized = React.useCallback(() => {
    logout();
    toast({
      title: "Phiên đăng nhập đã hết hạn",
      description: "Vui lòng đăng nhập lại.",
      status: "warning",
      duration: 2500,
      isClosable: true,
    });
    navigate("/auth/sign-in", { replace: true });
  }, [navigate, toast]);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);

      const [profile, depts, usersData] = await Promise.all([
        getCurrentUser(),
        listDepartments({ limit: 500, is_active: true }),
        listUsers({ limit: 500, is_active: true }),
      ]);

      setCurrentUserRole(profile?.role || "");
      setDepartments(Array.isArray(depts) ? depts : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }
      toast({
        title: "Lỗi tải dữ liệu",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, toast]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const fetchAudits = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (deptFilter) {
        params.department_id = parseInt(deptFilter, 10);
      }
      const data = await listInventoryAudits(params);
      setAudits(Array.isArray(data) ? data : []);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }
      toast({
        title: "Không tải được danh sách kiểm kê",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [deptFilter, handleUnauthorized, toast]);

  React.useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const filteredData = React.useMemo(() => {
    if (!keyword.trim()) return audits;
    const kw = keyword.trim().toLowerCase();
    return audits.filter((item) =>
      [item.code, item.department_name, item.department_code, item.assigned_to_user_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw))
    );
  }, [audits, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingAudit(null);
    setFormData({
      code: "",
      department_id: deptFilter || "",
      scheduled_date: new Date().toISOString().slice(0, 10),
      assigned_to_user_id: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (audit) => {
    setModalMode("edit");
    setEditingAudit(audit);
    setFormData({
      code: audit.code,
      department_id: String(audit.department_id),
      scheduled_date: audit.scheduled_date,
      assigned_to_user_id: audit.assigned_to_user_id ? String(audit.assigned_to_user_id) : "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (modalMode === "create") {
        if (!formData.code || !formData.department_id || !formData.scheduled_date) {
          toast({ title: "Vui lòng điền đủ thông tin bắt buộc", status: "warning", duration: 2500 });
          return;
        }
      } else {
        if (!formData.scheduled_date) {
          toast({ title: "Vui lòng điền đủ thông tin bắt buộc", status: "warning", duration: 2500 });
          return;
        }
      }

      setSaving(true);

      const payload = {
        scheduled_date: formData.scheduled_date,
        assigned_to_user_id: formData.assigned_to_user_id ? parseInt(formData.assigned_to_user_id, 10) : null,
      };

      if (modalMode === "create") {
        payload.code = formData.code;
        payload.department_id = parseInt(formData.department_id, 10);
        await createInventoryAudit(payload);
        toast({ title: "Tạo lịch kiểm kê thành công", status: "success", duration: 2500 });
      } else {
        await updateInventoryAudit(editingAudit.id, payload);
        toast({ title: "Cập nhật thành công", status: "success", duration: 2500 });
      }

      setIsModalOpen(false);
      await fetchAudits();
    } catch (error) {
      toast({
        title: "Thất bại",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px" }}>
      <Card flexDirection="column" w="100%" px="0px" overflowX="auto">
        <Flex px="25px" pt="20px" pb="16px" justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap="12px">
          <Box>
            <Text color={textColor} fontSize="22px" fontWeight="700">
              Kiểm kê tài sản định kỳ
            </Text>
            <Text color="gray.500" fontSize="sm" mt="2px">
              Quản lý các đợt kiểm kê tài sản số lượng lớn tại các phòng ban
            </Text>
          </Box>
          {isAdmin && (
            <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={handleOpenCreate}>
              Tạo lịch kiểm kê
            </Button>
          )}
        </Flex>

        <Flex px="25px" pb="16px" gap="12px" wrap="wrap" align="center">
          <InputGroup maxW="300px">
            <InputLeftElement>
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>
            <Input
              placeholder="Tìm theo mã đợt, phòng ban..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="14px"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPageIndex(0); }}
            />
          </InputGroup>

          {currentUserRole === "admin" && (
            <Select maxW="250px" placeholder="-- Tất cả phòng ban --" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPageIndex(0); }}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </Select>
          )}
        </Flex>

        {loading ? (
          <Flex justify="center" py="40px"><Spinner size="lg" /></Flex>
        ) : filteredData.length === 0 ? (
          <Flex justify="center" py="40px"><Text color="gray.500">Chưa có đợt kiểm kê nào.</Text></Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" mb="24px">
              <Thead>
                <Tr>
                  <Th borderColor={borderColor}>Mã đợt</Th>
                  <Th borderColor={borderColor}>Phòng ban</Th>
                  <Th borderColor={borderColor}>Ngày kiểm kê</Th>
                  <Th borderColor={borderColor}>Phân công</Th>
                  <Th borderColor={borderColor}>Trạng thái</Th>
                  <Th borderColor={borderColor}>Thao tác</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedRows.map((item) => (
                  <Tr key={item.id} _hover={{ bg: rowHoverBg }}>
                    <Td borderColor={borderColor}>
                      <Text fontWeight="bold" color={textColor}>{item.code}</Text>
                    </Td>
                    <Td borderColor={borderColor}>
                      <Text fontWeight="600">{item.department_name || "-"}</Text>
                    </Td>
                    <Td borderColor={borderColor}>{new Date(item.scheduled_date).toLocaleDateString("vi-VN")}</Td>
                    <Td borderColor={borderColor}>{item.assigned_to_user_name || "-"}</Td>
                    <Td borderColor={borderColor}>
                      <Badge colorScheme={STATUS_COLOR[item.status] || "gray"} borderRadius="999px" px="10px" py="4px">
                        {STATUS_LABEL[item.status] || item.status}
                      </Badge>
                    </Td>
                    <Td borderColor={borderColor}>
                      <HStack spacing={2}>
                        <Button size="sm" variant="outline" colorScheme="blue" rightIcon={<ArrowForwardIcon />} onClick={() => navigate(`/admin/inventory-audits/${item.id}`)}>
                          Chi tiết
                        </Button>
                        {isAdmin && item.status === "scheduled" && (
                          <IconButton size="sm" icon={<EditIcon />} aria-label="Sửa" onClick={() => handleOpenEdit(item)} />
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {totalPages > 1 && (
          <Flex px="25px" pb="20px" justify="space-between" align="center">
            <Text fontSize="sm" color="gray.500">
              Trang {currentPage + 1} / {totalPages} ({filteredData.length} bản ghi)
            </Text>
            <HStack>
              <Button size="sm" variant="outline" isDisabled={currentPage <= 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))}>
                ‹ Trước
              </Button>
              <Button size="sm" variant="outline" isDisabled={currentPage >= totalPages - 1} onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}>
                Sau ›
              </Button>
            </HStack>
          </Flex>
        )}
      </Card>

      {isModalOpen && (
        <AuditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          formData={formData}
          setFormData={setFormData}
          departmentOptions={departments.map(d => ({ value: String(d.id), label: `${d.code} - ${d.name}` }))}
          userOptions={users.map(u => ({ value: String(u.id), label: `${u.id} - ${u.full_name}` }))}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </Box>
  );
}
