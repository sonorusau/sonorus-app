import BackButton from "./BackButton";
import { Outlet } from "react-router-dom";
import "./FeaturePageLayout.css";
import { SettingOutlined, GithubOutlined } from "@ant-design/icons";
import { useState } from "react";
import classNames from "classnames";
import background from "../assets/primary_background.png";

function FeaturePageLayout(): JSX.Element {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div
      style={{ backgroundImage: `url(${background})` }}
      className={classNames(
        { "dark-mode": darkMode },
        { "light-mode": !darkMode },
        "h-screen w-screen overflow-auto bg-cover bg-center bg-no-repeat min-h-screen",
      )}
    >
      <div
        id="header"
        className="border-solid border-b-[1px] w-[80%] left-[10%] rounded-3xl sticky flex items-center top-4 h-12 z-50 py-8 px-8 bg-[rgba(255,255,255,.2)]"
        style={{
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
        }}
      >
        <BackButton />
        <div className="ml-auto flex gap-4">
          <div className="flex gap-1 items-center">
            <GithubOutlined />
            {globalThis.useEnterpriseServer ? (
              <span>Using GitHub Enterprise Server</span>
            ) : (
              <span>Using GitHub Cloud</span>
            )}
          </div>
          <div className="flex gap-1 items-center">
            <SettingOutlined />
            {globalThis.useConfig ? (
              <span>Using Config</span>
            ) : (
              <span>Using Environment Variable</span>
            )}
          </div>
        </div>
      </div>
      <main
        id="main"
        className={classNames("flex justify-center pt-1 pb-5 pl-16 pr-16", {
          "dark-mode": darkMode,
        })}
      >
        <div className="flex w-full max-w-screen-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default FeaturePageLayout;
