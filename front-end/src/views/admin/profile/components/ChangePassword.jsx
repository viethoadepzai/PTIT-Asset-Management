import React from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import Card from "components/card/Card.js";
import { API_BASE_URL, jsonHeaders } from "config/api";

export default function ChangePassword(props) {
  const { onSuccess, ...rest } = props;
  const toast = useToast();
  const navigate = useNavigate();

  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const inputBg = useColorModeValue("white", "navy.800");

  const [form, setForm] = React.useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });

  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [generalError, setGeneralError] = React.useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setGeneralError("");
  };

  const resetForm = () => {
    setForm({
      current_password: "",
      new_password: "",
      confirm_new_password: "",
    });
    setFieldErrors({});
    setGeneralError("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const getErrorMessage = (data) => {
    if (!data) return "Đổi mật khẩu thất bại.";

    if (typeof data.detail === "string") return data.detail;

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => item?.msg || "Dữ liệu không hợp lệ")
        .join(", ");
    }

    if (typeof data.message === "string") return data.message;

    return "Đổi mật khẩu thất bại.";
  };

  const validateForm = () => {
    const errors = {};

    if (!form.current_password.trim()) {
      errors.current_password = "Vui lòng nhập mật khẩu hiện tại.";
    } else if (form.current_password.length < 6) {
      errors.current_password = "Mật khẩu hiện tại phải có ít nhất 6 ký tự.";
    }

    if (!form.new_password.trim()) {
      errors.new_password = "Vui lòng nhập mật khẩu mới.";
    } else if (form.new_password.length < 6) {
      errors.new_password = "Mật khẩu mới phải có ít nhất 6 ký tự.";
    } else if (form.new_password === form.current_password) {
      errors.new_password = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    }

    if (!form.confirm_new_password.trim()) {
      errors.confirm_new_password = "Vui lòng xác nhận mật khẩu mới.";
    } else if (form.confirm_new_password !== form.new_password) {
      errors.confirm_new_password = "Xác nhận mật khẩu mới chưa khớp.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");

    toast({
      title: "Phiên đăng nhập đã hết hạn",
      description: "Vui lòng đăng nhập lại.",
      status: "warning",
      duration: 2500,
      isClosable: true,
    });

    navigate("/auth/sign-in", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message = getErrorMessage(data);
        setGeneralError(message);
        throw new Error(message);
      }

      resetForm();

      toast({
        title: "Đổi mật khẩu thành công",
        description: "Mật khẩu của bạn đã được cập nhật.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      if (typeof onSuccess === "function") {
        onSuccess(data);
      }
    } catch (error) {
      if (error.message !== "401") {
        toast({
          title: "Đổi mật khẩu thất bại",
          description: error.message || "Có lỗi xảy ra.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card p="24px" {...rest}>
      <Flex
        direction="column"
        align="flex-start"
        mb="20px"
      >
        <Text color={textColorPrimary} fontSize="xl" fontWeight="700">
          Đổi mật khẩu
        </Text>
        <Text color={textColorSecondary} fontSize="sm" mt="4px">
          Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
        </Text>
      </Flex>

      <form onSubmit={handleSubmit}>
        <Stack spacing="18px">
          {generalError ? (
            <Alert status="error" borderRadius="14px">
              <AlertIcon />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          ) : null}

          <FormControl isInvalid={!!fieldErrors.current_password}>
            <FormLabel fontSize="sm" fontWeight="600">
              Mật khẩu hiện tại
            </FormLabel>
            <InputGroup>
              <Input
                name="current_password"
                type={showCurrent ? "text" : "password"}
                value={form.current_password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
                borderRadius="14px"
                borderColor={borderColor}
                bg={inputBg}
              />
              <InputRightElement>
                <IconButton
                  variant="ghost"
                  aria-label={
                    showCurrent ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"
                  }
                  icon={showCurrent ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowCurrent((prev) => !prev)}
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{fieldErrors.current_password}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!fieldErrors.new_password}>
            <FormLabel fontSize="sm" fontWeight="600">
              Mật khẩu mới
            </FormLabel>
            <InputGroup>
              <Input
                name="new_password"
                type={showNew ? "text" : "password"}
                value={form.new_password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới"
                borderRadius="14px"
                borderColor={borderColor}
                bg={inputBg}
              />
              <InputRightElement>
                <IconButton
                  variant="ghost"
                  aria-label={showNew ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                  icon={showNew ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowNew((prev) => !prev)}
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
            <FormHelperText color={textColorSecondary}>
              Tối thiểu 6 ký tự và không được trùng mật khẩu hiện tại.
            </FormHelperText>
            <FormErrorMessage>{fieldErrors.new_password}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!fieldErrors.confirm_new_password}>
            <FormLabel fontSize="sm" fontWeight="600">
              Xác nhận mật khẩu mới
            </FormLabel>
            <InputGroup>
              <Input
                name="confirm_new_password"
                type={showConfirm ? "text" : "password"}
                value={form.confirm_new_password}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                borderRadius="14px"
                borderColor={borderColor}
                bg={inputBg}
              />
              <InputRightElement>
                <IconButton
                  variant="ghost"
                  aria-label={
                    showConfirm
                      ? "Ẩn xác nhận mật khẩu mới"
                      : "Hiện xác nhận mật khẩu mới"
                  }
                  icon={showConfirm ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowConfirm((prev) => !prev)}
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{fieldErrors.confirm_new_password}</FormErrorMessage>
          </FormControl>

          <Flex gap="12px" pt="4px" flexWrap="wrap">
            <Button
              type="submit"
              colorScheme="blue"
              borderRadius="14px"
              isLoading={isSubmitting}
              loadingText="Đang cập nhật"
            >
              Cập nhật mật khẩu
            </Button>

            <Button
              type="button"
              variant="outline"
              borderRadius="14px"
              onClick={resetForm}
              isDisabled={isSubmitting}
            >
              Nhập lại
            </Button>
          </Flex>
        </Stack>
      </form>
    </Card>
  );
}