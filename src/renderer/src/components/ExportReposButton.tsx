import { ExportOutlined } from "@ant-design/icons";
import { Repo } from "@shared/repo/data";
import { Button } from "antd";

export interface Props {
  repos: Repo[];
  disabled: boolean;
}

const exportTxt = async(repos): Promise<void> => {
    
  try {
    await window.api.exportRepostoTxt(repos);
  } catch (error) {
    console.error("Error opening dialog:", error);
  }
};

export default function ExportReposButton(props: Props): JSX.Element {
  return (
    <Button onClick={() => exportTxt(props.repos)}>
      Export Selected
      <ExportOutlined />
    </Button>
  );
}
