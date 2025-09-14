import {
  FileAddOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import BackgroundLayout from "../components/BackgroundLayout";

import image from "../assets/sn_primary_logo.png";

function HomePage(): JSX.Element {
  const { isDarkMode } = useTheme();
  const buttons: {
    text: string;
    path: string;
    icon: ReactNode;
    description: string;
  }[] = [
    {
      text: "Quick Scan",
      path: "/quick-scan",
      icon: <UnorderedListOutlined />,
      description: "Record a heart sound without saving the results",
    },
    {
      text: "Patient Records",
      path: "/patients",
      icon: <FileAddOutlined />,
      description: "View and manage patient records and recordings",
    },
  ];

  const navigate = useNavigate();

  const handlePageBtnClick = (path: string): void => {
    console.log("Navigating to page: " + path);
    navigate(path);
  };

  return (
    <BackgroundLayout>
      <div className="flex flex-col items-center justify-center h-full px-8 pb-16">
        {/* Logo section */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-8">
            <div
              className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border"
              style={{
                borderColor: "#ACACE6",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 255, 255, 0.05) inset",
              }}
            >
              <img
                src={image}
                alt="Sonorus Logo"
                className="h-16 w-auto mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Action cards - Responsive sizing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mb-16">
          {buttons.map((buttonContent, idx) => (
            <div
              key={idx}
              className="group relative bg-white/3 backdrop-blur-md rounded-2xl p-6 border cursor-pointer"
              onClick={() => handlePageBtnClick(buttonContent.path)}
              style={{
                borderColor: "#8C7DD1",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 255, 255, 0.05) inset",
              }}
            >
              <div className="flex flex-col items-center text-center">
                {/* Icon container with brand colors */}
                <div className="flex items-center justify-center w-14 h-14 rounded-xl mb-4 transition-all duration-300">
                  <span
                    className="text-2xl transition-colors duration-300"
                    style={{
                      color: "#ACACE6",
                    }}
                  >
                    {buttonContent.icon}
                  </span>
                </div>

                <h3 className={`text-lg font-semibold mb-3 tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {buttonContent.text}
                </h3>
                <p className={`leading-relaxed font-light text-sm ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>
                  {buttonContent.description}
                </p>
              </div>

              {/* Trust indicator */}
              <div className="absolute top-4 right-4">
                <div
                  className="w-2 h-2 rounded-full opacity-70"
                  style={{ backgroundColor: "#8C7DD1" }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer message */}
        <div className="max-w-2xl mx-auto">
          <div
            className="bg-white/2 backdrop-blur-md rounded-xl p-6 border"
            style={{
              borderColor: "#ACACE6",
              boxShadow:
                "0 4px 16px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 255, 255, 0.03) inset",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#8C7DD1" }}
              ></div>
              <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                Trusted Healthcare Technology
              </span>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#8C7DD1" }}
              ></div>
            </div>
            <p className={`text-center leading-relaxed text-sm font-light ${isDarkMode ? 'text-white/90' : 'text-slate-600'}`}>
              Rheumatic heart disease is a preventable and manageable condition
              that has been treatable for over 70 years. Our FDA-compliant
              analysis platform helps healthcare providers deliver precise
              diagnostics and better patient outcomes.
            </p>
          </div>
        </div>
      </div>
    </BackgroundLayout>
  );
}

export default HomePage;
