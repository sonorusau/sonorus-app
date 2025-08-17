import BackButton from "./BackButton";
import { Outlet } from "react-router-dom";
import "./FeaturePageLayout.css";
import { SettingOutlined, GithubOutlined } from "@ant-design/icons";
import { useState } from "react";
import classNames from "classnames";

function FeaturePageLayout(): JSX.Element {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={classNames(
      { "dark-mode": darkMode },
      { "light-mode": !darkMode },
      "dark:bg-[var(--color-background-dark)] h-screen w-screen overflow-auto"
    )}>
      <div
        id="header" className="dark:bg-[--color-background-dark2] border-solid border-b-[1px] dark:border-b-[var(--color-background-dark5)] sticky flex items-center top-0 h-12 z-50 py-7 pl-5 pr-5 bg-white"
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
      <main id="main" className={
        classNames("flex justify-center pt-1 pb-5 pl-16 pr-16", { "dark-mode": darkMode })
      }>
        <div className="flex w-full max-w-screen-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default FeaturePageLayout;
