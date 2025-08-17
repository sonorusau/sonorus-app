import { DownOutlined } from "@ant-design/icons";
import { Repo } from "@shared/repo/data";
import { Button, Dropdown, MenuProps } from "antd";
import { ItemType, MenuItemType } from "antd/es/menu/interface";
import { useNavigate } from "react-router-dom";

export interface Props {
  repos: Repo[];
  disabled: boolean;
}

interface ActionMenuItemType extends MenuItemType {
  path: string;
}

function ItemActionsButton(props: Props): JSX.Element {
  const navigate = useNavigate();

  const menuItems: ItemType<ActionMenuItemType>[] = [
    {
      key: "0",
      label: "Add Files to Repos",
      path: "",
    },
    {
      key: "1",
      label: "Add Team to Repos",
      path: "/add-team-to-repos",
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    console.log("click", e);
    navigate(menuItems[e.key].path, { state: { repos: props.repos } });
  };

  const menuProps = {
    items: menuItems,
    onClick: handleMenuClick,
  };

  return (
    <Dropdown menu={menuProps} trigger={["click"]} disabled={props.disabled}>
      <Button type="primary">
        Actions
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}

export default ItemActionsButton;
