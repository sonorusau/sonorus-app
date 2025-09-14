import {
  FileAddOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { ReactNode, useEffect, useState } from "react";
import { Flex, Switch } from "antd";
import { useNavigate } from "react-router-dom";

import image from "../assets/sn_primary_logo.png";
import background from "../assets/primary_background_3.png";

function HomePage(): JSX.Element {
  const [useEnterpriseServer, setUseEnterpriseServer] = useState<boolean>(
    globalThis.useEnterpriseServer,
  );

  useEffect(() => {
    globalThis.useEnterpriseServer = useEnterpriseServer;
  }, [useEnterpriseServer]);

  const buttons: {
    text: string;
    path: string;
    icon: ReactNode;
    description: string;
  }[] = [
    {
      text: "Quick Scan",
      path: "/list-team-repos",
      icon: <UnorderedListOutlined />,
      description: "Record a heart sound without saving the results",
    },
    {
      text: "Patient Select",
      path: "/add-files",
      icon: <FileAddOutlined />,
      description: "Record a heart sound and save it to a particular patient",
    },
  ];

  const handleSwitchUseEnterpriseServer = (toggle: boolean): void => {
    setUseEnterpriseServer(toggle);
  };

  const navigate = useNavigate();

  const handlePageBtnClick = (path: string): void => {
    console.log("Navigating to page: " + path);
    navigate(path);
  };

  return (
    <main
      className={`bg-cover bg-center bg-no-repeat min-h-screen`}
      style={{ backgroundImage: `url(${background})` }}
    >
      <Flex
        justify="end"
        gap={10}
        className="stickytop-0 h-12 z-50 pt-3 pb-3 pl-5 pr-5"
      >
        {useEnterpriseServer ? (
          <span>Using GitHub Enterprise Server</span>
        ) : (
          <span>Using GitHub Cloud</span>
        )}
        <Switch
          defaultChecked={useEnterpriseServer}
          size="small"
          onChange={handleSwitchUseEnterpriseServer}
          className="self-center"
        />
      </Flex>
      <div className="h-[100vh] w-[100vw] position-relative flex flex-col justify-evenly items-center">
        <img
          src={image}
          className="bg-[rgba(255,255,255,.2)] p-10 rounded-2xl"
          style={{
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `,
          }}
        />
        <div className="flex gap-8 flex-row lg:flex-row">
          {buttons.map((buttonContent, idx) => (
            <div
              key={idx}
              className="relative group text-slate-100 cursor-pointer rounded-2xl py-20 px-8 max-w-80 transform transition-all duration-100 hover:scale-105"
              style={{
                backdropFilter: "blur(6px)",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `,
              }}
              onClick={() => handlePageBtnClick(buttonContent.path)}
            >
              <div className="relative flex flex-col w-full gap-4">
                <div className="flex flex-row gap-2">
                  {buttonContent.icon}
                  {buttonContent.text}
                </div>
                <p className="relative w-full text-wrap text-left">
                  {buttonContent.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Flex
          className="w-[50%] text-gray-500 text-center"
          gap="middle"
          justify="center"
          align="center"
          vertical
        >
          <span>
            Rheumatic heart disease is a preventable and manageable disease, and
            has been for over 70 years. Yet, globally an estimated 300,000
            people still die each year.
          </span>
        </Flex>
      </div>
    </main>
  );
}

export default HomePage;
