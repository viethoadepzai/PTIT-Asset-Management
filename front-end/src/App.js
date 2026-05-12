import "./assets/css/App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { ChakraProvider } from "@chakra-ui/react";

import AuthLayout from "./layouts/auth";
import AdminLayout from "./layouts/admin";
import RTLLayout from "./layouts/rtl";
import initialTheme from "./theme/theme";

export default function Main() {
  const [currentTheme] = useState(initialTheme);

  const defaultRedirect = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? "/admin/default" : "/auth/sign-in";
  }, []);

  return (
    <ChakraProvider theme={currentTheme}>
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route path="admin/*" element={<AdminLayout />} />
        <Route path="rtl/*" element={<RTLLayout />} />
        <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
        <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
      </Routes>
    </ChakraProvider>
  );
}