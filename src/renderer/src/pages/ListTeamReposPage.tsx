import React, { useState } from "react";
import { Button, Flex, Input, Steps } from "antd";
import Form from "antd/es/form/Form";
import FormItem from "antd/es/form/FormItem";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Repo } from "@shared/repo/data";
import { listTeamRepos } from "@renderer/lib/listTeamRepos";
import ItemActionsButton from "@renderer/components/RepoActionsButton";
import RepoTable from "@renderer/components/RepoTable";
import Title from "antd/es/typography/Title";
import ExportReposButton from "@renderer/components/ExportReposButton";

interface FormData {
  org: string;
  teamSlug: string;
}

function ListTeamReposPage(): JSX.Element {
  const [repos, setRepos] = useState<Repo[]>([]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const hasSelected = selectedRowKeys.length > 0;

  const getSelectedRepos = (): Repo[] => {
    return repos.filter((i) => selectedRowKeys.includes(i.key));
  };

  const handleSubmitForm = async (data: FormData): Promise<void> => {
    console.log(
      `Submit form with org = ${data.org}, teamSlug = ${data.teamSlug}`,
    );
    setCurrentStep(1);
    setLoading(true);
    try {
      const items: Repo[] = await listTeamRepos(data.org, data.teamSlug);
      console.log("Loaded items.");
      onLoadedItems(items);
    } catch (err) {
      console.log("Error loading items.");
    }
  };

  const onLoadedItems = (items: Repo[]): void => {
    setSelectedRowKeys([]);
    setRepos(items);
    setHasData(true);
    setLoading(false);
    setSelectedRowKeys([...Array(items.length).keys()]);
    setCurrentStep(2);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]): void => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  return (
    <div className="flex justify-center w-full">
      <div id="section-left" className="pr-10">
        <Title level={2}>List Team Repositories</Title>
        <div id="steps" className="mt-5 mb-10">
          <Steps
            direction="vertical"
            size="small"
            current={currentStep}
            items={[
              {
                title: "Search for repositories",
                description: "Fill in the required fields and press Search",
              },
              {
                title: "Wait for repositories to load",
                description:
                  "Repositories found will be displayed on the right",
              },
              {
                title: "Review repositories",
                description:
                  "Press Actions to perform further actions on selected repositories",
              },
            ]}
          />
        </div>
        <div id="form">
          <Form
            name="parameters"
            layout="vertical"
            colon={false}
            onFinish={handleSubmitForm}
            disabled={loading}
          >
            <FormItem<FormData>
              label="Organization"
              name="org"
              rules={[{ required: true }]}
              tooltip={{
                title:
                  "Name of the organization the team belongs to (no spaces, case-insensitive)",
                icon: <InfoCircleOutlined />,
              }}
            >
              <Input className="max-w-60" />
            </FormItem>
            <FormItem<FormData>
              label="Team"
              name="teamSlug"
              rules={[{ required: true }]}
              tooltip={{
                title: "Team slug in the format: my-team-slug",
                icon: <InfoCircleOutlined />,
              }}
            >
              <Input className="max-w-60" />
            </FormItem>
            <FormItem>
              <Button type="primary" htmlType="submit">
                Search
              </Button>
            </FormItem>
          </Form>
        </div>
      </div>
      <div id="section-right" className="w-[600px] pl-10">
        <Flex justify="end" gap={10} className="mb-5">
          <span className="text-sm self-center">
            {hasSelected ? `Selected ${selectedRowKeys.length}` : null}
          </span>
          <ExportReposButton
            repos={getSelectedRepos()}
            disabled={!hasSelected}
          />
          <ItemActionsButton
            repos={getSelectedRepos()}
            disabled={!hasSelected}
          />
        </Flex>
        <RepoTable
          repos={repos}
          hasData={hasData}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
          loading={loading}
        />
        <div></div>
      </div>
    </div>
  );
}

export default ListTeamReposPage;
