import React from "react";
import { Box, Text, Spinner, useColorModeValue } from "@chakra-ui/react";
import axios from "axios";

export default function DetailInfoCard({ data, loading, error }) {

  const bg = useColorModeValue("white", "navy.800");
  const color = useColorModeValue("gray.700", "white");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");

  return (
    <Box
      mt="24px"
      p="24px"
      borderRadius="20px"
      bg={bg}
      color={color}
      border="1px solid"
      borderColor={border}
      boxShadow="md"
      w="100%"
    >
      {loading ? (
        <Spinner />
      ) : error ? (
        <Text color="red.400">{error}</Text>
      ) : data ? (
        <>
          <Text fontSize="xl" fontWeight="bold" mb="8px">
            {data?.title}
          </Text>
          <Text fontSize="md">{data?.content}</Text>
        </>
      ) : (
        <Text>Nhập code để tìm kiếm</Text>
      )
      }
    </Box>
  );
}