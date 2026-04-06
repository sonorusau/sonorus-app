import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Dropdown } from "antd";
import GlassButton from "./GlassButton";
import { useAuth } from "../contexts/AuthContext";

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    key: "overview",
    label: "Overview",
    icon: <HomeOutlined />,
    path: "/",
  },
  {
    key: "patients",
    label: "Patients",
    icon: <TeamOutlined />,
    path: "/patients",
  },
  {
    key: "recordings",
    label: "Recordings",
    icon: <UnorderedListOutlined />,
    path: "/recordings",
  },
  {
    key: "settings",
    label: "Settings",
    icon: <SettingOutlined />,
    path: "/settings",
  },
];

function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const getUserAvatar = () => {
    if (!user) return null;
    const initial = user.name.charAt(0).toUpperCase();
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white text-sm font-medium">
        {initial}
      </div>
    );
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: user?.email || "Profile",
      onClick: () => navigate("/settings"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <nav className="flex items-center justify-center gap-4 no-drag">
      {navItems.map((item) => (
        <GlassButton
          key={item.key}
          variant={isActive(item.path) ? "primary" : "secondary"}
          size="sm"
          icon={item.icon}
          onClick={() => handleNavClick(item.path)}
          className={`no-drag transition-all duration-300 ${
            isActive(item.path) ? "opacity-100" : "opacity-80 hover:opacity-100"
          }`}
        >
          {item.label}
        </GlassButton>
      ))}
      {user && (
        <Dropdown
          open={userMenuOpen}
          onOpenChange={setUserMenuOpen}
          menu={{ items: userMenuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="no-drag transition-all duration-300 hover:opacity-100"
          >
            {getUserAvatar()}
          </GlassButton>
        </Dropdown>
      )}
    </nav>
  );
}

export default Navbar;
