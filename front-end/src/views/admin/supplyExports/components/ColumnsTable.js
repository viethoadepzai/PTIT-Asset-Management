import React from "react";
import {
  Badge,
  Button,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
};

const getStatusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "draft":
      return "Nháp";
    case "approved":
      return "Đã duyệt";
    case "cancelled":
      return "Đã hủy";
    default:
      return status || "-";
  }
};

const getStatusColorScheme = (status) => {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "draft":
      return "gray";
    case "approved":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
};

export default function ColumnsTable({
  tableData = [],
  actionLoadingKey = "",
  onApprove,
  onOpenCancel,
  onOpenPdf,
  canApprove = false,
  canCancel = false,
}) {
  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>STT</Th>
            <Th>Mã phiếu</Th>
            <Th>Ngày xuất</Th>
            <Th>Phòng ban nhận</Th>
            <Th>Vật tư</Th>
            <Th>Trạng thái</Th>
            <Th>Người duyệt</Th>
            <Th>Lý do</Th>
            <Th>Ghi chú</Th>
            <Th>Thao tác</Th>
          </Tr>
        </Thead>

        <Tbody>
          {tableData.length ? (
            tableData.map((voucher) => {
              const normalizedStatus = String(voucher.status || "").toLowerCase();

              return (
                <Tr key={voucher.id}>
                  <Td>{voucher.stt}</Td>
                  <Td fontWeight="bold">{voucher.voucher_code || `#${voucher.id}`}</Td>
                  <Td>{formatDate(voucher.export_date || voucher.created_at)}</Td>
                  <Td>{voucher.recipient_department_name}</Td>
                  <Td whiteSpace="normal" minW="260px">
                    {voucher.items_summary || "-"}
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColorScheme(voucher.status)}>
                      {getStatusLabel(voucher.status)}
                    </Badge>
                  </Td>
                  <Td>{voucher.approved_by_name}</Td>
                  <Td whiteSpace="normal" maxW="220px">
                    {voucher.reason || "-"}
                  </Td>
                  <Td whiteSpace="normal" maxW="220px">
                    {voucher.note || "-"}
                  </Td>
                  <Td>
                    <VStack align="stretch" spacing="8px">
                      {canApprove && normalizedStatus === "draft" && (
                        <Button
                          size="xs"
                          colorScheme="green"
                          onClick={() => onApprove(voucher)}
                          isLoading={actionLoadingKey === `approve-${voucher.id}`}
                        >
                          Duyệt
                        </Button>
                      )}

                      {canCancel && normalizedStatus === "draft" && (
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => onOpenCancel(voucher)}
                        >
                          Hủy phiếu
                        </Button>
                      )}

                      <Button
                        size="xs"
                        leftIcon={<DownloadIcon />}
                        variant="outline"
                        onClick={() => onOpenPdf(voucher)}
                        isLoading={actionLoadingKey === `pdf-${voucher.id}`}
                      >
                        PDF
                      </Button>
                    </VStack>
                  </Td>
                </Tr>
              );
            })
          ) : (
            <Tr>
              <Td colSpan={10}>
                <Flex align="center" justify="center" minH="120px">
                  <Text color="gray.500">Chưa có phiếu xuất vật tư nào.</Text>
                </Flex>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
}