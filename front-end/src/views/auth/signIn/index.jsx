/* eslint-disable */
/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _|
 | |_| | | | | |_) || |  / / | | |  \| | | | | || |
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|

=========================================================
* Horizon UI - v1.1.0
=========================================================

* Product Page: https://www.horizon-ui.com/
* Copyright 2023 Horizon UI (https://www.horizon-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/* eslint-disable */
import React from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";

import DefaultAuth from "layouts/auth/Default";
import illustration from "assets/img/auth/auth.png";
import {
  getCurrentUser,
  hasAuthToken,
  loginAndFetchProfile,
  logout,
} from "api/authApi";
import { isUnauthorizedError } from "api/http";

function SignIn() {
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const textColorBrand = useColorModeValue("brand.500", "white");
  const inputBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [formValues, setFormValues] = React.useState({
    username: "",
    password: "",
  });

  const redirectAfterLogin = React.useCallback(
    (profile) => {
      const from = location.state?.from;

      if (profile?.must_change_password) {
        navigate("/admin/profile", { replace: true });
        return;
      }

      if (from && typeof from === "string" && from.startsWith("/admin")) {
        navigate(from, { replace: true });
        return;
      }

      navigate("/admin/default", { replace: true });
    },
    [location.state, navigate]
  );

  const checkCurrentSession = React.useCallback(async () => {
    if (!hasAuthToken()) {
      setIsCheckingSession(false);
      return;
    }

    try {
      const profile = await getCurrentUser();
      redirectAfterLogin(profile);
    } catch (error) {
      console.error("Session check failed:", error);

      if (isUnauthorizedError(error)) {
        logout();
      }

      setIsCheckingSession(false);
    }
  }, [redirectAfterLogin]);

  React.useEffect(() => {
    checkCurrentSession();
  }, [checkCurrentSession]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};
    const username = formValues.username.trim();
    const password = formValues.password;

    if (!username) {
      errors.username = "Vui lòng nhập tên đăng nhập.";
    }

    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const username = formValues.username.trim();
    const password = formValues.password;

    setIsSubmitting(true);

    try {
      const profile = await loginAndFetchProfile(username, password);

      toast({
        title: "Đăng nhập thành công",
        description: `Xin chào ${
          profile?.full_name || profile?.username || username
        }`,
        status: "success",
        duration: 2200,
        isClosable: true,
      });

      redirectAfterLogin(profile);
    } catch (error) {
      logout();

      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Có lỗi xảy ra khi đăng nhập.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });

      console.error("Đăng nhập thất bại:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultAuth illustrationBackground={illustration} image={illustration}>
      <Flex
        maxW={{ base: "100%", md: "max-content" }}
        w="100%"
        mx={{ base: "auto", lg: "0px" }}
        me="auto"
        h="100%"
        alignItems="start"
        justifyContent="center"
        mb={{ base: "30px", md: "60px" }}
        px={{ base: "25px", md: "0px" }}
        mt={{ base: "40px", md: "14vh" }}
        flexDirection="column"
      >
        <Box me="auto">
          <Heading color={textColor} fontSize="36px" mb="10px">
            Đăng Nhập
          </Heading>
          <Text
            mb="36px"
            ms="4px"
            color={textColorSecondary}
            fontWeight="400"
            fontSize="md"
          >
            Nhập tên đăng nhập và mật khẩu để truy cập hệ thống.
          </Text>
        </Box>

        <Flex
          zIndex="2"
          direction="column"
          w={{ base: "100%", md: "420px" }}
          background="transparent"
          borderRadius="15px"
          mx={{ base: "auto", lg: "unset" }}
          me="auto"
          mb={{ base: "20px", md: "auto" }}
        >
          <form onSubmit={handleSubmit}>
            <FormControl isInvalid={!!fieldErrors.username} mb="24px">
              <FormLabel
                display="flex"
                ms="10px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="8px"
              >
                Tên đăng nhập
              </FormLabel>
              <Input
                name="username"
                value={formValues.username}
                onChange={handleChange}
                variant="auth"
                fontSize="sm"
                type="text"
                placeholder="Nhập tên đăng nhập"
                fontWeight="500"
                size="lg"
                bg={inputBg}
                borderColor={borderColor}
                autoComplete="username"
                isDisabled={isSubmitting || isCheckingSession}
              />
              <FormErrorMessage>{fieldErrors.username}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!fieldErrors.password} mb="16px">
              <FormLabel
                ms="10px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                display="flex"
              >
                Mật khẩu
              </FormLabel>
              <InputGroup size="md">
                <Input
                  name="password"
                  value={formValues.password}
                  onChange={handleChange}
                  fontSize="sm"
                  placeholder="Nhập mật khẩu"
                  size="lg"
                  type={showPassword ? "text" : "password"}
                  variant="auth"
                  bg={inputBg}
                  borderColor={borderColor}
                  autoComplete="current-password"
                  isDisabled={isSubmitting || isCheckingSession}
                />
                <InputRightElement display="flex" alignItems="center" mt="4px">
                  <Icon
                    color={textColorSecondary}
                    _hover={{ cursor: "pointer" }}
                    as={showPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={() => setShowPassword((prev) => !prev)}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{fieldErrors.password}</FormErrorMessage>
            </FormControl>

            <Flex justifyContent="space-between" align="center" mb="24px">
              <Text color={textColorSecondary} fontSize="sm">
                Chưa hỗ trợ quên mật khẩu trong frontend hiện tại.
              </Text>
              <NavLink to="/auth/sign-in">
                <Text color={textColorBrand} fontSize="sm" fontWeight="500">
                  Đăng nhập hệ thống
                </Text>
              </NavLink>
            </Flex>

            <Button
              type="submit"
              fontSize="sm"
              variant="brand"
              fontWeight="500"
              w="100%"
              h="50"
              mb="24px"
              isLoading={isSubmitting || isCheckingSession}
              loadingText={
                isCheckingSession ? "Đang kiểm tra phiên..." : "Đang đăng nhập"
              }
              isDisabled={isCheckingSession}
            >
              Đăng nhập
            </Button>
          </form>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}

export default SignIn;