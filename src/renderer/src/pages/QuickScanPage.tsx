import React, { useState, useEffect } from "react";
import { Progress, Steps, Alert } from "antd";
import {
  PlayCircleOutlined,
  StopOutlined
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import AudioWaveform from "../components/AudioWaveform";
import useMicrophoneAnalyser from "../hooks/useMicrophoneAnalyser";
import Title from "antd/es/typography/Title";
import "./QuickScan.css";
import "../styles/theme.css";

const { Step } = Steps;
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

function QuickScanPage(): JSX.Element {
  const location = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedHeartArea, setSelectedHeartArea] = useState<string>("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [completedRecordings, setCompletedRecordings] = useState<Record<string, boolean>>({
    aortic: false,
    pulmonary: false,
    tricuspid: false,
    mitral: false
  });
  const [recordingResults, setRecordingResults] = useState<Record<string, any>>({});
  const {
    analyser,
    start: startMicrophone,
    stop: stopMicrophone,
    error: audioError,
    clearError,
  } = useMicrophoneAnalyser();

  // Get patient ID from navigation state if coming from patient select
  useEffect(() => {
    if (location.state?.patientId) {
      setPatientId(location.state.patientId);
    }
  }, [location.state]);

  const steps = [
    {
      title: "Record All Areas",
      description: "Complete recordings for all 4 heart valve areas",
    },
    {
      title: "Comprehensive Analysis",
      description: "AI analyzing all heart sounds together",
    },
    {
      title: "Complete Results",
      description: "View comprehensive heart analysis",
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
    if (!selectedHeartArea) {
      alert("Please select a heart area to record");
      return;
    }
    if (isRecording) {
      return;
    }

    try {
      clearError();
      await startMicrophone();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (microphoneError) {
      console.error("Microphone start failed", microphoneError);
    }
  };

  const handleStopRecording = (): void => {
    stopMicrophone();

    if (!isRecording) {
      setSelectedHeartArea("");
      return;
    }

    setIsRecording(false);

    const currentArea = selectedHeartArea;

    if (!currentArea) {
      setSelectedHeartArea("");
      return;
    }

    // Mark this area as completed and store mock result
    const newCompletedRecordings = {
      ...completedRecordings,
      [currentArea]: true
    };

    setCompletedRecordings(newCompletedRecordings);

    // Store mock recording result
    setRecordingResults(prev => ({
      ...prev,
      [currentArea]: {
        duration: recordingTime,
        heartRate: Math.floor(Math.random() * 20) + 60, // 60-80 BPM
        rhythm: Math.random() > 0.8 ? "Irregular" : "Regular",
        quality: Math.random() > 0.7 ? "Poor" : "Good",
        timestamp: new Date().toISOString()
      }
    }));

    // Reset selection for next recording
    setSelectedHeartArea("");

    // Check if all areas are completed - but don't auto-start analysis
    const allCompleted = Object.values(newCompletedRecordings).every(completed => completed);

    // Don't automatically start analysis - let user decide when to analyze
    // if (allCompleted) {
    //   setCurrentStep(1);
    //   // Start comprehensive analysis
    //   setTimeout(() => {
    //     setCurrentStep(2);
    //     setAnalysisComplete(true);
    //   }, 4000);
    // }
  };

  const handleReset = (): void => {
    stopMicrophone();
    setIsRecording(false);
    setRecordingTime(0);
    setCurrentStep(0);
    setAnalysisComplete(false);
    setSelectedHeartArea("");
    setCompletedRecordings({
      aortic: false,
      pulmonary: false,
      tricuspid: false,
      mitral: false
    });
    setRecordingResults({});
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

      {/* Recording Progress Overview */}
      <GlassCard padding="md" className="mb-4">
        <div className="text-center mb-6">
          <h3 className="text-white font-medium text-xl mb-2">Complete Heart Sound Analysis</h3>
          <p className="text-white/70">Record all 4 heart valve areas for comprehensive analysis</p>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="text-white/60">Progress:</span>
            <div className="flex gap-2">
              {heartAreas.map((area) => (
                <div
                  key={area.key}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    completedRecordings[area.key]
                      ? 'bg-green-500 text-white'
                      : selectedHeartArea === area.key && isRecording
                      ? 'bg-yellow-500 text-black'
                      : selectedHeartArea === area.key
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {completedRecordings[area.key] ? '✓' : area.key.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-white/60">
              {Object.values(completedRecordings).filter(Boolean).length}/4 completed
            </span>
          </div>
        </div>

      {/* Heart Area Selection - only show if not all completed and not currently analyzing */}
      {!analysisComplete && currentStep === 0 && (
        <div>
          <div className="text-center mb-4">
            <h4 className="text-white font-medium mb-2">
              {Object.values(completedRecordings).every(Boolean)
                ? "All recordings complete! Starting analysis..."
                : "Select next heart area to record"}
            </h4>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Interactive Chest Diagram */}
            <div className="relative">
              <svg
                width="320"
                height="450"
                viewBox="0 0 320 450"
                className="chest-diagram"
              >
                {/* Shoulder line */}
                <path
                  d="M50 80 C80 70, 120 65, 160 65 C200 65, 240 70, 270 80"
                  fill="none"
                  stroke="#ACACE6"
                  strokeWidth="2"
                />

                {/* Chest outline - more anatomical */}
                <path
                  d="M50 80
                     L70 120
                     C75 180, 80 240, 85 300
                     C90 350, 110 380, 160 385
                     C210 380, 230 350, 235 300
                     C240 240, 245 180, 250 120
                     L270 80"
                  fill="rgba(255,255,255,0.05)"
                  stroke="#ACACE6"
                  strokeWidth="2"
                />

                {/* Clavicles (collar bones) */}
                <path
                  d="M90 85 C120 80, 140 82, 160 85"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M160 85 C180 82, 200 80, 230 85"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2"
                  fill="none"
                />

                {/* Sternum (breastbone) */}
                <rect
                  x="155"
                  y="100"
                  width="10"
                  height="180"
                  fill="rgba(255,255,255,0.2)"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                  rx="5"
                />

                {/* Rib cage - more realistic curved ribs */}
                <path d="M100 120 C130 115, 190 115, 220 120" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
                <path d="M95 140 C130 135, 190 135, 225 140" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
                <path d="M90 160 C130 155, 190 155, 230 160" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
                <path d="M95 180 C130 175, 190 175, 225 180" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
                <path d="M100 200 C130 195, 190 195, 220 200" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
                <path d="M105 220 C130 215, 190 215, 215 220" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>

                {/* Nipple landmarks */}
                <circle cx="125" cy="180" r="3" fill="rgba(255,255,255,0.4)"/>
                <circle cx="195" cy="180" r="3" fill="rgba(255,255,255,0.4)"/>

                {/* Aortic Area - 2nd intercostal space, right sternal border */}
                <circle
                  cx="185"
                  cy="140"
                  r="18"
                  fill={completedRecordings.aortic ? '#10b981' : selectedHeartArea === 'aortic' ? '#8C7DD1' : 'rgba(255,255,255,0.25)'}
                  stroke={completedRecordings.aortic ? '#059669' : selectedHeartArea === 'aortic' ? '#ACACE6' : '#888'}
                  strokeWidth="2"
                  className={`${completedRecordings.aortic ? '' : 'cursor-pointer'} transition-all duration-300 hover:opacity-80`}
                  onClick={() => !completedRecordings.aortic && setSelectedHeartArea('aortic')}
                />
                <text x="185" y="145" textAnchor="middle" className="fill-white text-sm font-bold pointer-events-none select-none">
                  {completedRecordings.aortic ? '✓' : 'A'}
                </text>

                {/* Pulmonary Area - 2nd intercostal space, left sternal border */}
                <circle
                  cx="135"
                  cy="140"
                  r="18"
                  fill={completedRecordings.pulmonary ? '#10b981' : selectedHeartArea === 'pulmonary' ? '#8C7DD1' : 'rgba(255,255,255,0.25)'}
                  stroke={completedRecordings.pulmonary ? '#059669' : selectedHeartArea === 'pulmonary' ? '#ACACE6' : '#888'}
                  strokeWidth="2"
                  className={`${completedRecordings.pulmonary ? '' : 'cursor-pointer'} transition-all duration-300 hover:opacity-80`}
                  onClick={() => !completedRecordings.pulmonary && setSelectedHeartArea('pulmonary')}
                />
                <text x="135" y="145" textAnchor="middle" className="fill-white text-sm font-bold pointer-events-none select-none">
                  {completedRecordings.pulmonary ? '✓' : 'P'}
                </text>

                {/* Tricuspid Area - 4th intercostal space, left sternal border */}
                <circle
                  cx="135"
                  cy="180"
                  r="18"
                  fill={completedRecordings.tricuspid ? '#10b981' : selectedHeartArea === 'tricuspid' ? '#8C7DD1' : 'rgba(255,255,255,0.25)'}
                  stroke={completedRecordings.tricuspid ? '#059669' : selectedHeartArea === 'tricuspid' ? '#ACACE6' : '#888'}
                  strokeWidth="2"
                  className={`${completedRecordings.tricuspid ? '' : 'cursor-pointer'} transition-all duration-300 hover:opacity-80`}
                  onClick={() => !completedRecordings.tricuspid && setSelectedHeartArea('tricuspid')}
                />
                <text x="135" y="185" textAnchor="middle" className="fill-white text-sm font-bold pointer-events-none select-none">
                  {completedRecordings.tricuspid ? '✓' : 'T'}
                </text>

                {/* Mitral Area - 5th intercostal space, apex (mid-clavicular line) */}
                <circle
                  cx="125"
                  cy="200"
                  r="18"
                  fill={completedRecordings.mitral ? '#10b981' : selectedHeartArea === 'mitral' ? '#8C7DD1' : 'rgba(255,255,255,0.25)'}
                  stroke={completedRecordings.mitral ? '#059669' : selectedHeartArea === 'mitral' ? '#ACACE6' : '#888'}
                  strokeWidth="2"
                  className={`${completedRecordings.mitral ? '' : 'cursor-pointer'} transition-all duration-300 hover:opacity-80`}
                  onClick={() => !completedRecordings.mitral && setSelectedHeartArea('mitral')}
                />
                <text x="125" y="205" textAnchor="middle" className="fill-white text-sm font-bold pointer-events-none select-none">
                  {completedRecordings.mitral ? '✓' : 'M'}
                </text>
              </svg>
            </div>

            {/* Legend and Selection Info */}
            <div className="space-y-4">
              <div className="text-white font-medium mb-4">Heart Valve Areas:</div>
              {heartAreas.map((area) => (
                <div
                  key={area.key}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    completedRecordings[area.key]
                      ? 'bg-green-500/20 border-green-500/40'
                      : selectedHeartArea === area.key
                      ? 'bg-white/20 border-white/40 cursor-pointer'
                      : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/15'
                  }`}
                  onClick={() => !completedRecordings[area.key] && setSelectedHeartArea(area.key)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                        completedRecordings[area.key]
                          ? 'bg-green-500 text-white'
                          : selectedHeartArea === area.key
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white/70'
                      }`}
                    >
                      {completedRecordings[area.key] ? '✓' : area.key.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-white font-medium">{area.label}</div>
                        {completedRecordings[area.key] && (
                          <span className="text-green-400 text-xs">Completed</span>
                        )}
                      </div>
                      <div className="text-white/60 text-sm">{area.description}</div>
                      {recordingResults[area.key] && (
                        <div className="text-xs text-white/50 mt-1">
                          Duration: {recordingResults[area.key].duration}s
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full mb-16">
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
                    style={{
                      border: '1px solid rgba(172, 172, 230, 0.5)',
                      borderRadius: '6px',
                      padding: '2px'
                    }}
                  />
                  <p className="text-white/60 text-sm mt-2">
                    {30 - recordingTime} seconds remaining
                  </p>
                </div>
              )}

              <div className="recording-controls">
                {/* Debug info - remove later */}
                <div className="text-xs text-white/50 mb-2">
                  Debug: isRecording={isRecording.toString()}, currentStep={currentStep}, analysisComplete={analysisComplete.toString()}, selectedArea={selectedHeartArea}
                </div>

                {/* Always show start button when not recording and not analyzing */}
                {!isRecording && currentStep === 0 && !analysisComplete && (
                  <GlassButton
                    variant="primary"
                    size="lg"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartRecording}
                    disabled={!selectedHeartArea}
                  >
                    {selectedHeartArea
                      ? `Start Recording - ${heartAreas.find(area => area.key === selectedHeartArea)?.label || selectedHeartArea}`
                      : 'Select Heart Area First'}
                  </GlassButton>
                )}

                {/* Show message when all recordings complete but still allow new ones */}
                {!isRecording && currentStep === 0 && !analysisComplete && Object.values(completedRecordings).filter(Boolean).length === 4 && (
                  <div className="text-center mb-4">
                    <p className="text-green-400 text-sm mb-2">
                      ✓ All 4 areas recorded! You can record additional areas or start analysis.
                    </p>
                    <GlassButton
                      variant="success"
                      size="lg"
                      onClick={() => setCurrentStep(1)}
                    >
                      Start Comprehensive Analysis
                    </GlassButton>
                  </div>
                )}

                {/* Always show stop button when recording */}
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

                {/* Show new recording button when analysis is complete */}
                {analysisComplete && (
                  <div className="space-y-3">
                    <GlassButton
                      variant="secondary"
                      size="lg"
                      onClick={handleReset}
                    >
                      New Recording Session
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

            {currentStep === 1 && (
              <div className="text-center">
                <div className="analysis-spinner mb-4">
                  <div className="spinner"></div>
                </div>
                <p className="text-white">Analyzing all heart valve areas...</p>
                <p className="text-white/60 text-sm">
                  Processing comprehensive heart sound data from 4 locations
                </p>
              </div>
            )}

            {analysisComplete && (
              <div className="results-panel">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h3 className="text-xl font-semibold text-white">
                      Comprehensive Analysis Complete
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="result-item">
                    <p className="text-white/60 text-sm uppercase tracking-wide">
                      Overall Heart Rate
                    </p>
                    <p className="text-white text-lg font-semibold">
                      {Math.floor(Math.random() * 15) + 65} BPM
                    </p>
                  </div>

                  <div className="result-item">
                    <p className="text-white/60 text-sm uppercase tracking-wide">
                      Rhythm Analysis
                    </p>
                    <p className="text-white text-lg font-semibold">
                      {Math.random() > 0.8 ? "Irregular" : "Regular"}
                    </p>
                  </div>

                  {/* Individual Valve Results */}
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <p className="text-white/60 text-sm uppercase tracking-wide mb-3">
                      Valve Area Results
                    </p>
                    <div className="space-y-2">
                      {Object.entries(recordingResults).map(([area, result]) => (
                        <div key={area} className="flex items-center justify-between p-2 bg-white/5 rounded">
                          <span className="text-white text-sm">
                            {heartAreas.find(h => h.key === area)?.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 text-xs">
                              {result.quality} Quality
                            </span>
                            <span className="text-white/60 text-xs">
                              {result.duration}s
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="result-item">
                    <p className="text-white/60 text-sm uppercase tracking-wide">
                      Comprehensive Assessment
                    </p>
                    <p className="text-white text-lg font-semibold">
                      {Math.random() > 0.7 ? "Minor Irregularities Detected" : "Normal Heart Sounds"}
                    </p>
                  </div>

                  <div className={`mt-6 p-4 rounded-xl border ${
                    Math.random() > 0.7
                      ? 'bg-yellow-500/20 border-yellow-500/30'
                      : 'bg-green-500/20 border-green-500/30'
                  }`}>
                    <p className={`font-medium ${
                      Math.random() > 0.7 ? 'text-yellow-300' : 'text-green-300'
                    }`}>
                      {Math.random() > 0.7
                        ? '⚠ Recommend follow-up examination'
                        : '✓ No significant abnormalities detected'}
                    </p>
                    <p className="text-white/70 text-sm mt-1">
                      Analysis based on recordings from all 4 heart valve areas.
                      Results should be reviewed by a qualified healthcare professional.
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
