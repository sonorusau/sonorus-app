import React from "react";
import BackButton from "./BackButton";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import "./FeaturePageLayout.css";
import BackgroundLayout from "./BackgroundLayout";
import image from "../assets/sn_primary_logo.png";
import { usePlatform } from "../hooks/usePlatform";

function FeaturePageLayout(): JSX.Element {
  const { isMacOS } = usePlatform();

  return (
    <BackgroundLayout>
      <div className="flex flex-col h-full">
        {/* Header - Minimal design */}
        <header
          className="w-full flex items-center gap-4 py-3 px-6 border-b border-white/10 z-30"
          style={{
            paddingLeft: isMacOS
              ? "calc(1.5rem + var(--macos-traffic-light-offset))"
              : "1.5rem",
          }}
        >
          <div className="no-drag">
            <BackButton />
          </div>
          <img
            src={image}
            alt="Sonorus Logo"
            className="h-6 w-auto object-contain opacity-80"
          />
          <div className="flex-1" />
          <div className="no-drag">
            <Navbar />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex justify-center px-8 pb-16 overflow-auto">
          <div className="w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </BackgroundLayout>
  );
}

export default FeaturePageLayout;
