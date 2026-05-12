import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Portal,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Footer from "components/footer/FooterAdmin.js";
import Navbar from "components/navbar/NavbarAdmin.js";
import Sidebar from "components/sidebar/Sidebar.js";
import { SidebarContext } from "contexts/SidebarContext";
import routes from "routes.js";
import { getCurrentUser, logout } from "api/authApi";

const STAFF_ALLOWED_ADMIN_PATHS = new Set([
  "/default",
  "/assets-tables",
  "/quantity-assets-tables",
  "/supplies-tables",
  "/allocations",
  "/maintenance",
  "/asset-loans",
  "/warranties",
  "/profile",
]);

function routeIsAllowedForRole(route, role) {
  if (route.layout !== "/admin") return true;

  if (role === "staff") {
    return STAFF_ALLOWED_ADMIN_PATHS.has(route.path);
  }

  // admin / manager: cho phép tất cả route admin hiện có
  return true;
}

function filterRoutesByRole(routesList, role) {
  return routesList.reduce((acc, route) => {
    if (route.collapse && Array.isArray(route.items)) {
      const filteredItems = filterRoutesByRole(route.items, role);
      if (filteredItems.length > 0) {
        acc.push({ ...route, items: filteredItems });
      }
      return acc;
    }

    if (route.category && Array.isArray(route.items)) {
      const filteredItems = filterRoutesByRole(route.items, role);
      if (filteredItems.length > 0) {
        acc.push({ ...route, items: filteredItems });
      }
      return acc;
    }

    if (routeIsAllowedForRole(route, role)) {
      acc.push(route);
    }

    return acc;
  }, []);
}

function hasRouteAccess(routesList, currentPath) {
  for (let i = 0; i < routesList.length; i += 1) {
    const route = routesList[i];

    if ((route.collapse || route.category) && Array.isArray(route.items)) {
      if (hasRouteAccess(route.items, currentPath)) {
        return true;
      }
      continue;
    }

    if (
      route.layout === "/admin" &&
      currentPath.includes(route.layout + route.path)
    ) {
      return true;
    }
  }

  return false;
}

