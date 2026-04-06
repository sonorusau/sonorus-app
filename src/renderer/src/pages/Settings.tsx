import React, { useState, useEffect } from "react";
import { Switch, Select, Slider, Input, Divider, notification } from "antd";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  SettingOutlined,
  WifiOutlined,
  SoundOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  ExportOutlined,
  UserOutlined,
  HeartOutlined,
  SaveOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import Title from "antd/es/typography/Title";

const { Option } = Select;
const { TextArea } = Input;

interface SettingsData {
  // Device Settings
  autoConnect: boolean;
  deviceTimeout: number;
  audioFeedback: boolean;
  volumeLevel: number;

  // Recording Settings
  defaultRecordingLength: number;
  autoSaveRecordings: boolean;
  compressionLevel: string;

  // Analysis Settings
  analysisMode: string;
  confidenceThreshold: number;
  enableRealTimeAnalysis: boolean;

  // Data & Privacy
  dataRetention: number;
  exportFormat: string;
  anonymizeData: boolean;

  // Notifications
  enableNotifications: boolean;
  flaggedResultsAlert: boolean;
  deviceDisconnectAlert: boolean;

  // Advanced
  debugMode: boolean;
  logLevel: string;
  customApiEndpoint: string;
  notes: string;
}

function Settings(): JSX.Element {
  const { themeMode, isDarkMode, setThemeMode } = useTheme();
  const { user, logout, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SettingsData>({
    // Device Settings
    autoConnect: true,
    deviceTimeout: 30,
    audioFeedback: true,
    volumeLevel: 75,

    // Recording Settings
    defaultRecordingLength: 30,
    autoSaveRecordings: true,
    compressionLevel: "medium",

    // Analysis Settings
    analysisMode: "standard",
    confidenceThreshold: 85,
    enableRealTimeAnalysis: false,

    // Data & Privacy
    dataRetention: 365,
    exportFormat: "json",
    anonymizeData: true,

    // Notifications
    enableNotifications: true,
    flaggedResultsAlert: true,
    deviceDisconnectAlert: true,

    // Advanced
    debugMode: false,
    logLevel: "info",
    customApiEndpoint: "",
    notes: "",
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem("sonorus-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem("sonorus-settings", JSON.stringify(settings));
    setHasChanges(false);
    notification.success({
      message: "Settings Saved",
      description: "Your settings have been saved successfully.",
      placement: "topRight",
    });
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      autoConnect: true,
      deviceTimeout: 30,
      audioFeedback: true,
      volumeLevel: 75,
      defaultRecordingLength: 30,
      autoSaveRecordings: true,
      compressionLevel: "medium",
      analysisMode: "standard",
      confidenceThreshold: 85,
      enableRealTimeAnalysis: false,
      dataRetention: 365,
      exportFormat: "json",
      anonymizeData: true,
      enableNotifications: true,
      flaggedResultsAlert: true,
      deviceDisconnectAlert: true,
      debugMode: false,
      logLevel: "info",
      customApiEndpoint: "",
      notes: "",
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <div className="settings-container max-w-5xl mx-auto">
      <div className="mb-6">
        <Title level={2} style={{ color: "white", margin: 0 }}>
          Settings
        </Title>
        <p className="text-white/70 text-lg mt-2">
          Configure your Sonorus application preferences and device settings
        </p>
      </div>

      {/* User Profile Section */}
      {user && (
        <GlassCard padding="lg" className="mb-6">
          <div className="flex items-center gap-2 mb-6">
            <UserOutlined className="text-white text-xl" />
            <h3 className="text-xl font-semibold text-white">User Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white font-medium mb-2 block">Name</label>
              <Input
                value={user.name}
                disabled
                className="search-input"
                size="large"
                prefix={<UserOutlined />}
              />
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">Email</label>
              <Input
                value={user.email}
                disabled
                className="search-input"
                size="large"
                prefix={<UserOutlined />}
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <GlassButton
              variant="danger"
              icon={<LogoutOutlined />}
              onClick={logout}
              disabled={authLoading}
              className="w-full md:w-auto"
            >
              {authLoading ? "Logging out..." : "Logout"}
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {hasChanges && (
        <GlassCard
          padding="md"
          className="mb-6 border-l-4"
          style={{ borderLeftColor: "#f59e0b" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingOutlined className="text-yellow-500" />
              <span className="text-white">You have unsaved changes</span>
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  loadSettings();
                  setHasChanges(false);
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                icon={<SaveOutlined />}
                onClick={saveSettings}
              >
                Save Changes
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="space-y-6">
        {/* Appearance Settings */}
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-6">
            <SettingOutlined className="text-white text-xl" />
            <h3 className="text-xl font-semibold text-white">Appearance</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-white font-medium mb-2 block">Theme</label>
              <Select
                value={themeMode}
                onChange={(value) =>
                  setThemeMode(value as "dark" | "light" | "system")
                }
                className="w-full search-input"
                size="large"
              >
                <Option value="system">System</Option>
                <Option value="dark">Dark</Option>
                <Option value="light">Light</Option>
              </Select>
              <p className="text-white/60 text-sm mt-1">
                Currently using {isDarkMode ? "dark" : "light"} theme
                {themeMode === "system" && " (from system preference)"}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Device Settings */}
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-6">
            <WifiOutlined className="text-white text-xl" />
            <h3 className="text-xl font-semibold text-white">
              Device Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white font-medium mb-2 block">
                Auto-connect to last device
              </label>
              <Switch
                checked={settings.autoConnect}
                onChange={(checked) =>
                  handleSettingChange("autoConnect", checked)
                }
              />
              <p className="text-white/60 text-sm mt-1">
                Automatically connect to the last used stethoscope
              </p>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Connection Timeout (seconds)
              </label>
              <Select
                value={settings.deviceTimeout}
                onChange={(value) =>
                  handleSettingChange("deviceTimeout", value)
                }
                className="w-full"
              >
                <Option value={15}>15 seconds</Option>
                <Option value={30}>30 seconds</Option>
                <Option value={60}>60 seconds</Option>
                <Option value={120}>2 minutes</Option>
              </Select>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Audio Feedback
              </label>
              <Switch
                checked={settings.audioFeedback}
                onChange={(checked) =>
                  handleSettingChange("audioFeedback", checked)
                }
              />
              <p className="text-white/60 text-sm mt-1">
                Enable sound notifications for device events
              </p>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Volume Level: {settings.volumeLevel}%
              </label>
              <Slider
                value={settings.volumeLevel}
                onChange={(value) => handleSettingChange("volumeLevel", value)}
                disabled={!settings.audioFeedback}
              />
            </div>
          </div>
        </GlassCard>

        {/* Recording Settings */}
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-6">
            <HeartOutlined className="text-white text-xl" />
            <h3 className="text-xl font-semibold text-white">
              Recording Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white font-medium mb-2 block">
                Default Recording Length (seconds)
              </label>
              <Select
                value={settings.defaultRecordingLength}
                onChange={(value) =>
                  handleSettingChange("defaultRecordingLength", value)
                }
                className="w-full"
              >
                <Option value={15}>15 seconds</Option>
                <Option value={30}>30 seconds</Option>
                <Option value={45}>45 seconds</Option>
                <Option value={60}>60 seconds</Option>
              </Select>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Compression Level
              </label>
              <Select
                value={settings.compressionLevel}
                onChange={(value) =>
                  handleSettingChange("compressionLevel", value)
                }
                className="w-full"
              >
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
              </Select>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Auto-save Recordings
              </label>
              <Switch
                checked={settings.autoSaveRecordings}
                onChange={(checked) =>
                  handleSettingChange("autoSaveRecordings", checked)
                }
              />
              <p className="text-white/60 text-sm mt-1">
                Automatically save recordings after completion
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Analysis Settings */}
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-6">
            <SecurityScanOutlined className="text-white text-xl" />
            <h3 className="text-xl font-semibold text-white">
              Analysis Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white font-medium mb-2 block">
                Analysis Mode
              </label>
              <Select
                value={settings.analysisMode}
                onChange={(value) => handleSettingChange("analysisMode", value)}
                className="w-full"
              >
                <Option value="quick">Quick Analysis</Option>
                <Option value="standard">Standard Analysis</Option>
                <Option value="detailed">Detailed Analysis</Option>
              </Select>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Confidence Threshold: {settings.confidenceThreshold}%
              </label>
              <Slider
                value={settings.confidenceThreshold}
                onChange={(value) =>
                  handleSettingChange("confidenceThreshold", value)
                }
                min={50}
                max={95}
              />
              <p className="text-white/60 text-sm mt-1">
                Minimum confidence level for analysis results
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-white font-medium mb-2 block">
                Real-time Analysis
              </label>
              <Switch
                checked={settings.enableRealTimeAnalysis}
                onChange={(checked) =>
                  handleSettingChange("enableRealTimeAnalysis", checked)
                }
              />
              <p className="text-white/60 text-sm mt-1">
                Process heart sounds during recording (requires more processing
                power)
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Data & Privacy */}
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-6">
            <DatabaseOutlined className="text-white text-xl" />
            <h3 className="text-xl font-semibold text-white">Data & Privacy</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white font-medium mb-2 block">
                Data Retention (days)
              </label>
              <Select
                value={settings.dataRetention}
                onChange={(value) =>
                  handleSettingChange("dataRetention", value)
                }
                className="w-full"
              >
                <Option value={90}>90 days</Option>
                <Option value={180}>180 days</Option>
                <Option value={365}>1 year</Option>
                <Option value={730}>2 years</Option>
                <Option value={-1}>Never delete</Option>
              </Select>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Export Format
              </label>
              <Select
                value={settings.exportFormat}
                onChange={(value) => handleSettingChange("exportFormat", value)}
                className="w-full"
              >
                <Option value="json">JSON</Option>
                <Option value="csv">CSV</Option>
                <Option value="xml">XML</Option>
                <Option value="pdf">PDF Report</Option>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-white font-medium mb-2 block">
                Anonymize Patient Data in Exports
              </label>
              <Switch
                checked={settings.anonymizeData}
                onChange={(checked) =>
                  handleSettingChange("anonymizeData", checked)
                }
              />
              <p className="text-white/60 text-sm mt-1">
                Remove personally identifiable information from exported data
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-6">
            <SoundOutlined className="text-white text-xl" />
            <h3 className="text-xl font-semibold text-white">Notifications</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-white font-medium mb-2 block">
                Enable Notifications
              </label>
              <Switch
                checked={settings.enableNotifications}
                onChange={(checked) =>
                  handleSettingChange("enableNotifications", checked)
                }
              />
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Alert for Flagged Results
              </label>
              <Switch
                checked={settings.flaggedResultsAlert}
                onChange={(checked) =>
                  handleSettingChange("flaggedResultsAlert", checked)
                }
                disabled={!settings.enableNotifications}
              />
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Device Disconnect Alerts
              </label>
              <Switch
                checked={settings.deviceDisconnectAlert}
                onChange={(checked) =>
                  handleSettingChange("deviceDisconnectAlert", checked)
                }
                disabled={!settings.enableNotifications}
              />
            </div>
          </div>
        </GlassCard>

        {/* Advanced Settings */}
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-6">
            <SettingOutlined className="text-white text-xl" />
            <h3 className="text-xl font-semibold text-white">
              Advanced Settings
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white font-medium mb-2 block">
                  Debug Mode
                </label>
                <Switch
                  checked={settings.debugMode}
                  onChange={(checked) =>
                    handleSettingChange("debugMode", checked)
                  }
                />
                <p className="text-white/60 text-sm mt-1">
                  Enable detailed logging for troubleshooting
                </p>
              </div>

              <div>
                <label className="text-white font-medium mb-2 block">
                  Log Level
                </label>
                <Select
                  value={settings.logLevel}
                  onChange={(value) => handleSettingChange("logLevel", value)}
                  className="w-full"
                  disabled={!settings.debugMode}
                >
                  <Option value="error">Error</Option>
                  <Option value="warn">Warning</Option>
                  <Option value="info">Info</Option>
                  <Option value="debug">Debug</Option>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">
                Custom API Endpoint
              </label>
              <Input
                placeholder="https://api.sonorus.com/v1"
                value={settings.customApiEndpoint}
                onChange={(e) =>
                  handleSettingChange("customApiEndpoint", e.target.value)
                }
                className="search-input"
              />
              <p className="text-white/60 text-sm mt-1">
                Override default API endpoint (advanced users only)
              </p>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">Notes</label>
              <TextArea
                placeholder="Add any additional configuration notes..."
                value={settings.notes}
                onChange={(e) => handleSettingChange("notes", e.target.value)}
                rows={3}
                className="search-input"
              />
            </div>
          </div>
        </GlassCard>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-16">
          <GlassButton variant="secondary" onClick={resetToDefaults}>
            Reset to Defaults
          </GlassButton>

          <div className="flex gap-3">
            <GlassButton variant="secondary" icon={<ExportOutlined />}>
              Export Settings
            </GlassButton>
            <GlassButton
              variant="primary"
              icon={<SaveOutlined />}
              onClick={saveSettings}
              disabled={!hasChanges}
            >
              Save All Changes
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
