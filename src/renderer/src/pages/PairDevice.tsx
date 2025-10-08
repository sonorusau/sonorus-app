import React, { useState, useEffect } from "react";
import { Progress, Alert } from "antd";
import {
  WifiOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  HeartOutlined
} from "@ant-design/icons";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import Title from "antd/es/typography/Title";

interface Device {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "connecting";
  batteryLevel: number;
  signalStrength: number;
}

function PairDevice(): JSX.Element {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [connectionProgress, setConnectionProgress] = useState(0);

  const mockDevices: Device[] = [
    {
      id: "steth-001",
      name: "Sonorus Stethoscope SN-001",
      status: "disconnected",
      batteryLevel: 85,
      signalStrength: 95
    },
    {
      id: "steth-002",
      name: "Sonorus Stethoscope SN-002",
      status: "disconnected",
      batteryLevel: 42,
      signalStrength: 78
    }
  ];

  useEffect(() => {
    const savedDevice = localStorage.getItem("connectedDevice");
    if (savedDevice) {
      const device = JSON.parse(savedDevice);
      setConnectedDevice(device);
    }
  }, []);

  const startScanning = async () => {
    setIsScanning(true);
    setDevices([]);

    setTimeout(() => {
      setDevices(mockDevices);
      setIsScanning(false);
    }, 2000);
  };

  const connectToDevice = async (device: Device) => {
    setConnectionProgress(0);
    const updatedDevice = { ...device, status: "connecting" as const };

    setDevices(prev => prev.map(d =>
      d.id === device.id ? updatedDevice : d
    ));

    const interval = setInterval(() => {
      setConnectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const connectedDev = { ...device, status: "connected" as const };
          setConnectedDevice(connectedDev);
          localStorage.setItem("connectedDevice", JSON.stringify(connectedDev));
          setDevices(prev => prev.map(d =>
            d.id === device.id ? connectedDev : d
          ));
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const disconnectDevice = () => {
    setConnectedDevice(null);
    localStorage.removeItem("connectedDevice");
    setDevices(prev => prev.map(d =>
      d.status === "connected" ? { ...d, status: "disconnected" as const } : d
    ));
  };

  const getSignalIcon = (strength: number) => {
    if (strength >= 80) return "📶";
    if (strength >= 60) return "📶";
    if (strength >= 40) return "📱";
    return "📵";
  };

  const getBatteryColor = (level: number) => {
    if (level >= 60) return "#10b981";
    if (level >= 30) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="pair-device-container max-w-4xl mx-auto">
      <div className="mb-6">
        <Title level={2} style={{ color: 'white', margin: 0 }}>
          Device Connection
        </Title>
        <p className="text-white/70 text-lg mt-2">
          Connect your Sonorus stethoscope to begin recording heart sounds
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Device Status Panel */}
        <GlassCard padding="lg">
          <div className="text-center mb-6">
            <div className="mb-4">
              <HeartOutlined style={{ fontSize: "3rem", color: "#8C7DD1" }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Device Status
            </h3>

            {connectedDevice ? (
              <Alert
                message="Device Connected"
                description={`${connectedDevice.name} is ready to use`}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                className="mb-4"
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  borderColor: "#10b981",
                  color: "#10b981"
                }}
              />
            ) : (
              <Alert
                message="No Device Connected"
                description="Please scan and connect a stethoscope to continue"
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                className="mb-4"
                style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  borderColor: "#f59e0b",
                  color: "#f59e0b"
                }}
              />
            )}

            {connectedDevice && (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Battery</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      percent={connectedDevice.batteryLevel}
                      size="small"
                      strokeColor={getBatteryColor(connectedDevice.batteryLevel)}
                      showInfo={false}
                      className="w-16"
                    />
                    <span className="text-white text-sm">{connectedDevice.batteryLevel}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Signal</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getSignalIcon(connectedDevice.signalStrength)}</span>
                    <span className="text-white text-sm">{connectedDevice.signalStrength}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {!connectedDevice && (
                <GlassButton
                  variant="primary"
                  size="lg"
                  icon={<WifiOutlined />}
                  onClick={startScanning}
                  disabled={isScanning}
                  className="w-full"
                >
                  {isScanning ? "Scanning..." : "Scan for Devices"}
                </GlassButton>
              )}

              {connectedDevice && (
                <GlassButton
                  variant="danger"
                  size="lg"
                  onClick={disconnectDevice}
                  className="w-full"
                >
                  Disconnect Device
                </GlassButton>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Available Devices */}
        <GlassCard padding="lg">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Available Devices</h3>
              {devices.length > 0 && !isScanning && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<ReloadOutlined />}
                  onClick={startScanning}
                >
                  Refresh
                </GlassButton>
              )}
            </div>

            {isScanning && (
              <div className="text-center py-8">
                <div className="mb-4">
                  <WifiOutlined
                    className="text-4xl text-white/60 animate-pulse"
                  />
                </div>
                <p className="text-white/70">Scanning for devices...</p>
              </div>
            )}

            {!isScanning && devices.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/60">
                  No devices found. Make sure your stethoscope is powered on and in pairing mode.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-4 bg-white/10 rounded-lg border border-white/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{device.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      device.status === "connected"
                        ? "bg-green-500/20 text-green-300"
                        : device.status === "connecting"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}>
                      {device.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-white/60">Battery:</span>
                      <span className="text-white">{device.batteryLevel}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white/60">Signal:</span>
                      <span className="text-white">{device.signalStrength}%</span>
                    </div>
                  </div>

                  {device.status === "connecting" && (
                    <div className="mb-3">
                      <Progress
                        percent={connectionProgress}
                        size="small"
                        strokeColor="#8C7DD1"
                        showInfo={false}
                      />
                      <p className="text-white/60 text-xs mt-1">Connecting...</p>
                    </div>
                  )}

                  {device.status === "disconnected" && (
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => connectToDevice(device)}
                      className="w-full"
                    >
                      Connect
                    </GlassButton>
                  )}

                  {device.status === "connected" && (
                    <div className="flex items-center justify-center gap-2 text-green-300">
                      <CheckCircleOutlined />
                      <span className="text-sm">Connected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default PairDevice;