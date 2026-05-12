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

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return value;
  return numberValue.toLocaleString("vi-VN");
};

const getStatusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "draft":
      return "Nháp";
    case "sent":
      return "Đã gửi bảo hành";
    case "processing":
      return "Đang xử lý";
    case "completed":
      return "Hoàn tất";
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
    case "sent":
      return "blue";
    case "processing":
      return "orange";
    case "completed":
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
  onOpenSend,
  onOpenComplete,
  onOpenCancel,
  onOpenPdf,
  canSend = false,
  canComplete = false,
  canCancel = false,
}) {
  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>STT</Th>
            <Th>Mã phiếu</Th>
            <Th>Tài sản</Th>
            <Th>Nhà cung cấp</Th>
            <Th>Trạng thái</Th>
            <Th>Ngày gửi</Th>
            <Th>Ngày dự kiến nhận</Th>
            <Th>Ngày nhận lại</Th>
            <Th>Người tạo</Th>
            <Th>Người xử lý</Th>
            <Th>Chi phí</Th>
            <Th>Thao tác</Th>
          </Tr>
        </Thead>

        <Tbody>
          {tableData.length ? (
            tableData.map((ticket) => {
              const normalizedStatus = String(ticket.status || "").toLowerCase();

              return (
                <Tr key={ticket.id}>
                  <Td>{ticket.stt}</Td>
                  <Td fontWeight="bold">
                    {ticket.warranty_code || `#${ticket.id}`}
                  </Td>
                  <Td whiteSpace="normal" minW="240px">
                    {ticket.asset_label}
                  </Td>
                  <Td>
                    <Text>{ticket.vendor_name || "-"}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {ticket.provider_contact || ""}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColorScheme(ticket.status)}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </Td>
                  <Td>{formatDate(ticket.sent_date)}</Td>
                  <Td>{formatDate(ticket.expected_return_date)}</Td>
                  <Td>{formatDate(ticket.received_back_date)}</Td>
                  <Td>{ticket.created_by_name}</Td>
                  <Td>{ticket.handled_by_name}</Td>
                  <Td>{formatMoney(ticket.maintenance_cost)}</Td>
                  <Td>
                    <VStack align="stretch" spacing="8px">
                      {canSend && normalizedStatus === "draft" && (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => onOpenSend(ticket)}
                          isLoading={actionLoadingKey === `send-${ticket.id}`}
                        >
                          Gửi BH
                        </Button>
                      )}

                      {canComplete &&
                        (normalizedStatus === "sent" ||
                          normalizedStatus === "processing") && (
                          <Button
                            size="xs"
                            colorScheme="green"
                            onClick={() => onOpenComplete(ticket)}
                            isLoading={actionLoadingKey === `complete-${ticket.id}`}
                          >
                            Hoàn tất
                          </Button>
                        )}

                      {canCancel &&
                        (normalizedStatus === "draft" ||
                          normalizedStatus === "sent" ||
                          normalizedStatus === "processing") && (
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => onOpenCancel(ticket)}
                            isLoading={actionLoadingKey === `cancel-${ticket.id}`}
                          >
                            Hủy
                          </Button>
                        )}

                      <Button
                        size="xs"
                        leftIcon={<DownloadIcon />}
                        variant="outline"
                        onClick={() => onOpenPdf(ticket)}
                        isLoading={actionLoadingKey === `pdf-${ticket.id}`}
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
              <Td colSpan={12}>
                <Flex align="center" justify="center" minH="120px">
                  <Text color="gray.500">Chưa có phiếu bảo hành nào.</Text>
                </Flex>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
}