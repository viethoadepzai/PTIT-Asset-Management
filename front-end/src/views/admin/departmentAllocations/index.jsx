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
} from "@chakra-ui/react";

import { SearchIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import Card from "components/card/Card";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import { listDepartmentAllocations } from "api/departmentAllocationsApi";
import { listDepartments } from "api/departmentsApi";

const PAGE_SIZE = 15;

export default function DepartmentAllocations() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = React.useState(true);
  const [allocations, setAllocations] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const [keyword, setKeyword] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

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

      const [profile, depts] = await Promise.all([
        getCurrentUser(),
        listDepartments({ limit: 500, is_active: true }),
      ]);

      setCurrentUserRole(profile?.role || "");
      setDepartments(Array.isArray(depts) ? depts : []);
    } catch (error) {
      console.error(error);
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }
      toast({
        title: "Không tải được dữ liệu",
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

  // Fetch allocations khi filter thay đổi
  React.useEffect(() => {
    const params = {};
    if (deptFilter) {
      params.department_id = parseInt(deptFilter, 10);
    }

    (async () => {
      try {
        setLoading(true);
        const data = await listDepartmentAllocations(params);
        setAllocations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        if (isUnauthorizedError(error)) {
          handleUnauthorized();
          return;
        }
        toast({
          title: "Không tải được phân bổ",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [deptFilter, handleUnauthorized, toast]);

  const filteredData = React.useMemo(() => {
    if (!keyword.trim()) return allocations;
    const kw = keyword.trim().toLowerCase();
    return allocations.filter((item) =>
      [
        item.department_name,
        item.department_code,
        item.quantity_asset_name,
        item.quantity_asset_code,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw))
    );
  }, [allocations, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  return (
    <Box pt={{ base: "130px", md: "80px" }}>
      <Card flexDirection="column" w="100%" px="0px" overflowX="auto">
        {/* Header */}
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
              Phân bổ tài sản số lượng lớn
            </Text>
            <Text color="gray.500" fontSize="sm" mt="2px">
              Theo dõi số lượng tài sản đã cấp phát cho từng phòng ban
            </Text>
          </Box>
        </Flex>

        {/* Filters */}
        <Flex
          px="25px"
          pb="16px"
          gap="12px"
          wrap="wrap"
          align="center"
        >
          <InputGroup maxW="300px">
            <InputLeftElement>
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>
            <Input
              placeholder="Tìm theo tên, mã..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="14px"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPageIndex(0);
              }}
            />
          </InputGroup>

          {currentUserRole === "admin" && (
            <Select
              maxW="250px"
              placeholder="-- Tất cả phòng ban --"
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPageIndex(0);
              }}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </Select>
          )}
        </Flex>

        {/* Table */}
        {loading ? (
          <Flex justify="center" py="40px">
            <Spinner size="lg" />
          </Flex>
        ) : filteredData.length === 0 ? (
          <Flex justify="center" py="40px">
            <Text color="gray.500">Chưa có phân bổ nào.</Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" mb="24px">
              <Thead>
                <Tr>
                  <Th borderColor={borderColor}>STT</Th>
                  <Th borderColor={borderColor}>Phòng ban</Th>
                  <Th borderColor={borderColor}>Tài sản</Th>
                  <Th borderColor={borderColor} isNumeric>
                    Số lượng đang quản lý
                  </Th>
                  <Th borderColor={borderColor}>Trạng thái</Th>
                  <Th borderColor={borderColor}>Ghi chú</Th>
                  <Th borderColor={borderColor}>Cập nhật</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedRows.map((item, idx) => (
                  <Tr
                    key={item.id}
                    _hover={{ bg: rowHoverBg }}
                    cursor="default"
                  >
                    <Td borderColor={borderColor}>
                      {currentPage * PAGE_SIZE + idx + 1}
                    </Td>
                    <Td borderColor={borderColor}>
                      <Text fontWeight="600">
                        {item.department_name || "-"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {item.department_code || ""}
                      </Text>
                    </Td>
                    <Td borderColor={borderColor}>
                      <Text fontWeight="600">
                        {item.quantity_asset_name || "-"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {item.quantity_asset_code || ""}
                      </Text>
                    </Td>
                    <Td
                      borderColor={borderColor}
                      isNumeric
                      fontWeight="700"
                      fontSize="lg"
                      color="blue.500"
                    >
                      {item.allocated_quantity}
                    </Td>
                    <Td borderColor={borderColor}>
                      <Badge
                        colorScheme={item.is_active ? "green" : "red"}
                        borderRadius="999px"
                        px="10px"
                        py="4px"
                      >
                        {item.is_active ? "Hoạt động" : "Ngừng"}
                      </Badge>
                    </Td>
                    <Td borderColor={borderColor}>
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        maxW="200px"
                        noOfLines={2}
                      >
                        {item.notes || "-"}
                      </Text>
                    </Td>
                    <Td borderColor={borderColor} fontSize="sm">
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleString("vi-VN")
                        : "-"}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex px="25px" pb="20px" justify="space-between" align="center">
            <Text fontSize="sm" color="gray.500">
              Trang {currentPage + 1} / {totalPages} ({filteredData.length}{" "}
              bản ghi)
            </Text>
            <HStack>
              <Button
                size="sm"
                variant="outline"
                isDisabled={currentPage <= 0}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              >
                ‹ Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                isDisabled={currentPage >= totalPages - 1}
                onClick={() =>
                  setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                }
              >
                Sau ›
              </Button>
            </HStack>
          </Flex>
        )}
      </Card>
    </Box>
  );
}
