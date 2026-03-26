import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PatientList from "./pages/PatientList";
import QuickScanPage from "./pages/QuickScanPage";
import PairDevice from "./pages/PairDevice";
import RecordingsList from "./pages/RecordingsList";
import Settings from "./pages/Settings";
import FeaturePageLayout from "./components/FeaturePageLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import React, { useMemo } from "react";
import Context from "./store/context";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MenuActionsProvider } from "./components/MenuActionsProvider";
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
      <AuthProvider>
        <Context.Provider value={contextValue}>
          <HashRouter>
            <MenuActionsProvider>
              <div id="container" className="h-screen w-screen flex">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route
                    index
                    element={
                      <ProtectedRoute>
                        <HomePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route element={<FeaturePageLayout />}>
                    <Route
                      path="/patients"
                      element={
                        <ProtectedRoute>
                          <PatientList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/add-files"
                      element={
                        <ProtectedRoute>
                          <PatientList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/quick-scan"
                      element={
                        <ProtectedRoute>
                          <QuickScanPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pair-device"
                      element={
                        <ProtectedRoute>
                          <PairDevice />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/recordings"
                      element={
                        <ProtectedRoute>
                          <RecordingsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                  </Route>
                </Routes>
              </div>
            </MenuActionsProvider>
          </HashRouter>
        </Context.Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
