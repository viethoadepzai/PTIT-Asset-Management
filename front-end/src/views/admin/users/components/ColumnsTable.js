/* eslint-disable */
import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";

import Card from "components/card/Card";
import UserModal from "./UserModal";

const PAGE_SIZE = 10;

function StatusBadge({ role, isActive }) {
  if (role === "admin") {
    return (
      <Badge colorScheme="purple" borderRadius="999px" px="10px" py="4px">
        Hoạt động (Quan trị viên)
      </Badge>
    );
  }

  return (
    <Badge
      colorScheme={isActive ? "green" : "red"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {isActive ? "Hoạt động" : "Không hoạt động"}
    </Badge>
  );
}

function roleFunc(role) {
  switch (role) {
    case "admin": return "Quan trị viên";
    case "manager": return "Quản lý";
    case "staff": return "Nhân viên";
    default: return role;
  }
}


export default function ColumnsTable(props) {
  const {
    tableData = [],
    title,
    onToggleActiveUser,
    onSaveUser,
    onCreateUser,
    departmentOptions = [],
    addLabel = "Thêm người dùng",
    canManageUsers = false,
    loading = false,
  } = props;

  const [keyword, setKeyword] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedUser, setSelectedUser] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("edit");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

  const filteredData = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tableData || []).filter((row) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          row.username,
          row.email,
          row.full_name,
          row.phone_number,
          row.department,
          row.role,
        ].some(
          (value) =>
            value != null &&
            String(value).toLowerCase().includes(normalizedKeyword)
        );

      const matchesDepartment =
        !departmentId || String(row.department_id ?? "") === String(departmentId);

      const matchesRole =
        !roleFilter || String(row.role ?? "").toLowerCase() === roleFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && Boolean(row.is_active)) ||
        (statusFilter === "inactive" && !Boolean(row.is_active));

      return (
        matchesKeyword && matchesDepartment && matchesRole && matchesStatus
      );
    });
  }, [departmentId, keyword, roleFilter, statusFilter, tableData]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, departmentId, roleFilter, statusFilter, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedUser?.id === onSaveUser?.loadingId ||
      selectedUser?.id === onToggleActiveUser?.loadingId ||
      onCreateUser?.loading
    ) {
      return;
    }

    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handleSave = async (user) => {
    await onSaveUser?.handler?.(user);
    handleCloseModal();
  };

  const handleToggleActive = async (user) => {
    await onToggleActiveUser?.handler?.(user);
    handleCloseModal();
  };

  const handleCreate = async (user) => {
    await onCreateUser?.handler?.(user);
    handleCloseModal();
  };

  const startRow = filteredData.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const endRow = Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length);

  return (
    <>
      <Card flexDirection="column" w="100%" px="0px" overflowX="auto">
        <Flex
          px="25px"
          pt="20px"
          pb="16px"
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap="12px"
        >
          <Box>
            <Text color={textColor} fontSize="22px" fontWeight="700">
              {title || "Quản lý người dùng"}
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {canManageUsers
                ? "Admin có thể tạo, sửa và kích hoạt hoặc vô hiệu hóa user."
                : "Bạn đang ở chế độ chỉ xem."}
            </Text>
          </Box>

          {canManageUsers ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={() => {
                setSelectedUser(null);
                setModalMode("create");
                setIsModalOpen(true);
              }}
            >
              {addLabel}
            </Button>
          ) : null}
        </Flex>

        <Flex
          px="25px"
          pb="18px"
          gap="12px"
          wrap="wrap"
          align="center"
        >
          <InputGroup maxW={{ base: "100%", md: "280px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm tên đăng nhập, email, họ tên..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          <Select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            maxW={{ base: "100%", md: "220px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả phòng ban</option>
            {departmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả chức vụ</option>
            <option value="admin">Quan trị viên</option>
            <option value="manager">Quản lý</option>
            <option value="staff">Nhân viên</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
            borderRadius="16px"
          >
            <option value="">Trạng thái hoạt động</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </Select>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>STT</Th>
                <Th borderColor={borderColor}>Họ và tên</Th>
                <Th borderColor={borderColor}>Tên đăng nhập</Th>
                <Th borderColor={borderColor}>Email</Th>
                <Th borderColor={borderColor}>Chức vụ</Th>
                <Th borderColor={borderColor}>Phòng ban</Th>
                <Th borderColor={borderColor}>Trạng thái</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={7} borderColor={borderColor}>
                    <Text py="20px" textAlign="center" color="gray.500">
                      Đang tải dữ liệu...
                    </Text>
                  </Td>
                </Tr>
              ) : paginatedRows.length === 0 ? (
                <Tr>
                  <Td colSpan={7} borderColor={borderColor}>
                    <Text py="20px" textAlign="center" color="gray.500">
                      Không có người dùng phù hợp.
                    </Text>
                  </Td>
                </Tr>
              ) : (
                paginatedRows.map((row) => (
                  <Tr
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    cursor="pointer"
                    _hover={{ bg: rowHoverBg }}
                  >
                    <Td borderColor={borderColor}>{row.stt}</Td>
                    <Td borderColor={borderColor}>{row.full_name}</Td>
                    <Td borderColor={borderColor}>{row.username}</Td>
                    <Td borderColor={borderColor}>{row.email}</Td>
                    <Td borderColor={borderColor}>
                      <Text textTransform="capitalize">{roleFunc(row.role)}</Text>
                    </Td>
                    <Td borderColor={borderColor}>{row.department}</Td>
                    <Td borderColor={borderColor}>
                      <StatusBadge role={row.role} isActive={row.is_active} />
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        <Flex
          px="25px"
          py="18px"
          align="center"
          justify="space-between"
          wrap="wrap"
          gap="12px"
        >
          <Text fontSize="sm" color="gray.500">
            {filteredData.length === 0
              ? "Không có bản ghi"
              : `Hiển thị ${startRow}-${endRow} trong ${filteredData.length} bản ghi`}
          </Text>

          <Flex gap="10px">
            <Button
              variant="outline"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              isDisabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button variant="ghost" isDisabled>
              Page {currentPage + 1} / {totalPages}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))
              }
              isDisabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </Flex>
        </Flex>
      </Card>

      <UserModal
        user={selectedUser}
        departmentOptions={departmentOptions}
        isOpen={isModalOpen}
        isSubmitting={
          modalMode === "create"
            ? Boolean(onCreateUser?.loading)
            : Boolean(selectedUser && selectedUser.id === onSaveUser?.loadingId)
        }
        isTogglingActive={Boolean(
          selectedUser && selectedUser.id === onToggleActiveUser?.loadingId
        )}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onToggleActive={handleToggleActive}
        mode={modalMode}
        canManageUsers={canManageUsers}
      />
    </>
  );
}