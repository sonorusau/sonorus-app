import { ReactNode, useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import background from "../assets/primary_background_3.png";

interface BackgroundLayoutProps {
  children: ReactNode;
}

function BackgroundLayout({ children }: BackgroundLayoutProps): JSX.Element {
  const { isDarkMode } = useTheme();
  const [isMacOS, setIsMacOS] = useState(false);

  useEffect(() => {
    // Detect if running on macOS for traffic light positioning
    const checkPlatform = async () => {
      try {
        // In Electron renderer, we can check user agent or use IPC
        const platform = navigator.userAgent.toLowerCase();
        setIsMacOS(platform.includes('mac'));
      } catch (error) {
        // Fallback detection
        setIsMacOS(navigator.platform.toLowerCase().includes('mac'));
      }
    };
    
    checkPlatform();
  }, []);

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

      {/* macOS Draggable header region */}
      {isMacOS && (
        <div className="macos-drag-header" />
      )}

      {/* Content container with platform-specific spacing */}
      <div 
        className={`relative z-20 w-full h-full overflow-hidden ${
          isMacOS ? 'pt-4' : ''
        }`} 
        style={{ margin: 0, padding: 0 }}
      >
        {children}
      </div>
    </>
  );
}

export default BackgroundLayout;
