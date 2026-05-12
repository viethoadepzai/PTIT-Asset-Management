import React from "react";
import {
  Avatar,
  Box,
  Flex,
  Icon,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { MdUpload } from "react-icons/md";

import Card from "components/card/Card.js";
import Dropzone from "views/admin/profile/components/Dropzone";
import { API_BASE_URL, authHeaders } from "config/api";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function getErrorMessage(data) {
  if (!data) return "Tải ảnh đại diện thất bại.";

  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item?.msg || "Dữ liệu không hợp lệ").join(", ");
  }

  if (typeof data.message === "string") return data.message;

  return "Tải ảnh đại diện thất bại.";
}

export default function Upload(props) {
  const { currentAvatarUrl, onUploadSuccess, ...rest } = props;

  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const brandColor = useColorModeValue("brand.500", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const toast = useToast();
  const navigate = useNavigate();

  const [isUploading, setIsUploading] = React.useState(false);

  const handleUnauthorized = React.useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("current_user");

    toast({
      title: "Phiên đăng nhập đã hết hạn",
      description: "Vui lòng đăng nhập lại.",
      status: "warning",
      duration: 2500,
      isClosable: true,
    });

    navigate("/auth/sign-in", { replace: true });
  }, [navigate, toast]);

  const validateFile = React.useCallback((file) => {
    if (!file) return "Không có tệp được chọn.";
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Chỉ chấp nhận JPG, PNG, GIF hoặc WEBP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Kích thước ảnh tối đa là 2MB.";
    }
    return null;
  }, []);

  const handleDrop = React.useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "File không hợp lệ",
          description: validationError,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        handleUnauthorized();
        return;
      }

      try {
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/auth/me/avatar`, {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });

        const responseData = await response.json().catch(() => null);

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error(getErrorMessage(responseData));
        }

        await onUploadSuccess?.(responseData);

        toast({
          title: "Cập nhật ảnh đại diện thành công",
          description: "Ảnh đại diện của bạn đã được thay đổi.",
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      } catch (error) {
        console.error("Upload avatar failed:", error);
        toast({
          title: "Upload avatar thất bại",
          description: error.message || "Có lỗi xảy ra khi tải ảnh lên.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsUploading(false);
      }
    },
    [handleUnauthorized, onUploadSuccess, toast, validateFile]
  );

  return (
    <Card {...rest} p="24px">
      <Flex direction="column" w="100%" gap="20px">
        <Box>
          <Text color={textColorPrimary} fontSize="xl" fontWeight="700">
            Cập nhật avatar
          </Text>
          <Text color={textColorSecondary} fontSize="sm" mt="4px">
            Kéo thả ảnh vào khung bên dưới hoặc bấm vào đó để chọn ảnh mới.
          </Text>
        </Box>

        <Dropzone
          w="100%"
          minH="220px"
          maxH="220px"
          onDrop={handleDrop}
          multiple={false}
          disabled={isUploading}
          accept={{
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/gif": [".gif"],
            "image/webp": [".webp"],
          }}
          content={
            <Box textAlign="center" px="12px">
              <Icon as={MdUpload} w="56px" h="56px" color={brandColor} mb="12px" />
              <Text fontSize="xl" fontWeight="700" color={brandColor} mb="6px">
                {isUploading ? "Đang tải ảnh..." : "Tải ảnh đại diện"}
              </Text>
              <Text fontSize="sm" fontWeight="500" color={textColorSecondary}>
                JPG, PNG, GIF, WEBP - tối đa 2MB
              </Text>
            </Box>
          }
        />

        <Box
          border="1px solid"
          borderColor={borderColor}
          borderRadius="18px"
          p="16px"
        >
          <Flex align="center" gap="14px">
            <Avatar
              key={currentAvatarUrl || "current-avatar"}
              src={currentAvatarUrl}
              name="Current avatar"
              w="64px"
              h="64px"
              flexShrink={0}
            />
            <Box minW="0" flex="1">
              <Text color={textColorPrimary} fontSize="md" fontWeight="700">
                Ảnh hiện tại
              </Text>
              <Text color={textColorSecondary} fontSize="sm" mt="4px">
                Ảnh mới sẽ được cập nhật ngay sau khi tải lên thành công.
              </Text>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
}