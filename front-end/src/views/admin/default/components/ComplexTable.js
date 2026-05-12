/* eslint-disable */

import {
  Box,
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Card from "components/card/Card";
import Menu from "components/menu/MainMenu";
import * as React from "react";

const columnHelper = createColumnHelper();

export default function ComplexTable(props) {
  const { columnsData = [], tableData = [], title } = props;
  const [sorting, setSorting] = React.useState([]);
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const columns = React.useMemo(
    () =>
      columnsData.map((column) =>
        columnHelper.accessor(column.accessor, {
          id: column.accessor,
          header: () => (
            <Text
              justifyContent="space-between"
              align="center"
              fontSize={{ sm: "10px", lg: "12px" }}
              color="gray.400"
            >
              {column.Header}
            </Text>
          ),
          cell: (info) => (
            <Text color={textColor} fontSize="sm" fontWeight="700">
              {column.cell ? column.cell(info.getValue(), info.row.original) : (info.getValue() ?? "-")}
            </Text>
          ),
        }),
      ),
    [columnsData, textColor],
  );
  const [data, setData] = React.useState(() => [...tableData]);

  React.useEffect(() => {
    setData([...(tableData ?? [])]);
  }, [tableData]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });
  return (
    <Card
      flexDirection="column"
      w="100%"
      px="0px"
      overflowX={{ sm: "scroll", lg: "hidden" }}
    >
      <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
        <Text
          color={textColor}
          fontSize="22px"
          fontWeight="700"
          lineHeight="100%"
        >
          { title ? title : "Supplies Low Stock"}
        </Text>
        {/* <Menu /> */}
      </Flex>
      <Box>
        <Table variant="simple" color="gray.500" mb="24px" mt="12px">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <Th
                      key={header.id}
                      colSpan={header.colSpan}
                      pe="10px"
                      borderColor={borderColor}
                      cursor="pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Flex
                        justifyContent="space-between"
                        align="center"
                        fontSize={{ sm: "10px", lg: "12px" }}
                        color="gray.400"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: "",
                          desc: "",
                        }[header.column.getIsSorted()] ?? null}
                      </Flex>
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.length === 0 ? (
              <Tr>
                <Td
                  colSpan={columns.length || 1}
                  fontSize={{ sm: "14px" }}
                  borderColor="transparent"
                >
                  <Text color="gray.400" fontSize="sm" fontWeight="600">
                    No data available
                  </Text>
                </Td>
              </Tr>
            ) : (
              table
                .getRowModel()
                .rows.slice(0, 5)
                .map((row) => {
                  return (
                    <Tr key={row.id}>
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <Td
                            key={cell.id}
                            fontSize={{ sm: "14px" }}
                            minW={{ sm: "150px", md: "200px", lg: "auto" }}
                            borderColor="transparent"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </Td>
                        );
                      })}
                    </Tr>
                  );
                })
            )}
          </Tbody>
        </Table>
      </Box>
    </Card>
  );
}
