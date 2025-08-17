import { Table, TableColumnsType, TableProps } from "antd";
import { Repo } from "@shared/repo/data";
import React from "react";

export interface Props {
  repos: Repo[];
  hasData: boolean;
  selectedRowKeys: React.Key[];
  onSelectChange: (newSelectedRowKeys: React.Key[]) => void;
  loading: boolean;
}

export default function RepoTable(props: Props): JSX.Element {
  const columns: TableColumnsType<Repo> = [
    {
      title: "Owner",
      dataIndex: "owner",
      showSorterTooltip: { target: "full-header" },
      sorter: (a, b) => a.owner.localeCompare(b.owner),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Name",
      dataIndex: "name",
      showSorterTooltip: { target: "full-header" },
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"],
    },
  ];

  const rowSelection: TableProps<Repo>["rowSelection"] = {
    selectedRowKeys: props.selectedRowKeys,
    onChange: props.onSelectChange,
    selections: [Table.SELECTION_ALL, Table.SELECTION_NONE],
  };

  return (
    <Table
      rowSelection={rowSelection}
      columns={columns}
      dataSource={props.hasData ? props.repos : []}
      loading={props.loading}
      size={"middle"}
    />
  );
}
