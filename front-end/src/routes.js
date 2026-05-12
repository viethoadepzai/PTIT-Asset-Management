import React from "react";
import { Icon } from "@chakra-ui/react";
import {
  MdBarChart,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
  MdPerson,
  MdAssignmentReturn,
  MdBuild,
  MdAssessment,
  MdAccountBalance,
} from "react-icons/md";

// Admin Imports
import MainDashboard from "views/admin/default";
import Profile from "views/admin/profile";
import Categories from "views/admin/categories";
import Departments from "views/admin/departments";
import Users from "views/admin/users";
import AssetsTable from "views/admin/assets";
import QuantityAssetsTable from "views/admin/quantity_assets"
import AssetNeeds from "views/admin/asset_needs"
import SuppliesTable from "views/admin/supplies";
import Allocations from "views/admin/allocations";
import Maintenance from "views/admin/maintenances";
import AssetLoans from "views/admin/assetLoans";
import SupplyExports from "views/admin/supplyExports";
import Warranties from "views/admin/warranties";
import DepartmentAllocations from "views/admin/departmentAllocations";
import InventoryAudits from "views/admin/inventoryAudits";
import AuditDetails from "views/admin/inventoryAudits/AuditDetails";

// Auth Imports
import SignInCentered from "views/auth/signIn";

const routes = [
  {
    name: "Trang chủ",
    layout: "/admin",
    path: "/default",
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
    roles: ["admin", "manager", "staff"],
  },
  {
    name: "HỆ THỐNG",
    category: true,
    items: [
      {
        name: "Phòng ban",
        layout: "/admin",
        path: "/departments-tables",
        icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
        component: <Departments />,
        roles: ["admin", "manager"],
      },
      {
        name: "Người dùng",
        layout: "/admin",
        path: "/users-tables",
        icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
        component: <Users />,
        roles: ["admin", "manager"],
      },
      {
        name: "Danh mục",
        layout: "/admin",
        path: "/categories",
        icon: <Icon as={MdOutlineShoppingCart} width="20px" height="20px" color="inherit" />,
        component: <Categories />,
        roles: ["admin"],
      },
    ],
  },
  {
    name: "TÀI SẢN & VẬT TƯ",
    category: true,
    items: [
      {
        name: "Tài sản văn phòng",
        layout: "/admin",
        path: "/assets-tables",
        icon: <Icon as={MdOutlineShoppingCart} width="20px" height="20px" color="inherit" />,
        component: <AssetsTable />,
        roles: ["admin", "manager", "staff"],
      },
      {
        name: "Tài sản số lượng lớn",
        layout: "/admin",
        path: "/quantity-assets-tables",
        icon: <Icon as={MdOutlineShoppingCart} width="20px" height="20px" color="inherit" />,
        component: <QuantityAssetsTable />,
        roles: ["admin", "manager", "staff"],
      },
      {
        name: "Vật tư",
        layout: "/admin",
        path: "/supplies-tables",
        icon: <Icon as={MdOutlineShoppingCart} width="20px" height="20px" color="inherit" />,
        component: <SuppliesTable />,
        roles: ["admin", "manager", "staff"],
      },
      {
        name: "Nhu cầu danh mục",
        layout: "/admin",
        path: "/asset-needs",
        icon: <Icon as={MdAssessment} width="20px" height="20px" color="inherit" />,
        component: <AssetNeeds />,
        roles: ["admin"],
      },
    ],
  },
  {
    name: "NGHIỆP VỤ",
    category: true,
    items: [
      {
        name: "Cấp phát văn phòng",
        layout: "/admin",
        path: "/allocations",
        icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
        component: <Allocations />,
        roles: ["admin", "manager", "staff"],
      },
      {
        name: "Xuất vật tư",
        layout: "/admin",
        path: "/supply-exports",
        icon: <Icon as={MdOutlineShoppingCart} width="20px" height="20px" color="inherit" />,
        component: <SupplyExports />,
        roles: ["admin", "manager"],
      },
      {
        name: "Cho mượn tài sản",
        layout: "/admin",
        path: "/asset-loans",
        icon: <Icon as={MdAssignmentReturn} width="20px" height="20px" color="inherit" />,
        component: <AssetLoans />,
        roles: ["admin", "manager", "staff"],
      },
      {
        name: "Bảo trì",
        layout: "/admin",
        path: "/maintenance",
        icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
        component: <Maintenance />,
        roles: ["admin", "manager", "staff"],
      },
      {
        name: "Kiểm kê định kỳ",
        layout: "/admin",
        path: "/inventory-audits",
        icon: <Icon as={MdAssessment} width="20px" height="20px" color="inherit" />,
        component: <InventoryAudits />,
        roles: ["admin", "manager", "staff"],
      },
      {
        name: "Phân bổ TS số lượng lớn",
        layout: "/admin",
        path: "/department-allocations",
        icon: <Icon as={MdAccountBalance} width="20px" height="20px" color="inherit" />,
        component: <DepartmentAllocations />,
        roles: ["admin", "manager"],
      },
      {
        name: "Bảo hành",
        layout: "/admin",
        path: "/warranties",
        icon: <Icon as={MdBuild} width="20px" height="20px" color="inherit" />,
        component: <Warranties />,
        roles: ["admin", "manager", "staff"],
      },
      {
        name: "Chi tiết kiểm kê",
        layout: "/admin",
        path: "/inventory-audits/:id",
        component: <AuditDetails />,
        roles: ["admin", "manager", "staff"],
        hide: true,
      },
    ],
  },
  {
    name: "CÁ NHÂN",
    category: true,
    items: [
      {
        name: "Thông tin cá nhân",
        layout: "/admin",
        path: "/profile",
        icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
        component: <Profile />,
        roles: ["admin", "manager", "staff"],
      },
    ],
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "/sign-in",
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },
];

export default routes;