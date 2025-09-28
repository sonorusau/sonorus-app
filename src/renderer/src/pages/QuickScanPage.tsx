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

interface SkinBarrier {
  type: 'stickers' | 'scars' | 'fat' | '';
  severity: 'mild' | 'moderate' | 'severe' | '';
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
  const [globalSkinBarrier, setGlobalSkinBarrier] = useState<SkinBarrier>({ type: '', severity: '' });
  const [currentSection, setCurrentSection] = useState(0);

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

  const handleStartRecording = (): void => {
    if (!selectedHeartArea) {
      alert("Please select a heart area to record");
      return;
    }
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = (): void => {
    setIsRecording(false);

    const currentArea = selectedHeartArea;

    // Mark this area as completed and store mock result
    const newCompletedRecordings = {
      ...completedRecordings,
      [currentArea]: true
    };

    setCompletedRecordings(newCompletedRecordings);

    // Store mock recording result with skin barrier data
    setRecordingResults(prev => ({
      ...prev,
      [currentArea]: {
        duration: recordingTime,
        heartRate: Math.floor(Math.random() * 20) + 60, // 60-80 BPM
        rhythm: Math.random() > 0.8 ? "Irregular" : "Regular",
        quality: Math.random() > 0.7 ? "Poor" : "Good",
        timestamp: new Date().toISOString(),
        skinBarrier: globalSkinBarrier
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
    setGlobalSkinBarrier({ type: '', severity: '' });
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

  const scrollToSection = (sectionIndex: number): void => {
    const section = document.getElementById(`section-${sectionIndex}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setCurrentSection(sectionIndex);
    }
  };

  // Detect current section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = [0, 1, 2];
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(`section-${i}`);
        if (section && section.offsetTop <= scrollPosition) {
          setCurrentSection(i);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="quick-scan-container">

      {/* Section 1: Skin Barriers Configuration */}
      <section id="section-0" className="snap-section section-1">
        <GlassCard padding="lg" className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Skin Barriers Configuration
            </Title>
            <p className="text-white/70 text-lg mt-2">
              Configure any skin barriers that may affect recording quality across all heart valve areas
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
            <div className="flex-1">
              <label className="block text-white/80 text-sm font-medium mb-2">
                Barrier Type
              </label>
              <Select
                value={globalSkinBarrier.type || undefined}
                placeholder="Select type"
                onChange={(value) => setGlobalSkinBarrier(prev => ({
                  ...prev,
                  type: value
                }))}
                className="w-full"
                size="large"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Option value="stickers">Stickers</Option>
                <Option value="scars">Scars</Option>
                <Option value="fat">Fat</Option>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="block text-white/80 text-sm font-medium mb-2">
                Severity Level
              </label>
              <Select
                value={globalSkinBarrier.severity || undefined}
                placeholder="Select severity"
                onChange={(value) => setGlobalSkinBarrier(prev => ({
                  ...prev,
                  severity: value
                }))}
                className="w-full"
                size="large"
                disabled={!globalSkinBarrier.type}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Option value="mild">Mild</Option>
                <Option value="moderate">Moderate</Option>
                <Option value="severe">Severe</Option>
              </Select>
            </div>
          </div>
          
          {globalSkinBarrier.type && globalSkinBarrier.severity && (
            <div className="mb-6 text-center">
              <div className="inline-block p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/40">
                <span className="text-yellow-400 font-medium">
                  ⚠️ {globalSkinBarrier.severity.charAt(0).toUpperCase() + globalSkinBarrier.severity.slice(1)} {globalSkinBarrier.type} detected
                </span>
                <div className="text-yellow-300/80 text-sm mt-1">
                  Will affect recording quality for all areas
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <GlassButton
              variant="primary"
              size="lg"
              onClick={() => scrollToSection(1)}
            >
              Next: Choose Heart Location
            </GlassButton>
          </div>
        </GlassCard>
      </section>

      {/* Section 2: Heart Location Selection */}
      <section id="section-1" className="snap-section section-2">
        <GlassCard padding="lg" className="w-full max-w-4xl">
          <div className="text-center mb-6">
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Choose Heart Location
            </Title>
            <p className="text-white/70 text-lg mt-2">
              Select the heart valve area to record
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-white/60">Progress:</span>
              <div className="flex gap-2">
                {heartAreas.map((area) => (
                  <div
                    key={area.key}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      completedRecordings[area.key]
                        ? 'bg-green-500 text-white'
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

          <div className="flex flex-col lg:flex-row gap-6 items-center justify-center mb-6">
            {/* Interactive Chest Diagram */}
            <div className="relative">
              <svg
                width="280"
                height="380"
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
            <div className="space-y-3">
              <div className="text-white font-medium text-sm mb-2">Heart Valve Areas:</div>
              
              {/* Global Skin Barrier Status */}
              {globalSkinBarrier.type && globalSkinBarrier.severity && (
                <div className="p-2 mb-3 rounded-lg bg-yellow-500/20 border border-yellow-500/40">
                  <div className="text-yellow-400 text-xs font-medium">
                    Active Skin Barrier: {globalSkinBarrier.severity} {globalSkinBarrier.type}
                  </div>
                  <div className="text-yellow-300/80 text-xs">
                    Applied to all heart valve recordings
                  </div>
                </div>
              )}
              {heartAreas.map((area) => (
                <div
                  key={area.key}
                  className={`p-2 rounded-lg border transition-all duration-300 ${
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
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs ${
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

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <GlassButton
              variant="secondary"
              size="lg"
              onClick={() => scrollToSection(0)}
            >
              Back: Skin Barriers
            </GlassButton>
            <GlassButton
              variant="primary"
              size="lg"
              onClick={() => scrollToSection(2)}
              disabled={!selectedHeartArea}
            >
              {selectedHeartArea 
                ? `Next: Record ${heartAreas.find(area => area.key === selectedHeartArea)?.label}`
                : 'Select Heart Area First'}
            </GlassButton>
          </div>
        </GlassCard>
      </section>

      {/* Section 3: Recording Controls */}
      <section id="section-2" className="snap-section section-3">
        <GlassCard padding="lg" className="w-full max-w-3xl">
          <div className="text-center mb-6">
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Record Heart Sounds
            </Title>
            <p className="text-white/70 text-lg mt-2">
              {selectedHeartArea 
                ? `Recording ${heartAreas.find(area => area.key === selectedHeartArea)?.label} area`
                : "Ready to record when you select a heart area"}
            </p>
          </div>

          {/* Recording Visualizer and Timer */}
          <div className="flex flex-col items-center mb-8">
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

            <div className="recording-timer text-center mb-6">
              <span className="text-4xl font-mono text-white">
                {formatTime(recordingTime)}
              </span>
              <p className="text-white/60 text-lg mt-2">
                {isRecording ? "Recording..." : "Ready to record"}
              </p>
            </div>

            {recordingTime > 0 && (
              <div className="w-full max-w-md">
                <Progress
                  percent={(recordingTime / 30) * 100}
                  showInfo={false}
                  strokeColor="#8C7DD1"
                  trailColor="rgba(255,255,255,0.2)"
                />
                <p className="text-white/60 text-center mt-2">
                  {30 - recordingTime} seconds remaining
                </p>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="recording-controls text-center mb-8">
            {!isRecording && !analysisComplete && (
              <GlassButton
                variant="primary"
                size="lg"
                icon={<PlayCircleOutlined />}
                onClick={handleStartRecording}
                disabled={!selectedHeartArea}
                className="mb-4"
              >
                {selectedHeartArea
                  ? `Start Recording`
                  : 'Go back and select a heart area first'}
              </GlassButton>
            )}

            {isRecording && (
              <GlassButton
                variant="danger"
                size="lg"
                icon={<StopOutlined />}
                onClick={handleStopRecording}
                className="mb-4"
              >
                Stop Recording
              </GlassButton>
            )}

            {Object.values(completedRecordings).filter(Boolean).length === 4 && !analysisComplete && (
              <div className="mb-4">
                <p className="text-green-400 text-lg mb-4">
                  ✓ All 4 areas recorded!
                </p>
                <GlassButton
                  variant="success"
                  size="lg"
                  onClick={() => setCurrentStep(1)}
                  className="mb-4"
                >
                  Start Comprehensive Analysis
                </GlassButton>
              </div>
            )}

            {analysisComplete && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h3 className="text-xl font-semibold text-white">
                      Analysis Complete
                    </h3>
                  </div>
                  <p className="text-green-400 text-lg">
                    ✓ {Math.random() > 0.7 ? "Minor irregularities detected - recommend follow-up" : "Normal heart sounds detected"}
                  </p>
                </div>
                <GlassButton
                  variant="secondary"
                  size="lg"
                  onClick={handleReset}
                >
                  Start New Recording Session
                </GlassButton>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <GlassButton
              variant="secondary"
              size="lg"
              onClick={() => scrollToSection(1)}
            >
              Back: Heart Location
            </GlassButton>
            {Object.values(completedRecordings).some(Boolean) && (
              <GlassButton
                variant="primary"
                size="lg"
                onClick={() => scrollToSection(1)}
              >
                Record Another Area
              </GlassButton>
            )}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

export default QuickScanPage;
