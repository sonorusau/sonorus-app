import { ReactNode } from "react";
import { useTheme } from "../contexts/ThemeContext";
import background from "../assets/primary_background_3.png";
import { usePlatform } from "../hooks/usePlatform";

interface BackgroundLayoutProps {
  children: ReactNode;
}

function BackgroundLayout({ children }: BackgroundLayoutProps): JSX.Element {
  const { isDarkMode } = useTheme();
  const { isMacOS } = usePlatform();

  return (
    <>
      {/* Full screen background - ensure complete coverage */}
      <div
        className="fixed inset-0 w-screen h-screen z-0"
        style={{
          backgroundImage: isDarkMode ? `url(${background})` : 'none',
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          margin: 0,
          padding: 0,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Glassmorphism overlay with brand colors */}
      <div
        className={`fixed inset-0 w-full h-full z-10 ${
          isDarkMode
            ? 'bg-gradient-to-br from-white/3 via-purple-300/4 to-indigo-200/3'
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
