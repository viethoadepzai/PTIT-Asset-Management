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
    case "received":
      return "Đã nhận";
    case "returned":
      return "Đã trả";
    case "cancelled":
      return "Đã hủy";
    case "overdue":
      return "Quá hạn";
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
      return "blue";
    case "received":
      return "teal";
    case "returned":
      return "green";
    case "cancelled":
      return "red";
    case "overdue":
      return "orange";
    default:
      return "gray";
  }
};

export default function ColumnsTable({
  tableData = [],
  actionLoadingKey = "",
  onApprove,
  onOpenReceive,
  onOpenReturn,
  onOpenCancel,
  onOpenPdf,
  canApprove = false,
  canReceive = false,
  canReturn = false,
  canCancel = false,
}) {
  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>STT</Th>
            <Th>Mã phiếu</Th>
            <Th>Ngày mượn</Th>
            <Th>Phòng ban</Th>
            <Th>Người mượn</Th>
            <Th>Tài sản</Th>
            <Th>Trạng thái</Th>
            <Th>Ngày trả dự kiến</Th>
            <Th>Ngày trả thực tế</Th>
            <Th>Người duyệt</Th>
            <Th>Ghi chú</Th>
            <Th>Thao tác</Th>
          </Tr>
        </Thead>

        <Tbody>
          {tableData.length ? (
            tableData.map((loan) => {
              const normalizedStatus = String(loan.status || "").toLowerCase();

              return (
                <Tr key={loan.id}>
                  <Td>{loan.stt}</Td>
                  <Td fontWeight="bold">{loan.voucher_code || `#${loan.id}`}</Td>
                  <Td>{formatDate(loan.loan_date)}</Td>
                  <Td>{loan.borrower_department_name}</Td>
                  <Td>{loan.borrower_user_name}</Td>
                  <Td whiteSpace="normal" minW="260px">
                    {loan.items_summary || "-"}
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColorScheme(loan.status)}>
                      {getStatusLabel(loan.status)}
                    </Badge>
                  </Td>
                  <Td>{formatDate(loan.expected_return_date)}</Td>
                  <Td>{formatDate(loan.actual_return_date)}</Td>
                  <Td>{loan.approved_by_name}</Td>
                  <Td whiteSpace="normal" maxW="240px">
                    {loan.note || "-"}
                  </Td>
                  <Td>
                    <VStack align="stretch" spacing="8px">
                      {canApprove && normalizedStatus === "draft" && (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => onApprove(loan)}
                          isLoading={actionLoadingKey === `approve-${loan.id}`}
                        >
                          Duyệt
                        </Button>
                      )}

                      {canReceive && normalizedStatus === "approved" && (
                        <Button
                          size="xs"
                          colorScheme="teal"
                          onClick={() => onOpenReceive(loan)}
                          isLoading={actionLoadingKey === `receive-${loan.id}`}
                        >
                          Đã nhận tài sản
                        </Button>
                      )}

                      {canReturn &&
                        (normalizedStatus === "approved" ||
                          normalizedStatus === "received") && (
                          <Button
                            size="xs"
                            colorScheme="green"
                            onClick={() => onOpenReturn(loan)}
                          >
                            Trả tài sản
                          </Button>
                        )}

                      {canCancel &&
                        (normalizedStatus === "draft" ||
                          normalizedStatus === "approved" ||
                          normalizedStatus === "received") && (
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => onOpenCancel(loan)}
                          >
                            Hủy phiếu
                          </Button>
                        )}

                      <Button
                        size="xs"
                        leftIcon={<DownloadIcon />}
                        variant="outline"
                        onClick={() => onOpenPdf(loan)}
                        isLoading={actionLoadingKey === `pdf-${loan.id}`}
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
                  <Text color="gray.500">Chưa có phiếu mượn nào.</Text>
                </Flex>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
}