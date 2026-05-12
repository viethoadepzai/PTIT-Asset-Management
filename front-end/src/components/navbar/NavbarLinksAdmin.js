// Chakra Imports
import {
  Avatar,
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
// Custom Components
import { SidebarResponsive } from "components/sidebar/Sidebar";
import PropTypes from "prop-types";
import React from "react";
import { useNavigate } from "react-router-dom";
// Assets
import { MdNotificationsNone } from "react-icons/md";
import { IoMdMoon, IoMdSunny } from "react-icons/io";
import { FaEthereum } from "react-icons/fa";
import routes from "routes";
import {
  API_BASE_URL,
  BACKEND_BASE_URL,
  authHeaders,
} from "config/api";
import defaultAvatar from "assets/img/avatars/avatar4.png";

function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("current_user") || "{}");
  } catch {
    return {};
  }
}

function resolveAvatarUrl(avatarPath) {
  if (!avatarPath) return defaultAvatar;
  if (
    avatarPath.startsWith("http://") ||
    avatarPath.startsWith("https://")
  ) {
    return avatarPath;
  }
  return `${BACKEND_BASE_URL}${avatarPath}`;
}

function appendCacheBuster(url, version) {
  if (!url || url === defaultAvatar) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}

export default function HeaderLinks(props) {
  const { secondary } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  const navbarIcon = useColorModeValue("gray.400", "white");
  const menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorBrand = useColorModeValue("brand.700", "brand.400");
  const ethColor = useColorModeValue("gray.700", "white");
  const borderColor = useColorModeValue("#E6ECFA", "rgba(135, 140, 189, 0.3)");
  const ethBg = useColorModeValue("secondaryGray.300", "navy.900");
  const ethBox = useColorModeValue("white", "navy.800");
  const shadow = useColorModeValue(
    "14px 17px 40px 4px rgba(112, 144, 176, 0.18)",
    "14px 17px 40px 4px rgba(112, 144, 176, 0.06)"
  );

  const [userInfo, setUserInfo] = React.useState(() => readCurrentUser());
  const [avatarVersion, setAvatarVersion] = React.useState(Date.now());

  const syncUserInfoFromStorage = React.useCallback(() => {
    const nextUser = readCurrentUser();

    setUserInfo((prevUser) => {
      const prevAvatar = prevUser?.avatar_path || prevUser?.avatar_url || "";
      const nextAvatar = nextUser?.avatar_path || nextUser?.avatar_url || "";

      if (prevAvatar !== nextAvatar) {
        setAvatarVersion(Date.now());
      }

      return nextUser || {};
    });
  }, []);

  const fetchCurrentUser = React.useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("current_user");
        navigate("/auth/sign-in", { replace: true });
        return;
      }

      if (!response.ok || !data) return;

      const oldCurrentUser = readCurrentUser();
      const prevAvatar = oldCurrentUser?.avatar_path || oldCurrentUser?.avatar_url || "";
      const nextAvatar = data?.avatar_path || data?.avatar_url || "";

      localStorage.setItem(
        "current_user",
        JSON.stringify({
          ...oldCurrentUser,
          ...data,
        })
      );

      setUserInfo({
        ...oldCurrentUser,
        ...data,
      });

      if (prevAvatar !== nextAvatar) {
        setAvatarVersion(Date.now());
      }
    } catch (error) {
      console.error("Fetch current user in navbar failed:", error);
    }
  }, [navigate]);

  React.useEffect(() => {
    syncUserInfoFromStorage();
    fetchCurrentUser();

    const handleStorage = () => {
      syncUserInfoFromStorage();
    };

    const handleFocus = () => {
      syncUserInfoFromStorage();
      fetchCurrentUser();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncUserInfoFromStorage();
        fetchCurrentUser();
      }
    };

    const handleCurrentUserUpdated = () => {
      syncUserInfoFromStorage();
      fetchCurrentUser();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("current-user-updated", handleCurrentUserUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("current-user-updated", handleCurrentUserUpdated);
    };
  }, [syncUserInfoFromStorage, fetchCurrentUser]);

  const displayName =
    userInfo?.full_name ||
    props.name ||
    userInfo?.username ||
    "User";

  const avatarUrl = React.useMemo(() => {
    const rawPath = userInfo?.avatar_path || userInfo?.avatar_url || null;
    const resolved = resolveAvatarUrl(rawPath);
    return appendCacheBuster(resolved, avatarVersion);
  }, [userInfo?.avatar_path, userInfo?.avatar_url, avatarVersion]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("current_user");
    navigate("/auth/sign-in");
  };

  return (
    <Flex
      w={{ sm: "100%", md: "auto" }}
      alignItems="center"
      flexDirection="row"
      bg={menuBg}
      flexWrap={secondary ? { base: "wrap", md: "nowrap" } : "unset"}
      p="10px"
      borderRadius="30px"
      boxShadow={shadow}
    >
      <Flex
        bg={ethBg}
        display={secondary ? "flex" : "none"}
        borderRadius="30px"
        ms="auto"
        p="6px"
        align="center"
        me="6px"
      >
        <Flex
          align="center"
          justify="center"
          bg={ethBox}
          h="29px"
          w="29px"
          borderRadius="30px"
          me="7px"
        >
          <Icon color={ethColor} w="9px" h="14px" as={FaEthereum} />
        </Flex>
        <Text
          w="max-content"
          color={ethColor}
          fontSize="sm"
          fontWeight="700"
          me="6px"
        >
          1,924
          <Text as="span" display={{ base: "none", md: "unset" }}>
            {" "}ETH
          </Text>
        </Text>
      </Flex>

      <SidebarResponsive routes={routes} />

      <Menu>
        <MenuButton p="0px">
          <Icon
            mt="6px"
            as={MdNotificationsNone}
            color={navbarIcon}
            w="18px"
            h="18px"
            me="10px"
          />
        </MenuButton>
        <MenuList
          boxShadow={shadow}
          p="20px"
          borderRadius="20px"
          bg={menuBg}
          border="none"
          mt="22px"
          me={{ base: "30px", md: "unset" }}
          minW={{ base: "unset", md: "400px", xl: "450px" }}
          maxW={{ base: "360px", md: "unset" }}
        >
          <Flex w="100%" mb="20px">
            <Text fontSize="md" fontWeight="600" color={textColor}>
              Notifications
            </Text>
            <Text
              fontSize="sm"
              fontWeight="500"
              color={textColorBrand}
              ms="auto"
              cursor="pointer"
            >
              Mark all read
            </Text>
          </Flex>
          <Flex flexDirection="column" />
        </MenuList>
      </Menu>

      <Button
        variant="no-hover"
        bg="transparent"
        p="0px"
        minW="unset"
        minH="unset"
        h="18px"
        w="max-content"
        onClick={toggleColorMode}
      >
        <Icon
          me="10px"
          h="18px"
          w="18px"
          color={navbarIcon}
          as={colorMode === "light" ? IoMdMoon : IoMdSunny}
        />
      </Button>

      <Menu>
        <MenuButton p="0px">
          <Avatar
            key={avatarUrl || "navbar-avatar"}
            _hover={{ cursor: "pointer" }}
            color="white"
            name={displayName}
            src={avatarUrl}
            bg="#11047A"
            size="sm"
            w="40px"
            h="40px"
          />
        </MenuButton>
        <MenuList
          boxShadow={shadow}
          p="0px"
          mt="10px"
          borderRadius="20px"
          bg={menuBg}
          border="none"
        >
          <Flex w="100%" mb="0px">
            <Text
              ps="20px"
              pt="16px"
              pb="10px"
              w="100%"
              borderBottom="1px solid"
              borderColor={borderColor}
              fontSize="sm"
              fontWeight="700"
              color={textColor}
            >
              👋&nbsp; Xin chào, {displayName}
            </Text>
          </Flex>
          <Flex flexDirection="column" p="10px">
            <MenuItem
              _hover={{ bg: "none" }}
              _focus={{ bg: "none" }}
              color="red.400"
              borderRadius="8px"
              px="14px"
              onClick={handleLogout}
            >
              <Text fontSize="sm">Đăng xuất</Text>
            </MenuItem>
          </Flex>
        </MenuList>
      </Menu>
    </Flex>
  );
}

HeaderLinks.propTypes = {
  name: PropTypes.string,
  variant: PropTypes.string,
  fixed: PropTypes.bool,
  secondary: PropTypes.bool,
  onOpen: PropTypes.func,
};