export default function Dashboard(props) {
  const { ...rest } = props;

  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { onOpen } = useDisclosure();

  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [name, setName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [authStatus, setAuthStatus] = useState("checking");

  const filteredRoutes = useMemo(
    () => filterRoutesByRole(routes, currentUserRole),
    [currentUserRole]
  );

  const adminRoutes = useMemo(
    () => filteredRoutes.filter((route) => route.layout === "/admin" || route.category || route.collapse),
    [filteredRoutes]
  );

  const getRoute = () => {
    return window.location.pathname !== "/admin/full-screen-maps";
  };

  const getActiveRoute = (routesList, currentPath) => {
    let activeRoute = "Dashboard";

    for (let i = 0; i < routesList.length; i += 1) {
      if (routesList[i].collapse) {
        const collapseActiveRoute = getActiveRoute(
          routesList[i].items,
          currentPath
        );
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else if (routesList[i].category) {
        const categoryActiveRoute = getActiveRoute(
          routesList[i].items,
          currentPath
        );
        if (categoryActiveRoute !== activeRoute) {
          return categoryActiveRoute;
        }
      } else if (
        currentPath.includes(routesList[i].layout + routesList[i].path)
      ) {
        return routesList[i].name;
      }
    }

    return activeRoute;
  };

  const getActiveNavbar = (routesList, currentPath) => {
    let activeNavbar = false;

    for (let i = 0; i < routesList.length; i += 1) {
      if (routesList[i].collapse) {
        const collapseActiveNavbar = getActiveNavbar(
          routesList[i].items,
          currentPath
        );
        if (collapseActiveNavbar !== activeNavbar) {
          return collapseActiveNavbar;
        }
      } else if (routesList[i].category) {
        const categoryActiveNavbar = getActiveNavbar(
          routesList[i].items,
          currentPath
        );
        if (categoryActiveNavbar !== activeNavbar) {
          return categoryActiveNavbar;
        }
      } else if (
        currentPath.includes(routesList[i].layout + routesList[i].path)
      ) {
        return routesList[i].secondary;
      }
    }

    return activeNavbar;
  };

  const getActiveNavbarText = (routesList, currentPath) => {
    let activeNavbarText = false;

    for (let i = 0; i < routesList.length; i += 1) {
      if (routesList[i].collapse) {
        const collapseActiveNavbarText = getActiveNavbarText(
          routesList[i].items,
          currentPath
        );
        if (collapseActiveNavbarText !== activeNavbarText) {
          return collapseActiveNavbarText;
        }
      } else if (routesList[i].category) {
        const categoryActiveNavbarText = getActiveNavbarText(
          routesList[i].items,
          currentPath
        );
        if (categoryActiveNavbarText !== activeNavbarText) {
          return categoryActiveNavbarText;
        }
      } else if (
        currentPath.includes(routesList[i].layout + routesList[i].path)
      ) {
        return routesList[i].messageNavbar;
      }
    }

    return activeNavbarText;
  };

  const getRoutes = (routesList) => {
    return routesList.map((route, key) => {
      if (route.layout === "/admin") {
        return (
          <Route path={route.path} element={route.component} key={key} />
        );
      }

      if (route.collapse) {
        return getRoutes(route.items);
      }

      if (route.category) {
        return getRoutes(route.items);
      }

      return null;
    });
  };

  const handleUnauthorized = useCallback(
    (description = "Vui lòng đăng nhập lại.") => {
      logout();
      setAuthStatus("guest");

      toast({
        title: "Phiên đăng nhập đã hết hạn",
        description,
        status: "warning",
        duration: 2500,
        isClosable: true,
      });

      navigate("/auth/sign-in", {
        replace: true,
        state: { from: location.pathname },
      });
    },
    [location.pathname, navigate, toast]
  );

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setAuthStatus("guest");
      return;
    }

    try {
      const data = await getCurrentUser();

      setName(data?.full_name || data?.username || "");
      setCurrentUserRole(data?.role || "");
      setAuthStatus("authenticated");
    } catch (error) {
      console.error("Fetch current user failed:", error);

      const statusCode = error?.status || error?.statusCode;
      if (statusCode === 401) {
        handleUnauthorized();
        return;
      }

      toast({
        title: "Không tải được thông tin người dùng",
        description:
          error?.message || "Có lỗi xảy ra khi kiểm tra đăng nhập.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });

      // Giữ lại phiên nếu chỉ là lỗi tạm thời, nhưng role sẽ rỗng
      setAuthStatus("authenticated");
    }
  }, [handleUnauthorized, toast]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const [brandText, setBrandText] = useState(
    getActiveRoute(adminRoutes, location.pathname)
  );
  const [secondary, setSecondary] = useState(
    getActiveNavbar(adminRoutes, location.pathname)
  );
  const [message, setMessage] = useState(
    getActiveNavbarText(adminRoutes, location.pathname)
  );

  useEffect(() => {
    setBrandText(getActiveRoute(adminRoutes, location.pathname));
    setSecondary(getActiveNavbar(adminRoutes, location.pathname));
    setMessage(getActiveNavbarText(adminRoutes, location.pathname));
  }, [adminRoutes, location.pathname]);

  document.documentElement.dir = "ltr";

  if (authStatus === "checking") {
    return (
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        direction="column"
        gap="14px"
      >
        <Spinner thickness="4px" speed="0.65s" size="lg" />
        <Text fontSize="sm" color="gray.500">
          Đang kiểm tra phiên đăng nhập...
        </Text>
      </Flex>
    );
  }

  if (authStatus === "guest") {
    return <Navigate to="/auth/sign-in" replace />;
  }

  const isAdminRoot = location.pathname === "/admin" || location.pathname === "/admin/";
  const canAccessCurrentPath =
    isAdminRoot || hasRouteAccess(adminRoutes, location.pathname);

  if (!canAccessCurrentPath) {
    return <Navigate to="/admin/default" replace />;
  }

  return (
    <Box>
      <Box>
        <SidebarContext.Provider
          value={{
            toggleSidebar,
            setToggleSidebar,
          }}
        >
          <Sidebar routes={adminRoutes} display="none" {...rest} />

          <Box
            float="right"
            minHeight="100vh"
            height="100%"
            overflow="auto"
            position="relative"
            maxHeight="100%"
            w={{ base: "100%", xl: "calc(100% - 290px)" }}
            maxWidth={{ base: "100%", xl: "calc(100% - 290px)" }}
            transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
            transitionDuration=".2s, .2s, .35s"
            transitionProperty="top, bottom, width"
            transitionTimingFunction="linear, linear, ease"
          >
            <Portal>
              <Box>
                <Navbar
                  name={name}
                  onOpen={onOpen}
                  logoText="Horizon UI Dashboard PRO"
                  brandText={brandText}
                  secondary={secondary}
                  message={message}
                  fixed={fixed}
                  {...rest}
                />
              </Box>
            </Portal>

            {getRoute() ? (
              <Box
                mx="auto"
                p={{ base: "20px", md: "30px" }}
                pe="20px"
                minH="100vh"
                pt="50px"
              >
                <Routes>
                  {getRoutes(adminRoutes)}
                  <Route
                    path="/"
                    element={<Navigate to="/admin/default" replace />}
                  />
                </Routes>
              </Box>
            ) : null}

            <Box>
              <Footer />
            </Box>
          </Box>
        </SidebarContext.Provider>
      </Box>
    </Box>
  );
}
