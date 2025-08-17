import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown, MenuProps } from "antd";

const menuItems: MenuProps["items"] = [
  {
    key: "1",
    label: "From List Team Items",
  },
];

function ImportReposButton(): JSX.Element {
  const handleMenuClick: MenuProps["onClick"] = (e) => {
    console.log("click", e);
  };

  const menuProps = {
    items: menuItems,
    onClick: handleMenuClick,
  };

  return (
    <Dropdown menu={menuProps} trigger={["click"]}>
      <Button type="primary">
        Import
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}

export default ImportReposButton;
