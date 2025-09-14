import React, { useState, useEffect } from "react";
import { Progress, Steps, Select, Alert } from "antd";
import {
  PlayCircleOutlined,
  StopOutlined,
  HeartOutlined,
  WifiOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import Title from "antd/es/typography/Title";
import "./QuickScan.css";
import "../styles/theme.css";

const { Step } = Steps;
const { Option } = Select;

interface HeartArea {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const heartAreas: HeartArea[] = [
  {
    key: "aortic",
    label: "Aortic Valve",
    description: "2nd intercostal space, right sternal border",
    icon: ""
  },
  {
    key: "pulmonary", 
    label: "Pulmonary Valve",
    description: "2nd intercostal space, left sternal border",
    icon: ""
  },
  {
    key: "tricuspid",
    label: "Tricuspid Valve",
    description: "4th intercostal space, left sternal border",
    icon: ""
  },
  {
    key: "mitral",
    label: "Mitral Valve", 
    description: "5th intercostal space, apex",
    icon: ""
  }
];

function ListTeamReposPage(): JSX.Element {
  const location = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedHeartArea, setSelectedHeartArea] = useState<string>("");
  const [patientId, setPatientId] = useState<number | null>(null);
  
  // Get patient ID from navigation state if coming from patient select
  useEffect(() => {
    if (location.state?.patientId) {
      setPatientId(location.state.patientId);
    }
  }, [location.state]);

  const steps = [
    {
      title: "Setup",
      description: "Select heart area to record",
    },
    {
      title: "Record",
      description: "Record heart sounds for analysis",
    },
    {
      title: "Analyze",
      description: "AI analysis in progress",
    },
    {
      title: "Results",
      description: "View analysis results",
    },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            handleStopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = (): void => {
    if (!selectedHeartArea) {
      alert("Please select a heart area to record");
      return;
    }
    setIsRecording(true);
    setCurrentStep(1);
    setRecordingTime(0);
  };

  const handleStopRecording = (): void => {
    setIsRecording(false);
    setCurrentStep(2);
    // Simulate analysis
    setTimeout(() => {
      setCurrentStep(3);
      setAnalysisComplete(true);
    }, 3000);
  };

  const handleReset = (): void => {
    setIsRecording(false);
    setRecordingTime(0);
    setCurrentStep(selectedHeartArea ? 0 : 0);
    setAnalysisComplete(false);
  };
  
  const canStartRecording = selectedHeartArea;
  
  // Auto advance to step 1 when heart area is selected
  useEffect(() => {
    if (selectedHeartArea && currentStep === 0 && !isRecording && !analysisComplete) {
      // Stay on step 0 until user manually proceeds
    }
  }, [selectedHeartArea, currentStep, isRecording, analysisComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="quick-scan-container">
      <div className="mb-6">
        <Title level={2} style={{ color: 'white', margin: 0 }}>
          {patientId ? "Patient Recording" : "Quick Heart Sound Scan"}
        </Title>
        <p className="text-white/70 text-lg mt-2">
          {patientId 
            ? "Record heart sounds and save to patient record" 
            : "Record heart sounds for immediate analysis without saving to patient records"
          }
        </p>
      </div>

      {/* Heart Area Selection */}
      {currentStep === 0 && (
        <GlassCard padding="md" className="mb-6">
          <div className="mb-4">
            <label className="text-white font-medium mb-3 block">Select Heart Area to Record</label>
            <Select
              value={selectedHeartArea}
              onChange={setSelectedHeartArea}
              placeholder="Choose which heart valve to examine"
              size="large"
              className="w-full search-input"
            >
              {heartAreas.map((area) => (
                <Option key={area.key} value={area.key}>
                  {area.label}
                </Option>
              ))}
            </Select>
          </div>

          {selectedHeartArea && (
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20">
              <div>
                <div className="text-white font-medium">
                  Selected: {heartAreas.find(area => area.key === selectedHeartArea)?.label}
                </div>
                <div className="text-white/70 text-sm">
                  {heartAreas.find(area => area.key === selectedHeartArea)?.description}
                </div>
              </div>
              <GlassButton
                variant="primary"
                onClick={() => setCurrentStep(1)}
              >
                Start Recording
              </GlassButton>
            </div>
          )}
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left Panel - Recording Controls */}
        <div className="flex flex-col">
          <GlassCard padding="lg" className="flex-1">
            <div className="text-center mb-8">
              <div className="recording-visualizer mb-6">
                <div className={`heart-icon ${isRecording ? "beating" : ""}`}>
                  <span style={{ fontSize: "4rem", display: "block" }}>
                    🫀
                  </span>
                </div>
                {isRecording && (
                  <div className="sound-waves">
                    <div className="wave wave1"></div>
                    <div className="wave wave2"></div>
                    <div className="wave wave3"></div>
                  </div>
                )}
              </div>

              <div className="recording-timer mb-6">
                <span className="text-4xl font-mono text-white">
                  {formatTime(recordingTime)}
                </span>
                <p className="text-white/60 mt-2">
                  {isRecording ? "Recording..." : "Ready to record"}
                </p>
              </div>

              {recordingTime > 0 && (
                <div className="mb-6">
                  <Progress
                    percent={(recordingTime / 30) * 100}
                    showInfo={false}
                    strokeColor="#8C7DD1"
                    trailColor="rgba(255,255,255,0.2)"
                  />
                  <p className="text-white/60 text-sm mt-2">
                    {30 - recordingTime} seconds remaining
                  </p>
                </div>
              )}

              <div className="recording-controls">
                {!isRecording && !analysisComplete && (
                  <GlassButton
                    variant="primary"
                    size="lg"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartRecording}
                    disabled={currentStep === 2}
                  >
                    Start Recording
                  </GlassButton>
                )}

                {isRecording && (
                  <GlassButton
                    variant="danger"
                    size="lg"
                    icon={<StopOutlined />}
                    onClick={handleStopRecording}
                  >
                    Stop Recording
                  </GlassButton>
                )}

                {analysisComplete && (
                  <div className="space-y-3">
                    <GlassButton
                      variant="secondary"
                      size="lg"
                      onClick={handleReset}
                    >
                      New Recording
                    </GlassButton>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Panel - Steps and Results */}
        <div className="flex flex-col">
          <GlassCard padding="lg" className="flex-1">
            <div className="mb-8">
              <Steps current={currentStep} direction="vertical">
                {steps.map((step, index) => (
                  <Step
                    key={index}
                    title={<span className="text-white">{step.title}</span>}
                    description={
                      <span className="text-white/70">{step.description}</span>
                    }
                  />
                ))}
              </Steps>
            </div>

            {currentStep === 2 && (
              <div className="text-center">
                <div className="analysis-spinner mb-4">
                  <div className="spinner"></div>
                </div>
                <p className="text-white">Analyzing {heartAreas.find(area => area.key === selectedHeartArea)?.label} sounds...</p>
                <p className="text-white/60 text-sm">
                  Processing {recordingTime}s recording
                </p>
              </div>
            )}

            {analysisComplete && (
              <div className="results-panel">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h3 className="text-xl font-semibold text-white">
                      Analysis Complete
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="result-item">
                    <p className="text-white/60 text-sm uppercase tracking-wide">
                      Heart Rate
                    </p>
                    <p className="text-white text-lg font-semibold">72 BPM</p>
                  </div>

                  <div className="result-item">
                    <p className="text-white/60 text-sm uppercase tracking-wide">
                      Rhythm
                    </p>
                    <p className="text-white text-lg font-semibold">Regular</p>
                  </div>

                  <div className="result-item">
                    <p className="text-white/60 text-sm uppercase tracking-wide">
                      Analysis
                    </p>
                    <p className="text-white text-lg font-semibold">
                      Normal Heart Sounds
                    </p>
                  </div>

                  <div className="mt-6 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                    <p className="text-green-300 font-medium">
                      ✓ No abnormalities detected
                    </p>
                    <p className="text-white/70 text-sm mt-1">
                      Heart sounds appear normal. Consider consulting with a
                      physician for complete evaluation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default ListTeamReposPage;
