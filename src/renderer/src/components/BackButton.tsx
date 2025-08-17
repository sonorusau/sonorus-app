import { Button } from "antd";
import { useNavigate } from "react-router-dom";

function BackButton(): JSX.Element {
  const navigate = useNavigate();
  return <Button onClick={() => navigate(-1)}>Back</Button>;
}

export default BackButton;
