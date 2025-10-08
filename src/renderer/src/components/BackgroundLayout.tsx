import { ReactNode } from "react";
import { useTheme } from "../contexts/ThemeContext";
import background from "../assets/primary_background_3.png";

interface BackgroundLayoutProps {
  children: ReactNode;
}

function BackgroundLayout({ children }: BackgroundLayoutProps): JSX.Element {
  const { isDarkMode } = useTheme();

  return (
    <>
      {/* Full screen background - ensure complete coverage */}
      <div
        className="fixed inset-0 w-full h-full z-0"
        style={{
          backgroundImage: isDarkMode ? `url(${background})` : 'none',
          backgroundColor: isDarkMode ? 'transparent' : '#ffffff',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          margin: 0,
          padding: 0,
        }}
      />

      {/* Glassmorphism overlay with brand colors */}
      <div 
        className={`fixed inset-0 w-full h-full z-10 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-white/8 via-purple-300/10 to-indigo-200/8' 
            : 'bg-transparent'
        }`}
        style={{ margin: 0, padding: 0 }}
      />

      {/* Content container */}
      <div className="relative z-20 w-full h-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
        {children}
      </div>
    </>
  );
}

export default BackgroundLayout;
