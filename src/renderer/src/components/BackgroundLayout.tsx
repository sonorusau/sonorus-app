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
      {/* Full screen background */}
      <div
        className="fixed top-0 left-0 w-screen h-screen z-0"
        style={{
          backgroundImage: isDarkMode ? `url(${background})` : 'none',
          backgroundColor: isDarkMode ? 'transparent' : '#ffffff',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Glassmorphism overlay with brand colors */}
      <div 
        className={`fixed top-0 left-0 w-screen h-screen z-10 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-white/8 via-purple-300/10 to-indigo-200/8' 
            : 'bg-transparent'
        }`} 
      />

      {/* Content container */}
      <div className="relative z-20 w-screen h-screen overflow-hidden">
        {children}
      </div>
    </>
  );
}

export default BackgroundLayout;
