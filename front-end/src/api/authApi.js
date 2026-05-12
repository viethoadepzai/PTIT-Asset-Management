import {
  apiRequest,
  clearAuthStorage,
  getAccessToken,
} from "./http";

export async function login(username, password) {
  const data = await apiRequest("/auth/login-json", {
    method: "POST",
    auth: false,
    body: {
      username,
      password,
    },
    fallbackErrorMessage: "Đăng nhập thất bại.",
  });

  const accessToken = data?.access_token;
  const tokenType = data?.token_type || "bearer";

  if (!accessToken) {
    throw new Error("Không nhận được access token từ server.");
  }

  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("token_type", tokenType);

  return data;
}

export async function getCurrentUser() {
  return apiRequest("/auth/me", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin người dùng.",
  });
}

export async function loginAndFetchProfile(username, password) {
  await login(username, password);
  return getCurrentUser();
}

export async function changePassword(payload) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Đổi mật khẩu thất bại.",
  });
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/auth/me/avatar", {
    method: "POST",
    auth: true,
    body: formData,
    fallbackErrorMessage: "Upload avatar thất bại.",
  });
}

export function hasAuthToken() {
  return Boolean(getAccessToken());
}

export function logout() {
  clearAuthStorage();
}