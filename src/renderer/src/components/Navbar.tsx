import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  SettingOutlined
} from "@ant-design/icons";
import GlassButton from "./GlassButton";

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
    path: "/"
  },
  {
    key: "patients",
    label: "Patients",
    icon: <TeamOutlined />,
    path: "/patients"
  },
  {
    key: "recordings",
    label: "Recordings",
    icon: <UnorderedListOutlined />,
    path: "/recordings"
  },
  {
    key: "settings",
    label: "Settings",
    icon: <SettingOutlined />,
    path: "/settings"
  }
];

function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

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
    </nav>
  );
}

export default Navbar;