/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || | 
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|

=========================================================
* Horizon UI - v1.1.0
=========================================================
*/

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Flex,
  Grid,
  GridItem,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import Card from "components/card/Card.js";
import Banner from "views/admin/profile/components/Banner";
import Upload from "views/admin/profile/components/Upload";
import ChangePassword from "views/admin/profile/components/ChangePassword";

import banner from "assets/img/auth/banner.png";
import defaultAvatar from "assets/img/avatars/avatar4.png";

import {
  API_BASE_URL,
  BACKEND_BASE_URL,
  authHeaders,
} from "config/api";

const resolveAvatarUrl = (avatarPath) => {
  if (!avatarPath) return defaultAvatar;

  if (
    avatarPath.startsWith("http://") ||
    avatarPath.startsWith("https://")
  ) {
    return avatarPath;
  }

  return `${BACKEND_BASE_URL}${avatarPath}`;
};

const appendCacheBuster = (url, version) => {
  if (!url || url === defaultAvatar) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
};

const formatRole = (role) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "manager":
      return "Manager";
    case "staff":
      return "Staff";
    default:
      return role || "Chưa xác định";
  }
};

const formatDepartment = (profile) => {
  if (profile?.department?.name) return profile.department.name;
  if (profile?.department_id) return `Phòng ban #${profile.department_id}`;
  return "Chưa có phòng ban";
};

function InfoItem({ label, value }) {
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("secondaryGray.900", "white");

  return (
    <Box
      p="16px"
      borderRadius="16px"
      border="1px solid"
      borderColor={useColorModeValue("gray.200", "whiteAlpha.100")}
    >
      <Text fontSize="sm" color={labelColor} mb="6px">
        {label}
      </Text>
      <Text fontSize="md" fontWeight="700" color={valueColor}>
        {value ?? "Chưa có dữ liệu"}
      </Text>
    </Box>
  );
}

export default function Overview() {
  const toast = useToast();
  const navigate = useNavigate();

  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
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
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail || "Không tải được thông tin người dùng."
        );
      }

      setProfile(data || null);

      const oldCurrentUser = JSON.parse(
        localStorage.getItem("current_user") || "{}"
      );

      localStorage.setItem(
        "current_user",
        JSON.stringify({
          ...oldCurrentUser,
          ...(data || {}),
        })
      );

      window.dispatchEvent(new Event("current-user-updated"));
    } catch (error) {
      console.error("Fetch profile failed:", error);
      toast({
        title: "Không tải được hồ sơ",
        description: error.message || "Có lỗi xảy ra khi lấy dữ liệu.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const avatarUrl = useMemo(() => {
    const rawAvatarPath =
      profile?.avatar_path ||
      profile?.avatar_url ||
      null;

    const resolved = resolveAvatarUrl(rawAvatarPath);
    return appendCacheBuster(resolved, avatarVersion);
  }, [profile?.avatar_path, profile?.avatar_url, avatarVersion]);

  const handleUploadSuccess = useCallback(
    async (responseData) => {
      const nextAvatarPath =
        responseData?.avatar_path ||
        responseData?.avatar_url ||
        responseData?.user?.avatar_path ||
        responseData?.user?.avatar_url ||
        null;

      if (nextAvatarPath) {
        setProfile((prev) => ({
          ...(prev || {}),
          ...(responseData || {}),
          avatar_path: nextAvatarPath,
        }));

        const oldCurrentUser = JSON.parse(
          localStorage.getItem("current_user") || "{}"
        );

        localStorage.setItem(
          "current_user",
          JSON.stringify({
            ...oldCurrentUser,
            ...(responseData || {}),
            avatar_path: nextAvatarPath,
          })
        );

        window.dispatchEvent(new Event("current-user-updated"));
      }

      setAvatarVersion(Date.now());

      await fetchProfile();
    },
    [fetchProfile]
  );

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Grid
        templateColumns={{ base: "1fr", xl: "1.6fr 1fr" }}
        gap="20px"
        mb="20px"
      >
        <GridItem>
          <Stack spacing="20px">
            <Banner
              banner={banner}
              avatar={avatarUrl}
              name={profile?.full_name || profile?.username || "Người dùng"}
              role={formatRole(profile?.role)}
              department={formatDepartment(profile)}
            />

            {profile?.must_change_password && (
              <Alert
                status="warning"
                borderRadius="16px"
                alignItems="flex-start"
              >
                <AlertIcon mt="4px" />
                <AlertDescription>
                  Tài khoản của bạn đang được yêu cầu đổi mật khẩu. Hãy cập nhật
                  mật khẩu mới ở phần bên dưới để đảm bảo an toàn.
                </AlertDescription>
              </Alert>
            )}

            <Card p="24px">
              <Flex
                justify="space-between"
                align={{ base: "flex-start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                mb="20px"
                gap="12px"
              >
                <Box>
                  <Text color={textColorPrimary} fontSize="xl" fontWeight="700">
                    Thông tin tài khoản
                  </Text>
                  <Text color={textColorSecondary} fontSize="sm" mt="4px">
                    Thông tin cơ bản của tài khoản đang đăng nhập.
                  </Text>
                </Box>

                <Badge
                  px="12px"
                  py="6px"
                  borderRadius="999px"
                  colorScheme={profile?.is_active ? "green" : "red"}
                  fontSize="0.85em"
                >
                  {profile?.is_active ? "Đang hoạt động" : "Đã bị khóa"}
                </Badge>
              </Flex>

              {isLoading ? (
                <Flex align="center" justify="center" py="40px">
                  <Spinner thickness="4px" speed="0.65s" size="lg" />
                </Flex>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing="16px">
                  <InfoItem
                    label="Họ và tên"
                    value={profile?.full_name || "Chưa cập nhật"}
                  />
                  <InfoItem
                    label="Tên đăng nhập"
                    value={profile?.username || "Chưa cập nhật"}
                  />
                  <InfoItem
                    label="Email"
                    value={profile?.email || "Chưa cập nhật"}
                  />
                  <InfoItem
                    label="Vai trò"
                    value={formatRole(profile?.role)}
                  />
                  <InfoItem
                    label="Phòng ban"
                    value={formatDepartment(profile)}
                  />
                  <InfoItem
                    label="Trạng thái bảo mật"
                    value={
                      profile?.must_change_password
                        ? "Bắt buộc đổi mật khẩu"
                        : "Bình thường"
                    }
                  />
                </SimpleGrid>
              )}
            </Card>

            <ChangePassword />
          </Stack>
        </GridItem>

        <GridItem>
          <Stack spacing="20px">
            <Upload
              currentAvatarUrl={avatarUrl}
              onUploadSuccess={handleUploadSuccess}
            />

            <Card p="24px">
              <Text
                color={textColorPrimary}
                fontSize="lg"
                fontWeight="700"
                mb="12px"
              >
                Gợi ý bảo mật
              </Text>

              <Stack spacing="10px">
                <Text color={textColorSecondary} fontSize="sm">
                  • Mật khẩu nên có ít nhất 8 ký tự.
                </Text>
                <Text color={textColorSecondary} fontSize="sm">
                  • Nên kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
                </Text>
                <Text color={textColorSecondary} fontSize="sm">
                  • Không dùng lại mật khẩu cũ hoặc mật khẩu quá dễ đoán.
                </Text>
                <Text color={textColorSecondary} fontSize="sm">
                  • Sau khi đổi mật khẩu, hãy đăng nhập lại nếu hệ thống yêu cầu.
                </Text>
              </Stack>
            </Card>
          </Stack>
        </GridItem>
      </Grid>
    </Box>
  );
}