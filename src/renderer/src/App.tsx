import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AddFiles from "./pages/AddFiles";
import QuickScanPage from "./pages/QuickScanPage";
import PairDevice from "./pages/PairDevice";
import RecordingsList from "./pages/RecordingsList";
import Settings from "./pages/Settings";
import FeaturePageLayout from "./components/FeaturePageLayout";

import React, { useMemo } from "react";
import Context from "./store/context";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./styles/theme.css";
import {
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
} from "@ant-design/icons";

function App(): JSX.Element {
  const contextValue = useMemo(() => ({ name: "Ant Design" }), []);

  return (
    <ThemeProvider>
      <Context.Provider value={contextValue}>
        <HashRouter>
          <div id="container" className="h-screen w-screen flex">
            <Routes>
              <Route index element={<HomePage />} />
              <Route element={<FeaturePageLayout />}>
                <Route path="/patients" element={<AddFiles />} />
                <Route path="/add-files" element={<AddFiles />} />
                <Route path="/list-team-repos" element={<QuickScanPage />} />
                <Route path="/quick-scan" element={<QuickScanPage />} />
                <Route path="/pair-device" element={<PairDevice />} />
                <Route path="/recordings" element={<RecordingsList />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </div>
        </HashRouter>
      </Context.Provider>
    </ThemeProvider>
  );
}

export default App;
