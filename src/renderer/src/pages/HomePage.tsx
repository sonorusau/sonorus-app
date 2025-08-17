import {
  FileAddOutlined,
  SettingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { ReactNode, useEffect, useState } from "react";
import { Button, Flex, Switch } from "antd";
import { useNavigate } from "react-router-dom";

function HomePage(): JSX.Element {
  const [useEnterpriseServer, setUseEnterpriseServer] = useState<boolean>(
    globalThis.useEnterpriseServer,
  );

  useEffect(() => {
    globalThis.useEnterpriseServer = useEnterpriseServer;
  }, [useEnterpriseServer]);


  const buttons: { text: string; path: string; icon: ReactNode }[] = [
    {
      text: "List Team Repositories",
      path: "/list-team-repos",
      icon: <UnorderedListOutlined />,
    },
    {
      text: "Add Files",
      path: "/add-files",
      icon: <FileAddOutlined />,
    },
    {
      text: "Add Team to Repositories",
      path: "/add-team-to-repos",
      icon: <TeamOutlined />,
    },
    {
      text: "Setting",
      path: "/blank-page",
      icon: <SettingOutlined />,
    },
  ];

  const handleSwitchUseEnterpriseServer = (toggle: boolean): void => {
    setUseEnterpriseServer(toggle);
  };

  const heading = "GH Util" as const;
  const navigate = useNavigate();

  const handlePageBtnClick = (path: string): void => {
    console.log("Navigating to page: " + path);
    navigate(path);
  };

  return (
    <main className="dark:bg-[var(--color-background-dark)]">
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
        <h1 className="text-5xl text-[var(--ev-c-text-6)] font-extrabold">
          {heading}
        </h1>
        <div className="flex gap-2 flex-col lg:flex-row">
          {buttons.map((buttonContent, idx) => (
            <Button
              key={idx}
              className="bg-[var(--color-button)] rounded-2xl p-5"
              type="primary"
              onClick={() => handlePageBtnClick(buttonContent.path)}
            >
              {buttonContent.icon}
              {buttonContent.text}
            </Button>
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
            GUI tool for processing GitHub repositories in batch.
          </span>
          <span>
            For contribution and adding features to this app -{" "}
            <a href="" target="_blank">
              repository
            </a>
          </span>
        </Flex>
      </div>
    </main>
  );
}

export default HomePage;
