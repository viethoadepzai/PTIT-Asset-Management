import React, { useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Box, useColorModeValue } from "@chakra-ui/react";

import routes from "routes.js";
import { SidebarContext } from "contexts/SidebarContext";

export default function Auth() {
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const location = useLocation();

  const authBg = useColorModeValue("white", "navy.900");

  const authRoutes = useMemo(
    () => routes.filter((route) => route.layout === "/auth"),
    []
  );

  const getRoutes = (routesList) => {
    return routesList.map((route, key) => {
      if (route.collapse && Array.isArray(route.items)) {
        return getRoutes(route.items);
      }

      if (route.category && Array.isArray(route.items)) {
        return getRoutes(route.items);
      }

      if (route.layout === "/auth") {
        return (
          <Route
            path={route.path}
            element={route.component}
            key={`${route.layout}-${route.path}-${key}`}
          />
        );
      }

      return null;
    });
  };

  const hasToken = Boolean(localStorage.getItem("access_token"));
  const isSignInRoute = location.pathname === "/auth/sign-in";

  document.documentElement.dir = "ltr";

  if (hasToken && isSignInRoute) {
    return <Navigate to="/admin/default" replace />;
  }

  return (
    <SidebarContext.Provider
      value={{
        toggleSidebar,
        setToggleSidebar,
      }}
    >
      <Box
        minH="100vh"
        w="100%"
        bg={authBg}
        overflowX="hidden"
      >
        <Routes>
          {getRoutes(authRoutes)}
          <Route path="/" element={<Navigate to="/auth/sign-in" replace />} />
          <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
        </Routes>
      </Box>
    </SidebarContext.Provider>
  );
}