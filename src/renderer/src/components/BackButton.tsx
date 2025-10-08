import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import GlassButton from "./GlassButton";

function BackButton(): JSX.Element {
  const navigate = useNavigate();
  return (
    <GlassButton
      onClick={() => navigate(-1)}
      variant="secondary"
      size="sm"
      icon={<ArrowLeftOutlined />}
    >
      Back
    </GlassButton>
  );
}

export default BackButton;
