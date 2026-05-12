export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_BASE_URL || "http://127.0.0.1:8000";

export const authHeaders = (extra = {}) => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
};

export const jsonHeaders = () =>
  authHeaders({
    "Content-Type": "application/json",
  });