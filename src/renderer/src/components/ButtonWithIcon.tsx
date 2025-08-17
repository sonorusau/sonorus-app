import classNames from "classnames";
import { Button } from 'antd';
import React from "react";

interface IButtonWithIcon {
  onClick?: () => void,
  className?: string,
  icon: React.ReactNode,
}

const ButtonWithIcon: React.FC<IButtonWithIcon> = ({ className, onClick, icon }) => {
  return (
    <div
      onClick={() => onClick()}
      className={
        classNames(
          className,
          "cursor-pointer flex justify-center items-center rounded-md border-[1px] border-solid border-gray w-7 h-7"
        )
      }>
      {icon}
    </div>
  )
}

export default ButtonWithIcon;
