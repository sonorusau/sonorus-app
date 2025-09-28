import React, { useState, useEffect } from "react";
import { Button, Progress, Steps, Alert } from "antd";
import {
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import GlassCard from "../components/GlassCard";
import AudioWaveform from "../components/AudioWaveform";
import useMicrophoneAnalyser from "../hooks/useMicrophoneAnalyser";
import Title from "antd/es/typography/Title";
import "./QuickScan.css";

const { Step } = Steps;

function QuickScanPage(): JSX.Element {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const {
    analyser,
    start: startMicrophone,
    stop: stopMicrophone,
    error: audioError,
    clearError,
  } = useMicrophoneAnalyser();

  const steps = [
    {
      title: "Prepare",
      description: "Position stethoscope and prepare for recording",
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

  const handleStartRecording = async (): Promise<void> => {
    if (isRecording) {
      return;
    }

    try {
      clearError();
      await startMicrophone();
      setIsRecording(true);
      setCurrentStep(1);
      setRecordingTime(0);
    } catch (microphoneError) {
      console.error("Microphone start failed", microphoneError);
    }
  };

  const handleStopRecording = (): void => {
    stopMicrophone();
    setIsRecording(false);
    setCurrentStep(2);
    // Simulate analysis
    setTimeout(() => {
      setCurrentStep(3);
      setAnalysisComplete(true);
    }, 3000);
  };

  const handleReset = (): void => {
    stopMicrophone();
    setIsRecording(false);
    setRecordingTime(0);
    setCurrentStep(0);
    setAnalysisComplete(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="quick-scan-container">
      <div className="mb-6">
        <Title level={2} className="text-white">
          Quick Heart Sound Scan
        </Title>
        <p className="text-white/70 text-lg">
          Record heart sounds for immediate analysis without saving to patient
          records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left Panel - Recording Controls */}
        <div className="flex flex-col">
          <GlassCard padding="lg" className="flex-1">
            {audioError && (
              <Alert
                type="error"
                showIcon
                closable
                onClose={clearError}
                message="Microphone access required"
                description={audioError}
                className="mb-4 text-left"
              />
            )}
            <div className="text-center mb-8">
              <div className="recording-visualizer mb-6">
                <AudioWaveform isActive={isRecording} analyser={analyser} />
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
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartRecording}
                    className="recording-btn start-btn"
                    disabled={currentStep === 2}
                  >
                    Start Recording
                  </Button>
                )}

                {isRecording && (
                  <Button
                    danger
                    size="large"
                    icon={<StopOutlined />}
                    onClick={handleStopRecording}
                    className="recording-btn stop-btn"
                  >
                    Stop Recording
                  </Button>
                )}

                {analysisComplete && (
                  <div className="space-y-3">
                    <Button
                      size="large"
                      onClick={handleReset}
                      className="recording-btn reset-btn"
                    >
                      New Recording
                    </Button>
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
                <p className="text-white">Analyzing heart sounds...</p>
                <p className="text-white/60 text-sm">
                  This may take a few seconds
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

export default QuickScanPage;
