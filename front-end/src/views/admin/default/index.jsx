import React, { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Icon,
  SimpleGrid,
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
import {
  MdApartment,
  MdBuild,
  MdHourglassEmpty,
  MdInventory2,
  MdPeople,
  MdRefresh,
  MdSettings,
  MdWarningAmber,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ReactApexChart from "react-apexcharts";

import Card from "components/card/Card.js";
import { getDashboardData } from "api/reportsApi";
import { isUnauthorizedError } from "api/http";
import { getCurrentUser, logout } from "api/authApi";

// ---- helpers ----

const STATUS_COLORS = {
  available: "#01B574",
  in_use: "#422AFB",
  under_maintenance: "#FF7A00",
  damaged: "#EE5D50",
  liquidated: "#A0AEC0",
  requested: "#FFCE20",
  active: "#01B574",
  completed: "#422AFB",
  returned: "#805AD5",
  cancelled: "#EE5D50",
  scheduled: "#FF9E4F",
  in_progress: "#FFCE20",
  approved: "#4299E1",
  received: "#3EDBC3",
  draft: "#A0AEC0",
  sent: "#68D391",
  processing: "#FFCE20",
  pending: "#FFCE20",
  rejected: "#EE5D50",
};

const STATUS_LABELS = {
  available: "Sẵn sàng",
  in_use: "Đang sử dụng",
  under_maintenance: "Đang bảo trì",
  damaged: "Hỏng",
  liquidated: "Thanh lý",
  requested: "Chờ duyệt",
  active: "Đang hoạt động",
  completed: "Hoàn tất",
  returned: "Đã trả",
  cancelled: "Đã hủy",
  scheduled: "Đã lên lịch",
  in_progress: "Đang xử lý",
  approved: "Đã duyệt",
  received: "Đã nhận",
  draft: "Nháp",
  sent: "Đã gửi",
  processing: "Đang xử lý",
  pending: "Chờ duyệt",
  rejected: "Từ chối",
};

function statusLabel(s) {
  return STATUS_LABELS[s] || String(s || "").replaceAll("_", " ");
}

function statusColor(s) {
  return STATUS_COLORS[s] || "#A0AEC0";
}

function formatNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toLocaleString("vi-VN") : "0";
}

function formatDateTime(value) {
  if (!value) return "Không rõ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function normalizeRecentActivities(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.data)
        ? raw.data
        : [];

  return list.map((item, index) => ({
    id: item?.id || index,
    title: item?.title || item?.description || item?.action || "Hoạt động hệ thống",
    subtitle: item?.entity_type || item?.module || item?.type || item?.status || "",
    time: item?.created_at || item?.updated_at || item?.activity_date || "",
  }));
}

// ---- Chart components ----

function DonutChart({ title, data, emptyText }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const labels = data.map((d) => statusLabel(d.status));
  const series = data.map((d) => Number(d.count));
  const colors = data.map((d) => statusColor(d.status));
  const hasData = series.some((v) => v > 0);

  const options = {
    chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
    labels,
    colors: colors.length > 0 ? colors : ["#A0AEC0"],
    legend: { show: true, position: "bottom", fontSize: "12px" },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: { show: true, label: "Tổng", fontSize: "14px", fontWeight: "600" },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    tooltip: { y: { formatter: (val) => `${val}` } },
  };

  return (
    <Card p="20px" h="100%">
      <Text color={textColor} fontSize="lg" fontWeight="700" mb="4px">
        {title}
      </Text>
      {hasData ? (
        <ReactApexChart type="donut" options={options} series={series} height={260} />
      ) : (
        <Flex align="center" justify="center" h="240px">
          <Text color="gray.400" fontSize="sm">
            {emptyText || "Chưa có dữ liệu"}
          </Text>
        </Flex>
      )}
    </Card>
  );
}

function GroupedBarChart({ title, categories, series, emptyText }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const hasData = categories.length > 0;

  const options = {
    chart: {
      type: "bar",
      background: "transparent",
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    xaxis: {
      categories,
      labels: { rotate: -30, style: { fontSize: "11px" }, trim: true, maxHeight: 80 },
    },
    yaxis: { labels: { style: { fontSize: "11px" } } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    colors: ["#422AFB", "#01B574"],
    legend: { show: true, position: "top", fontSize: "12px" },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 5, borderColor: "#E2E8F0" },
    tooltip: { shared: true, intersect: false },
  };

  return (
    <Card p="20px" h="100%">
      <Text color={textColor} fontSize="lg" fontWeight="700" mb="4px">
        {title}
      </Text>
      {hasData ? (
        <ReactApexChart type="bar" options={options} series={series} height={280} />
      ) : (
        <Flex align="center" justify="center" h="260px">
          <Text color="gray.400" fontSize="sm">
            {emptyText || "Chưa có dữ liệu"}
          </Text>
        </Flex>
      )}
    </Card>
  );
}

function SimpleBarChart({ title, data, emptyText }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const hasData = data.length > 0 && data.some((d) => Number(d.count) > 0);

  const categories = data.map((d) => statusLabel(d.status));
  const seriesData = data.map((d) => Number(d.count));
  const colors = data.map((d) => statusColor(d.status));

  const options = {
    chart: {
      type: "bar",
      background: "transparent",
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    xaxis: { categories, labels: { style: { fontSize: "11px" } } },
    yaxis: { labels: { style: { fontSize: "11px" } } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%", distributed: true } },
    colors: colors.length > 0 ? colors : ["#A0AEC0"],
    legend: { show: false },
    dataLabels: { enabled: true, style: { fontSize: "11px" } },
    grid: { strokeDashArray: 5, borderColor: "#E2E8F0" },
  };

  return (
    <Card p="20px" h="100%">
      <Text color={textColor} fontSize="lg" fontWeight="700" mb="4px">
        {title}
      </Text>
      {hasData ? (
        <ReactApexChart
          type="bar"
          options={options}
          series={[{ name: "Số lượng", data: seriesData }]}
          height={260}
        />
      ) : (
        <Flex align="center" justify="center" h="240px">
          <Text color="gray.400" fontSize="sm">
            {emptyText || "Chưa có dữ liệu"}
          </Text>
        </Flex>
      )}
    </Card>
  );
}

// ---- StatCard ----

function StatCard({ title, value, icon, helpText }) {
  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const iconColor = useColorModeValue("brand.500", "white");

  return (
    <Card p="20px">
      <Flex align="center" justify="space-between" gap="12px">
        <Box flex="1" minW="0">
          <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
            {title}
          </Text>
          <Text mt="6px" color={textColorPrimary} fontSize="2xl" fontWeight="700">
            {value}
          </Text>
          {helpText ? (
            <Text mt="6px" color={textColorSecondary} fontSize="xs">
              {helpText}
            </Text>
          ) : null}
        </Box>
        <Flex
          align="center"
          justify="center"
          borderRadius="16px"
          w="52px"
          h="52px"
          bg={iconBg}
          flexShrink={0}
        >
          <Icon as={icon} w="26px" h="26px" color={iconColor} />
        </Flex>
      </Flex>
    </Card>
  );
}

// ---- Main dashboard ----

export default function MainDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const tableBorderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [currentUserRole, setCurrentUserRole] = React.useState("");
  const [dashboardMode, setDashboardMode] = React.useState("full");

  const [summary, setSummary] = React.useState({
    total_departments: 0,
    total_users: 0,
    total_assets: 0,
    total_supplies: 0,
    active_allocations: 0,
    active_maintenances: 0,
    low_stock_supplies: 0,
    pending_quantity_assets: 0,
  });

  const [assetStatusSummary, setAssetStatusSummary] = React.useState([]);
  const [quantityAssetStatusSummary, setQuantityAssetStatusSummary] = React.useState([]);
  const [allocationStatusSummary, setAllocationStatusSummary] = React.useState([]);
  const [maintenanceStatusSummary, setMaintenanceStatusSummary] = React.useState([]);
  const [assetsByDepartment, setAssetsByDepartment] = React.useState([]);
  const [lowStockSupplies, setLowStockSupplies] = React.useState([]);
  const [pendingApprovals, setPendingApprovals] = React.useState([]);
  const [recentActivities, setRecentActivities] = React.useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

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

  const loadDashboard = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const profile = await getCurrentUser();
      const role = String(profile?.role || "").trim().toLowerCase();
      setCurrentUserRole(role);

      const data = await getDashboardData(role);

      setSummary({
        total_departments: data?.summary?.total_departments ?? 0,
        total_users: data?.summary?.total_users ?? 0,
        total_assets: data?.summary?.total_assets ?? 0,
        total_supplies: data?.summary?.total_supplies ?? 0,
        active_allocations: data?.summary?.active_allocations ?? 0,
        active_maintenances: data?.summary?.active_maintenances ?? 0,
        low_stock_supplies: data?.summary?.low_stock_supplies ?? 0,
        pending_quantity_assets: data?.summary?.pending_quantity_assets ?? 0,
      });

      setDashboardMode(data?.dashboardMode || "full");
      setAssetStatusSummary(Array.isArray(data?.assetStatusSummary) ? data.assetStatusSummary : []);
      setQuantityAssetStatusSummary(Array.isArray(data?.quantityAssetStatusSummary) ? data.quantityAssetStatusSummary : []);
      setAllocationStatusSummary(Array.isArray(data?.allocationStatusSummary) ? data.allocationStatusSummary : []);
      setMaintenanceStatusSummary(Array.isArray(data?.maintenanceStatusSummary) ? data.maintenanceStatusSummary : []);
      setAssetsByDepartment(Array.isArray(data?.assetsByDepartment) ? data.assetsByDepartment : []);
      setLowStockSupplies(Array.isArray(data?.lowStockSupplies) ? data.lowStockSupplies : []);
      setPendingApprovals(Array.isArray(data?.pendingApprovals) ? data.pendingApprovals : []);
      setRecentActivities(normalizeRecentActivities(data?.recentActivity));
    } catch (error) {
      console.error("Tải bảng điều khiển không thành công:", error);
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }
      setErrorMessage(error.message || "Không tải được dữ liệu bảng điều khiển.");
      toast({
        title: "Tải bảng điều khiển thất bại",
        description: error.message || "Có lỗi xảy ra khi lấy dữ liệu.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized, toast]);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const isStaffDashboard = dashboardMode === "staff" || currentUserRole === "staff";

  const deptChartCategories = assetsByDepartment.map((d) => d.department_name);
  const deptChartSeries = [
    { name: "Tài sản cố định", data: assetsByDepartment.map((d) => d.asset_count) },
    { name: "Tài sản số lượng", data: assetsByDepartment.map((d) => d.quantity_asset_count) },
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = recentActivities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(recentActivities.length / itemsPerPage);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Header */}
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="12px"
        mb="20px"
      >
        <Box>
          <Text color={textColorPrimary} fontSize="2xl" fontWeight="700">
            Bảng Điều Khiển
          </Text>
          <Text color={textColorSecondary} fontSize="sm" mt="4px">
            {isStaffDashboard
              ? "Tổng quan nhanh theo phạm vi tài khoản hoặc phòng ban của bạn."
              : "Tổng quan nhanh tình hình tài sản, vật tư, cấp phát và bảo trì."}
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={MdRefresh} />}
          onClick={loadDashboard}
          isLoading={isLoading}
          borderRadius="14px"
        >
          Làm mới
        </Button>
      </Flex>

      {errorMessage ? (
        <Alert status="error" borderRadius="16px" mb="20px">
          <AlertIcon />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {/* StatCards */}
      {isStaffDashboard ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="20px" mb="20px">
          <StatCard title="Người dùng" value={formatNumber(summary.total_users)} icon={MdPeople} helpText="Số người dùng trong phạm vi phòng ban" />
          <StatCard title="Tài sản" value={formatNumber(summary.total_assets)} icon={MdInventory2} helpText="Tài sản thuộc phạm vi được phép xem" />
          <StatCard title="Vật tư" value={formatNumber(summary.total_supplies)} icon={MdBuild} helpText="Vật tư thuộc phạm vi được phép xem" />
          <StatCard title="Cấp phát đang hoạt động" value={formatNumber(summary.active_allocations)} icon={MdSettings} helpText="Các phiếu cấp phát đang xử lý" />
          <StatCard title="Bảo trì đang hoạt động" value={formatNumber(summary.active_maintenances)} icon={MdSettings} helpText="Các yêu cầu bảo trì đang xử lý" />
          <StatCard title="Vật tư sắp hết" value={formatNumber(summary.low_stock_supplies)} icon={MdWarningAmber} helpText="Số vật tư đang dưới ngưỡng tối thiểu" />
        </SimpleGrid>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing="20px" mb="20px">
          <StatCard title="Phòng ban" value={formatNumber(summary.total_departments)} icon={MdApartment} helpText="Tổng số phòng ban trong hệ thống" />
          <StatCard title="Người dùng" value={formatNumber(summary.total_users)} icon={MdPeople} helpText="Tổng số tài khoản" />
          <StatCard title="Tài sản" value={formatNumber(summary.total_assets)} icon={MdInventory2} helpText="Tổng số tài sản cố định" />
          <StatCard title="Vật tư" value={formatNumber(summary.total_supplies)} icon={MdBuild} helpText="Tổng số vật tư tiêu hao" />
          <StatCard title="Cấp phát đang hoạt động" value={formatNumber(summary.active_allocations)} icon={MdSettings} helpText="Số phiếu cấp phát đang hoạt động" />
          <StatCard title="Bảo trì đang hoạt động" value={formatNumber(summary.active_maintenances)} icon={MdSettings} helpText="Số phiếu bảo trì đang xử lý" />
          <StatCard title="Vật tư sắp hết" value={formatNumber(summary.low_stock_supplies)} icon={MdWarningAmber} helpText="Các vật tư dưới ngưỡng tối thiểu" />
          <StatCard title="Chờ duyệt lô tài sản" value={formatNumber(summary.pending_quantity_assets)} icon={MdHourglassEmpty} helpText="Lô tài sản số lượng chưa được duyệt" />
        </SimpleGrid>
      )}

      {isLoading ? (
        <Flex align="center" justify="center" py="48px">
          <Spinner thickness="4px" speed="0.65s" size="lg" />
        </Flex>
      ) : null}

      {/* Full dashboard — admin/manager */}
      {!isLoading && !isStaffDashboard ? (
        <>
          {/* Row 1: 3 Donut charts */}
          <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr 1fr" }} gap="20px" mb="20px">
            <GridItem>
              <DonutChart
                title="Trạng thái tài sản cố định"
                data={assetStatusSummary}
                emptyText="Chưa có dữ liệu tài sản"
              />
            </GridItem>
            <GridItem>
              <DonutChart
                title="Trạng thái lô tài sản số lượng"
                data={quantityAssetStatusSummary}
                emptyText="Chưa có dữ liệu lô tài sản"
              />
            </GridItem>
            <GridItem>
              <DonutChart
                title="Trạng thái cấp phát"
                data={allocationStatusSummary}
                emptyText="Chưa có dữ liệu cấp phát"
              />
            </GridItem>
          </Grid>

          {/* Row 2: Bar charts */}
          <Grid templateColumns={{ base: "1fr", xl: "3fr 2fr" }} gap="20px" mb="20px">
            <GridItem>
              <GroupedBarChart
                title="Tài sản theo phòng ban"
                categories={deptChartCategories}
                series={deptChartSeries}
                emptyText="Chưa có dữ liệu tài sản theo phòng ban"
              />
            </GridItem>
            <GridItem>
              <SimpleBarChart
                title="Bảo trì theo trạng thái"
                data={maintenanceStatusSummary}
                emptyText="Chưa có dữ liệu bảo trì"
              />
            </GridItem>
          </Grid>

          {/* Row 3: Low stock + Pending approvals tables */}
          <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap="20px" mb="20px">
            <GridItem>
              <Card p="20px" h="100%">
                <Text color={textColorPrimary} fontSize="lg" fontWeight="700" mb="16px">
                  Vật tư tồn kho thấp
                </Text>
                {lowStockSupplies.length === 0 ? (
                  <Text color={textColorSecondary} fontSize="sm">
                    Hiện chưa có vật tư nào dưới mức tồn kho tối thiểu.
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th borderColor={tableBorderColor}>Mã</Th>
                          <Th borderColor={tableBorderColor}>Tên</Th>
                          <Th borderColor={tableBorderColor}>Tồn kho</Th>
                          <Th borderColor={tableBorderColor}>Tối thiểu</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {lowStockSupplies.map((item, idx) => (
                          <Tr key={item?.id || idx}>
                            <Td borderColor={tableBorderColor}>{item?.supply_code || "-"}</Td>
                            <Td borderColor={tableBorderColor}>{item?.name || "-"}</Td>
                            <Td borderColor={tableBorderColor}>
                              <Badge colorScheme="red" borderRadius="999px" px="8px">
                                {formatNumber(item?.quantity_in_stock)}
                              </Badge>
                            </Td>
                            <Td borderColor={tableBorderColor}>
                              {formatNumber(item?.minimum_stock_level)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Card>
            </GridItem>

            <GridItem>
              <Card p="20px" h="100%">
                <Text color={textColorPrimary} fontSize="lg" fontWeight="700" mb="16px">
                  Lô tài sản chờ duyệt
                </Text>
                {pendingApprovals.length === 0 ? (
                  <Text color={textColorSecondary} fontSize="sm">
                    Hiện không có lô tài sản nào đang chờ duyệt.
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th borderColor={tableBorderColor}>Mã</Th>
                          <Th borderColor={tableBorderColor}>Tên</Th>
                          <Th borderColor={tableBorderColor}>Danh mục</Th>
                          <Th borderColor={tableBorderColor}>SL</Th>
                          <Th borderColor={tableBorderColor}>Tạo lúc</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pendingApprovals.map((item, idx) => (
                          <Tr key={item?.id || idx}>
                            <Td borderColor={tableBorderColor}>{item?.code || "-"}</Td>
                            <Td borderColor={tableBorderColor}>{item?.name || "-"}</Td>
                            <Td borderColor={tableBorderColor}>{item?.category || "-"}</Td>
                            <Td borderColor={tableBorderColor}>{formatNumber(item?.quantity)}</Td>
                            <Td borderColor={tableBorderColor} fontSize="xs">
                              {formatDateTime(item?.created_at)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Card>
            </GridItem>
          </Grid>

          {/* Row 4: Recent activities */}
          <Card p="20px">
            <Text color={textColorPrimary} fontSize="lg" fontWeight="700" mb="16px">
              Hoạt động gần đây
            </Text>
            {recentActivities.length === 0 ? (
              <Text color={textColorSecondary} fontSize="sm">
                Chưa có dữ liệu hoạt động gần đây.
              </Text>
            ) : (
              <>
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr", xl: "repeat(4, 1fr)" }}
                  gap="12px"
                  mb="12px"
                >
                  {currentActivities.map((activity) => (
                    <Box
                      key={activity.id}
                      p="12px 14px"
                      borderRadius="14px"
                      border="1px solid"
                      borderColor={tableBorderColor}
                    >
                      <Text
                        color={textColorPrimary}
                        fontSize="sm"
                        fontWeight="700"
                        noOfLines={1}
                      >
                        {activity.title}
                      </Text>
                      {activity.subtitle ? (
                        <Text color={textColorSecondary} fontSize="xs" mt="4px">
                          {activity.subtitle}
                        </Text>
                      ) : null}
                      <Text color={textColorSecondary} fontSize="xs" mt="6px">
                        {formatDateTime(activity.time)}
                      </Text>
                    </Box>
                  ))}
                </Grid>
                <Flex gap="8px">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={currentPage === index + 1 ? "solid" : "outline"}
                      onClick={() => setCurrentPage(index + 1)}
                      borderRadius="8px"
                    >
                      {index + 1}
                    </Button>
                  ))}
                </Flex>
              </>
            )}
          </Card>
        </>
      ) : null}

      {!isLoading && isStaffDashboard ? (
        <Card p="20px">
          <Text color={textColorPrimary} fontSize="lg" fontWeight="700" mb="10px">
            Ghi chú
          </Text>
          <Text color={textColorSecondary} fontSize="sm">
            Dashboard của Staff đang dùng chế độ rút gọn theo phạm vi tài khoản hoặc
            phòng ban. Các biểu đồ trạng thái tổng hệ thống và hoạt động toàn cục chỉ
            hiển thị cho admin hoặc manager.
          </Text>
        </Card>
      ) : null}
    </Box>
  );
}
