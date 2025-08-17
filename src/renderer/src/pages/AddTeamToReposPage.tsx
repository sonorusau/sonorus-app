import React, { useEffect, useState } from "react";
import { Button, Flex, Input, Modal, Select, Steps } from "antd";
import Form from "antd/es/form/Form";
import FormItem from "antd/es/form/FormItem";
import { ImportOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Repo } from "@shared/repo/data";
import RepoTable from "@renderer/components/RepoTable";
import ImportReposButton from "@renderer/components/ImportReposButton";
import { useLocation } from "react-router-dom";
import Title from "antd/es/typography/Title";
import { addTeamToRepos } from "@renderer/lib/addTeamToRepos";
import ExportReposButton from "@renderer/components/ExportReposButton";

interface FormData {
  org: string;
  teamSlug: string;
  permission: string;
}

function AddTeamToReposPage(): JSX.Element {
  const location = useLocation();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const hasSelected = selectedRowKeys.length > 0;

  useEffect(() => {
    if (location.state?.repos != null) {
      onLoadedRepos(location.state.repos);
    }
  }, [location]);

  const handleImportTxtBtnClick = async (): Promise<void> => {
    console.log("Clicked import from txt.");
    const repos: Repo[] = await window.api.loadReposFromTxt();
    onLoadedRepos(repos);
  };

  const onLoadedRepos = (repos: Repo[]): void => {
    setSelectedRowKeys([]);
    setRepos(repos);
    setHasData(true);
    setLoading(false);
    setSelectedRowKeys([...Array(repos.length).keys()]);
    setCurrentStep(1);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]): void => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const getSelectedRepos = (): Repo[] => {
    return repos.filter((i) => selectedRowKeys.includes(i.key));
  };

  const handleSubmitForm = async (data: FormData): Promise<void> => {
    console.log(
      `Submit form with org = ${data.org}, teamSlug = ${data.teamSlug}`,
    );
    setCurrentStep(2);
    setLoading(true);
    try {
      await addTeamToRepos(
        data.org,
        data.teamSlug,
        data.permission,
        getSelectedRepos(),
      );
      setLoading(false);
      success();
    } catch (err) {
      console.log("Error.");
    }
  };

  const success = (): void => {
    Modal.success({
      content: "Success",
    });
  };

  return (
    <div className="flex w-full justify-center">
      <div id="section-left" className="w-[600px] pr-10">
        <Flex justify="end" gap={10} className="mb-5">
          <span className="text-sm self-center">
            {hasSelected ? `Selected ${selectedRowKeys.length}` : null}
          </span>
          <ExportReposButton
            repos={getSelectedRepos()}
            disabled={!hasSelected}
          />
          <Button onClick={handleImportTxtBtnClick}>
            Import txt
            <ImportOutlined />
          </Button>
          <ImportReposButton />
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
      <div id="section-right" className="pl-10">
        <Title level={2}>Add Team to Repositories</Title>
        <div id="steps" className="mt-5 mb-10">
          <Steps
            direction="vertical"
            size="small"
            current={currentStep}
            items={[
              {
                title: "Import repositories",
                description: "Use Import to specify target repos",
              },
              {
                title: "Specify team and permission",
                description: "Fill in the required fields",
              },
              {
                title: "Submit",
                description:
                  "Press Submit to modify team access to target repositories",
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
            <FormItem
              label="Permission"
              name="permission"
              rules={[{ required: true }]}
              tooltip={{
                title:
                  "Permission (role) to grant to the team for target repositories",
                icon: <InfoCircleOutlined />,
              }}
            >
              <Select allowClear className="max-w-32">
                <Select.Option value="pull">pull</Select.Option>
                <Select.Option value="push">push</Select.Option>
                <Select.Option value="maintain">maintain</Select.Option>
                <Select.Option value="triage">triage</Select.Option>
                <Select.Option value="admin">admin</Select.Option>
              </Select>
            </FormItem>
            <FormItem>
              <Button type="primary" htmlType="submit" disabled={!hasSelected}>
                Submit
              </Button>
            </FormItem>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default AddTeamToReposPage;
