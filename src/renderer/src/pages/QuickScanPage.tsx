import React, { useState, useEffect } from "react";
import { Progress, Steps, Alert, Select } from "antd";
import {
  PlayCircleOutlined,
  StopOutlined,
  HeartOutlined,
  WifiOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import AudioWaveform from "../components/AudioWaveform";
import useAudioRecording from "../hooks/useAudioRecording";
import Title from "antd/es/typography/Title";
import "./QuickScan.css";
import "../styles/theme.css";
import HeartDiagram from "@renderer/components/HeartLocationDiagram";
import { Steps as WorkflowSteps, stepsTranslations } from "../enums/steps";
import type HeartLocation from "../types/HeartLocation";
import HeartLocationEnum from "../types/HeartLocation";
import type SkinBarrier from "../types/SkinBarrier";
import type SkinBarrierLevel from "../enums/SkinBarrierLevel";
import SkinBarrierLevelEnum from "../enums/SkinBarrierLevel";
import type SkinBarrierOptions from "../enums/SkinBarrierOptions";
import SkinBarrierOptionsEnum from "../enums/SkinBarrierOptions";
import type Recording from "../types/Recording";
import type RecordingBatch from "../types/RecordingBatch";
import type Patient from "../types/Patient";
import { saveRecording, saveRecordingBatch, updateRecordingBatch } from "../utils/storage";

const { Step } = Steps;
const { Option } = Select;

interface HeartAreaInfo {
  key: HeartLocation;
  label: string;
  description: string;
  icon: string;
}

interface LocalSkinBarrier extends SkinBarrier {
  id: string;
}

const heartAreas: HeartAreaInfo[] = [
  {
    key: HeartLocationEnum.Aortic,
    label: "Aortic Valve",
    description: "2nd intercostal space, right sternal border",
    icon: "",
  },
  {
    key: HeartLocationEnum.Pulmonary,
    label: "Pulmonary Valve",
    description: "2nd intercostal space, left sternal border",
    icon: "",
  },
  {
    key: HeartLocationEnum.Tricuspid,
    label: "Tricuspid Valve",
    description: "4th intercostal space, left sternal border",
    icon: "",
  },
  {
    key: HeartLocationEnum.Mitral,
    label: "Mitral Valve",
    description: "5th intercostal space, apex",
    icon: "",
  },
];

function QuickScanPage(): JSX.Element {
  const location = useLocation();
  // Recording state is now managed by useAudioRecording hook
  const [currentStep, setCurrentStep] = useState<number>(WorkflowSteps.SelectPatient);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedHeartArea, setSelectedHeartArea] = useState<HeartLocation | "">("");
  const [currentRecordingBatch, setCurrentRecordingBatch] = useState<RecordingBatch | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [completedRecordings, setCompletedRecordings] = useState<
    Record<HeartLocation, boolean>
  >({
    [HeartLocationEnum.Aortic]: false,
    [HeartLocationEnum.Pulmonary]: false,
    [HeartLocationEnum.Tricuspid]: false,
    [HeartLocationEnum.Mitral]: false
  });
  const [recordingResults, setRecordingResults] = useState<Partial<Record<HeartLocation, Recording>>>(
    {},
  );
  const [skinBarriers, setSkinBarriers] = useState<LocalSkinBarrier[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const {
    isRecording,
    recordingTime,
    recordingData,
    analyser,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    error: audioError,
    clearError,
  } = useAudioRecording(30000); // 30 second max

  // Create or resume recording batch on component mount
  useEffect(() => {
    if (!currentRecordingBatch) {
      const patientFromNav = location.state?.patient as Patient | undefined;
      const resumeBatch = location.state?.resumeBatch as RecordingBatch | undefined;

      if (resumeBatch && patientFromNav) {
        // Resume existing batch
        setSelectedPatient(patientFromNav);
        resumeExistingBatch(resumeBatch);
      } else if (patientFromNav) {
        // Create new batch for patient
        setSelectedPatient(patientFromNav);
        createPatientRecordingBatch(patientFromNav);
      } else {
        // Create anonymous batch
        createAnonymousRecordingBatch();
      }
    }
  }, [location.state]);

  const createPatientRecordingBatch = async (patient: Patient) => {
    try {
      const batch = await saveRecordingBatch({
        patient: patient,
        step_id: WorkflowSteps.SelectLocation,
        skin_barriers: [],
        start_time: new Date().toISOString(),
        is_complete: false,
        recordings: [],
        selected_recordings: []
      });
      setCurrentRecordingBatch(batch);
    } catch (error) {
      console.error('Failed to create patient recording batch:', error);
    }
  };

  const resumeExistingBatch = async (batch: RecordingBatch) => {
    try {
      // Set the current batch
      setCurrentRecordingBatch(batch);

      // Restore completion status based on existing recordings
      const newCompletedRecordings = {
        [HeartLocationEnum.Aortic]: false,
        [HeartLocationEnum.Pulmonary]: false,
        [HeartLocationEnum.Tricuspid]: false,
        [HeartLocationEnum.Mitral]: false
      };

      const recordingResults: Partial<Record<HeartLocation, Recording>> = {};

      // Mark areas as completed based on existing recordings
      if (batch.recordings) {
        batch.recordings.forEach(recording => {
          newCompletedRecordings[recording.location] = true;
          recordingResults[recording.location] = recording;
        });
      }

      setCompletedRecordings(newCompletedRecordings);
      setRecordingResults(recordingResults);

      // Restore skin barriers if any
      if (batch.skin_barriers) {
        const localBarriers: LocalSkinBarrier[] = batch.skin_barriers.map((barrier, index) => ({
          id: `barrier-${index}`,
          ...barrier
        }));
        setSkinBarriers(localBarriers);
      }

      // Set current step based on progress
      if (batch.is_complete) {
        setCurrentStep(WorkflowSteps.Complete);
        setAnalysisComplete(true);
      } else {
        setCurrentStep(WorkflowSteps.SelectLocation);
      }

      console.log(`Resumed batch ${batch.id} with ${batch.recordings?.length || 0} existing recordings`);
    } catch (error) {
      console.error('Failed to resume existing batch:', error);
    }
  };

  const createAnonymousRecordingBatch = async () => {
    try {
      // Create anonymous patient for Quick Scan recordings with better description
      const sessionTimestamp = new Date().toLocaleString();
      const anonymousPatient: Patient = {
        id: 0,
        name: "Quick Scan Session",
        dob: new Date().toISOString(),
        patient_uid: `quickscan-${Date.now()}`,
        patient_details: {
          id: 0,
          height: 0,
          weight: 0,
          medications: [],
          conditions: [],
          notes: [`Anonymous recording session started at ${sessionTimestamp}`]
        }
      };

      const batch = await saveRecordingBatch({
        patient: anonymousPatient,
        step_id: WorkflowSteps.SelectLocation,
        skin_barriers: [],
        start_time: new Date().toISOString(),
        is_complete: false,
        recordings: [],
        selected_recordings: []
      });
      setCurrentRecordingBatch(batch);
    } catch (error) {
      console.error('Failed to create anonymous recording batch:', error);
    }
  };

  const steps = [
    {
      title: stepsTranslations[WorkflowSteps.SelectLocation],
      description: "Complete recordings for all 4 heart valve areas",
    },
    {
      title: "Comprehensive Analysis",
      description: "AI analyzing all heart sounds together",
    },
    {
      title: stepsTranslations[WorkflowSteps.Complete],
      description: "View comprehensive heart analysis",
    },
  ];

  // Recording timer is now handled by useAudioRecording hook

  const handleStartRecording = async (): Promise<void> => {
    if (!selectedHeartArea) {
      alert("Please select a heart area to record");
      return;
    }
    // Patient selection not required for Quick Scan
    if (isRecording) {
      return;
    }

    try {
      clearError();
      await startAudioRecording();
    } catch (error) {
      console.error("Recording start failed:", error);
    }
  };

  const handleStopRecording = async (): Promise<void> => {
    if (!isRecording) {
      return;
    }

    // Ensure selectedHeartArea is a valid HeartLocation, not empty string
    if (!isValidHeartLocation(selectedHeartArea) || !currentRecordingBatch) {
      console.error('Invalid heart area selected:', selectedHeartArea);
      return;
    }

    const currentArea: HeartLocation = selectedHeartArea;

    try {
      const recordingData = await stopAudioRecording();
      console.log('Recording data received:', recordingData);

      if (recordingData) {
        // Save the recording to IndexedDB
        const recording = await saveRecording({
          recording_batch_id: currentRecordingBatch.id,
          device_id: 1, // Default device ID
          location: currentArea,
          audio: recordingData.blob,
          start_time: new Date(Date.now() - recordingData.duration).toISOString(),
        });

        // Mark this area as completed
        const newCompletedRecordings = {
          ...completedRecordings,
          [currentArea]: true,
        };
        setCompletedRecordings(newCompletedRecordings);

        // Store recording result
        setRecordingResults((prev) => ({
          ...prev,
          [currentArea]: recording,
        }));

        // Update recording batch with new recording and current skin barriers
        const updatedBatch = {
          ...currentRecordingBatch,
          recordings: [...currentRecordingBatch.recordings, recording],
          selected_recordings: [...currentRecordingBatch.selected_recordings, recording.id],
          skin_barriers: skinBarriers.map(barrier => ({
            level: barrier.level,
            option: barrier.option
          }))
        };

        await updateRecordingBatch(updatedBatch);
        setCurrentRecordingBatch(updatedBatch);

        // Check if all areas are completed
        const allCompleted = Object.values(newCompletedRecordings).every(
          (completed) => completed,
        );

        if (allCompleted) {
          // Mark batch as complete
          const completeBatch = {
            ...updatedBatch,
            is_complete: true,
            step_id: WorkflowSteps.Complete
          };
          await updateRecordingBatch(completeBatch);
          setCurrentRecordingBatch(completeBatch);

          setCurrentStep(WorkflowSteps.Record);
          // Start comprehensive analysis
          setTimeout(() => {
            setCurrentStep(WorkflowSteps.Complete);
            setAnalysisComplete(true);
          }, 2000);
        }
      } else {
        console.error('No recording data received from stopAudioRecording');
        alert('Recording failed - no audio data was captured. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert('Failed to save recording. Please try again.');
    }
  };

  const handleRedoRecording = async (heartArea: HeartLocation): Promise<void> => {
    if (!currentRecordingBatch) {
      console.error('No current recording batch available for redo');
      return;
    }

    try {
      // Find and remove the existing recording for this heart area
      const existingRecording = recordingResults[heartArea];
      if (existingRecording && currentRecordingBatch.recordings) {
        // Remove the recording from the batch
        const updatedRecordings = currentRecordingBatch.recordings.filter(
          (recording) => recording.location !== heartArea
        );
        const updatedSelectedRecordings = currentRecordingBatch.selected_recordings.filter(
          (recordingId) => recordingId !== existingRecording.id
        );

        // Update the recording batch
        const updatedBatch = {
          ...currentRecordingBatch,
          recordings: updatedRecordings,
          selected_recordings: updatedSelectedRecordings,
          is_complete: false // Mark as incomplete since we're redoing
        };

        await updateRecordingBatch(updatedBatch);
        setCurrentRecordingBatch(updatedBatch);
      }

      // Reset the completion status for this area
      setCompletedRecordings(prev => ({
        ...prev,
        [heartArea]: false
      }));

      // Remove from recording results
      setRecordingResults(prev => {
        const newResults = { ...prev };
        delete newResults[heartArea];
        return newResults;
      });

      // Select this area for recording
      setSelectedHeartArea(heartArea);

      console.log(`Redo recording prepared for ${heartArea} valve`);
    } catch (error) {
      console.error('Failed to prepare redo recording:', error);
      alert('Failed to prepare redo recording. Please try again.');
    }
  };

  const handleReset = (): void => {
    setCurrentStep(WorkflowSteps.SelectPatient);
    setAnalysisComplete(false);
    setSelectedHeartArea("");
    setCurrentRecordingBatch(null);
    setSelectedPatient(null);
    setCompletedRecordings({
      [HeartLocationEnum.Aortic]: false,
      [HeartLocationEnum.Pulmonary]: false,
      [HeartLocationEnum.Tricuspid]: false,
      [HeartLocationEnum.Mitral]: false
    });
    setRecordingResults({});
    setSkinBarriers([]);
    // Create new anonymous batch for next session
    createAnonymousRecordingBatch();
  };

  const canStartRecording = selectedHeartArea;

  // Type guard to check if selectedHeartArea is a valid HeartLocation
  const isValidHeartLocation = (area: HeartLocation | ""): area is HeartLocation => {
    return area !== "";
  };

  // Auto advance to step 1 when heart area is selected
  useEffect(() => {
    if (
      selectedHeartArea &&
      currentStep === WorkflowSteps.SelectPatient &&
      !isRecording &&
      !analysisComplete
    ) {
      // Stay on step SelectPatient until user manually proceeds
    }
  }, [selectedHeartArea, currentStep, isRecording, analysisComplete]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const scrollToSection = (sectionIndex: number): void => {
    const section = document.getElementById(`section-${sectionIndex}`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setCurrentSection(sectionIndex);
    }
  };

  const addSkinBarrier = (): void => {
    // Check if we already have 3 barriers (max: stickers, scars, fat, hair)
    if (skinBarriers.length >= 4) {
      return;
    }

    // Find the first available type
    const existingTypes = skinBarriers.map((barrier) => barrier.option);
    const availableTypes = Object.values(SkinBarrierOptionsEnum).filter(
      (type) => !existingTypes.includes(type),
    );

    if (availableTypes.length === 0) {
      return; // All types already exist
    }

    const newBarrier: LocalSkinBarrier = {
      id: `barrier-${Date.now()}`,
      level: SkinBarrierLevelEnum.Mild,
      option: availableTypes[0],
    };
    setSkinBarriers((prev) => [...prev, newBarrier]);
  };

  const getAvailableTypes = (
    currentBarrierId?: string,
  ): SkinBarrierOptions[] => {
    const existingTypes = skinBarriers
      .filter((barrier) => barrier.id !== currentBarrierId)
      .map((barrier) => barrier.option);
    return Object.values(SkinBarrierOptionsEnum).filter(
      (type) => !existingTypes.includes(type),
    );
  };

  const removeSkinBarrier = (id: string): void => {
    setSkinBarriers((prev) => prev.filter((barrier) => barrier.id !== id));
  };

  const updateSkinBarrier = (
    id: string,
    field: "option" | "level",
    value: string,
  ): void => {
    if (field === "option") {
      // Check if this type is already used by another barrier
      const existingBarrierWithType = skinBarriers.find(
        (barrier) => barrier.id !== id && barrier.option === value,
      );
      if (existingBarrierWithType) {
        return; // Don't allow duplicate types
      }
    }

    setSkinBarriers((prev) =>
      prev.map((barrier) =>
        barrier.id === id ? { ...barrier, [field]: value } : barrier,
      ),
    );
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

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isResumedSession = location.state?.resumeBatch ? true : false;

  return (
    <div className="quick-scan-container">
      {/* Patient Information Panel - Right Side Thin Layout */}
      {selectedPatient && selectedPatient.name !== "Quick Scan Session" && (
        <section className="patient-info-section">
          <GlassCard padding="sm" className="w-full">
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Avatar */}
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {selectedPatient.name.charAt(0).toUpperCase()}
              </div>

              {/* Patient Name */}
              <div className="px-2">
                <h3 className="text-white text-xl font-semibold leading-tight break-words">
                  {selectedPatient.name}
                </h3>
              </div>

              {/* Patient Details Table */}
              <div className="w-full px-2">
                <table className="patient-details-table">
                  <tbody>
                    <tr>
                      <td className="label">ID:</td>
                      <td className="value">{selectedPatient.patient_uid}</td>
                    </tr>
                    <tr>
                      <td className="label">DOB:</td>
                      <td className="value">{new Date(selectedPatient.dob).toLocaleDateString()}</td>
                    </tr>
                    {selectedPatient.patient_details.conditions && selectedPatient.patient_details.conditions.length > 0 && (
                      <tr>
                        <td className="label">Conditions:</td>
                        <td className="value">{selectedPatient.patient_details.conditions.join(", ")}</td>
                      </tr>
                    )}
                    {selectedPatient.patient_details.medications && selectedPatient.patient_details.medications.length > 0 && (
                      <tr>
                        <td className="label">Medications:</td>
                        <td className="value">{selectedPatient.patient_details.medications.join(", ")}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="label">Height:</td>
                      <td className="value">{selectedPatient.patient_details.height > 0 ? `${selectedPatient.patient_details.height}cm` : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="label">Weight:</td>
                      <td className="value">{selectedPatient.patient_details.weight > 0 ? `${selectedPatient.patient_details.weight}kg` : 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Recording Context Panel */}
      {selectedPatient && selectedPatient.name !== "Quick Scan Session" && (isValidHeartLocation(selectedHeartArea) || skinBarriers.length > 0) && (
        <section className="recording-context-panel">
          <GlassCard padding="sm" className="w-full">
            <div className="flex flex-col gap-1">
              {isValidHeartLocation(selectedHeartArea) && (
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Recording:</span>
                  <div className="flex flex-col items-end">
                    <span className="text-white text-sm">{heartAreas.find(area => area.key === selectedHeartArea)?.label}</span>
                    {completedRecordings[selectedHeartArea] && (
                      <span className="text-green-400 text-xs">✓ Completed</span>
                    )}
                  </div>
                </div>
              )}
              {skinBarriers.length > 0 && (
                <div className="flex items-start justify-between">
                  <span className="text-white/70 text-sm">Barriers:</span>
                  <div className="flex flex-col items-end gap-1">
                    {skinBarriers.map((barrier, index) => (
                      <span key={barrier.id} className="text-white text-xs">
                        {barrier.level} {barrier.option}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </section>
      )}

      {/* Recording Context Panel for Quick Scan Sessions */}
      {(!selectedPatient || selectedPatient.name === "Quick Scan Session") && (isValidHeartLocation(selectedHeartArea) || skinBarriers.length > 0) && (
        <section className="recording-context-panel--anonymous">
          <GlassCard padding="sm" className="w-full">
            <div className="flex flex-col gap-1">
              {isValidHeartLocation(selectedHeartArea) && (
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Recording:</span>
                  <div className="flex flex-col items-end">
                    <span className="text-white text-sm">{heartAreas.find(area => area.key === selectedHeartArea)?.label}</span>
                    {completedRecordings[selectedHeartArea] && (
                      <span className="text-green-400 text-xs">✓ Completed</span>
                    )}
                  </div>
                </div>
              )}
              {skinBarriers.length > 0 && (
                <div className="flex items-start justify-between">
                  <span className="text-white/70 text-sm">Barriers:</span>
                  <div className="flex flex-col items-end gap-1">
                    {skinBarriers.map((barrier, index) => (
                      <span key={barrier.id} className="text-white text-xs">
                        {barrier.level} {barrier.option}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </section>
      )}

      {/* Section 1: Skin Barriers Configuration */}
      <section id="section-0" className="snap-section section-1">
        <GlassCard
          padding="lg"
          className="w-full max-w-3xl max-h-[80vh] flex flex-col"
        >
          <div className="text-center mb-4 flex-shrink-0">
            <Title level={2} style={{ color: "white", margin: 0 }}>
              Skin Barriers Configuration
            </Title>
            <p className="text-white/70 text-sm mt-2">
              Skin barriers are anything that may affect recording quality
              across all heart valve areas
            </p>
            {skinBarriers.length === 0 && (
              <p className="text-white/60 text-sm mt-3">
                No skin barriers configured. Add barriers that may affect
                recording quality.
              </p>
            )}
          </div>

          {/* Scrollable Skin Barriers Container */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Existing Skin Barriers */}
            {skinBarriers.length > 0 && (
              <div className="mb-4 flex-1 min-h-0">
                {/* <h3 className="text-white font-medium text-center mb-4 flex-shrink-0">
                  Active Skin Barriers ({skinBarriers.length})
                </h3> */}
                <div className="max-h-80 space-y-3 px-2 pr-3 skin-barriers-scroll">
                  {skinBarriers.map((barrier, index) => (
                    <div
                      key={barrier.id}
                      className="p-4 rounded-lg bg-white/10 border border-white/20 flex-shrink-0"
                    >
                      <div className="flex items-end gap-4">
                        <div className="flex-1 min-w-0">
                          <label className="block text-white/80 text-sm font-medium mb-2">
                            Barrier Type
                          </label>
                          <Select
                            value={barrier.option}
                            onChange={(value) =>
                              updateSkinBarrier(barrier.id, "option", value)
                            }
                            className="w-full"
                            size="large"
                            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                          >
                            {/* Current type is always available */}
                            <Option value={barrier.option}>
                              {barrier.option.charAt(0).toUpperCase() +
                                barrier.option.slice(1)}
                            </Option>
                            {/* Show other available types */}
                            {getAvailableTypes(barrier.id)
                              .filter((type) => type !== barrier.option)
                              .map((type) => (
                                <Option key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Option>
                              ))}
                          </Select>
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className="block text-white/80 text-sm font-medium mb-2">
                            Severity Level
                          </label>
                          <Select
                            value={barrier.level}
                            onChange={(value) =>
                              updateSkinBarrier(barrier.id, "level", value)
                            }
                            className="w-full"
                            size="large"
                            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                          >
                            <Option value="mild">Mild</Option>
                            <Option value="moderate">Moderate</Option>
                            <Option value="severe">Severe</Option>
                          </Select>
                        </div>

                        <div className="flex-shrink-0">
                          <GlassButton
                            variant="danger"
                            size="sm"
                            icon={<DeleteOutlined />}
                            onClick={() => removeSkinBarrier(barrier.id)}
                          ></GlassButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Barrier */}
            <div className="text-center flex-shrink-0 mb-3 flex flex-col items-center">
              <GlassButton
                variant="secondary"
                icon={<PlusOutlined />}
                onClick={addSkinBarrier}
                disabled={skinBarriers.length >= 4}
              >
                Add Skin Barrier
              </GlassButton>
              {skinBarriers.length >= 4 && (
                <p className="text-white/60 text-sm mt-2">
                  Maximum barriers reached. You have all available barrier types
                  ({Object.values(SkinBarrierOptionsEnum).join(", ")}).
                </p>
              )}
            </div>
          </div>

          <div className="text-center mt-2 flex justify-end">
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
            <Title level={2} style={{ color: "white", margin: 0 }}>
              Choose Heart Location
            </Title>
            <p className="text-white/70 text-sm mt-2">
              Select the heart valve area to record
            </p>
          </div>

          {/* Progress indicator */}
          {/* <div className="mb-6 text-center">
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
          </div> */}

          <div className="flex flex-col lg:flex-row gap-6 items-center justify-center mb-6">
            {/* Interactive Chest Diagram */}
            <div className="relative">
              <HeartDiagram
                selectedHeartArea={selectedHeartArea}
                completedRecordings={completedRecordings}
                onAreaClick={(area) => {
                  // Always allow selection of heart areas
                  setSelectedHeartArea(area);
                }}
              />
            </div>

            {/* Legend and Selection Info */}
            <div className="space-y-3">
              <div className="text-white font-medium text-sm mb-2">
                Heart Valve Areas:
              </div>

              {/* Active Skin Barriers Status */}
              {/* {skinBarriers.length > 0 && (
                <div className="p-3 mb-3 rounded-lg bg-yellow-500/20 border border-yellow-500/40 max-h-32 flex flex-col">
                  <div className="text-yellow-400 text-xs font-medium mb-2 flex-shrink-0">
                    Active Skin Barriers ({skinBarriers.length}):
                  </div>
                  <div className="space-y-1 overflow-y-auto flex-1 skin-barriers-scroll pr-2">
                    {skinBarriers.map((barrier, index) => (
                      <div
                        key={barrier.id}
                        className="text-yellow-300/80 text-xs flex-shrink-0"
                      >
                        {index + 1}. {barrier.severity} {barrier.type}
                      </div>
                    ))}
                  </div>
                  <div className="text-yellow-300/60 text-xs mt-2 flex-shrink-0">
                    Applied to all heart valve recordings
                  </div>
                </div>
              )} */}
              {heartAreas.map((area) => (
                <div
                  key={area.key}
                  className={`p-2 rounded-lg border transition-all duration-300 ${
                    completedRecordings[area.key]
                      ? "bg-green-500/20 border-green-500/40"
                      : selectedHeartArea === area.key
                        ? "bg-white/20 border-white/40 cursor-pointer"
                        : "bg-white/10 border-white/20 cursor-pointer hover:bg-white/15"
                  }`}
                  onClick={() => setSelectedHeartArea(area.key)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs ${
                        completedRecordings[area.key]
                          ? "bg-green-500 text-white"
                          : selectedHeartArea === area.key
                            ? "bg-purple-500 text-white"
                            : "bg-white/20 text-white/70"
                      }`}
                    >
                      {completedRecordings[area.key]
                        ? "✓"
                        : area.key.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-white font-medium">
                          {area.label}
                        </div>
                        {completedRecordings[area.key] && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 text-xs">
                              Completed
                            </span>
                            <GlassButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRedoRecording(area.key)}
                              className="text-xs px-2 py-1"
                            >
                              Redo
                            </GlassButton>
                          </div>
                        )}
                      </div>
                      {/* <div className="text-white/60 text-sm">{area.description}</div> */}
                      {recordingResults[area.key] && (
                        <div className="text-xs text-white/50 mt-1">
                          Recorded: {recordingResults[area.key] ? new Date(recordingResults[area.key]!.start_time).toLocaleTimeString() : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
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
                ? `Next: Record ${heartAreas.find((area) => area.key === selectedHeartArea)?.label}`
                : "Select Heart Area First"}
            </GlassButton>
          </div>
        </GlassCard>
      </section>

      {/* Section 3: Recording Controls */}
      <section id="section-2" className="snap-section section-3">
        <GlassCard padding="lg" className="w-full max-w-3xl">
          <div className="text-center mb-6">
            <Title level={2} style={{ color: "white", margin: 0 }}>
              Record Heart Sounds
            </Title>
            <p className="text-white/70 text-lg mt-2">
              {selectedHeartArea
                ? `${heartAreas.find((area) => area.key === selectedHeartArea)?.label}`
                : "Ready to record when you select a heart area"}
            </p>
          </div>

          {/* Audio Error Alert */}
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

          {/* Recording Visualizer and Timer */}
          <div className="flex flex-col items-center mb-8">
            <div className="recording-visualizer mb-6">
              <div
                style={{
                  border: "1px solid white",
                  minHeight: "180px",
                  width: "520px",
                }}
              >
                <AudioWaveform isActive={isRecording} analyser={analyser} />
              </div>
              {/* Debug info */}
              {/* <div className="text-white text-xs mt-2">
                Debug: isActive={isRecording.toString()}, analyser=
                {analyser ? "exists" : "null"}
              </div> */}
              {/* Fallback display for debugging */}
              {!analyser && !isRecording && (
                <div className="text-white/60 text-sm mt-2">
                  Microphone ready - click record to start
                </div>
              )}
              {!analyser && isRecording && (
                <div className="text-yellow-400 text-sm mt-2">
                  Starting microphone...
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
                  percent={(recordingTime / 30000) * 100}
                  showInfo={false}
                  strokeColor="#8C7DD1"
                  trailColor="rgba(255,255,255,0.2)"
                />
                <p className="text-white/60 text-center mt-2">
                  {Math.max(0, Math.ceil((30000 - recordingTime) / 1000))} seconds remaining
                </p>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="recording-controls text-center mb-8">
            {!isRecording && !analysisComplete && (
              <div>
                {isValidHeartLocation(selectedHeartArea) && completedRecordings[selectedHeartArea] ? (
                  // Show redo options for completed areas
                  <div className="space-y-3">
                    <p className="text-green-400 text-lg mb-4">
                      ✓ {heartAreas.find(area => area.key === selectedHeartArea)?.label} recording complete
                    </p>
                    <div className="flex justify-center gap-3">
                      <GlassButton
                        variant="secondary"
                        size="lg"
                        onClick={() => handleRedoRecording(selectedHeartArea)}
                        className="mb-4"
                      >
                        Redo Recording
                      </GlassButton>
                      {Object.values(completedRecordings).filter(Boolean).length < 4 && (
                        <GlassButton
                          variant="primary"
                          size="lg"
                          onClick={() => scrollToSection(1)}
                          className="mb-4"
                        >
                          Record Other Areas
                        </GlassButton>
                      )}
                    </div>
                  </div>
                ) : (
                  // Show normal recording button for incomplete areas
                  <GlassButton
                    variant="primary"
                    size="lg"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartRecording}
                    disabled={!isValidHeartLocation(selectedHeartArea)}
                    className="mb-4"
                  >
                    {isValidHeartLocation(selectedHeartArea)
                      ? "Start Recording"
                      : "Please select a heart area to record"}
                  </GlassButton>
                )}
              </div>
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

            {Object.values(completedRecordings).filter(Boolean).length === 4 &&
              !analysisComplete && (
                <div className="mb-4">
                  <p className="text-green-400 text-lg mb-4">
                    ✓ All 4 areas recorded!
                  </p>
                  <GlassButton
                    variant="success"
                    size="lg"
                    onClick={() => setCurrentStep(WorkflowSteps.Record)}
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

                  {/* Display Active Skin Barriers in Results */}
                  {skinBarriers.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="text-yellow-400 text-sm font-medium mb-2">
                        Active Skin Barriers:
                      </div>
                      <div className="space-y-1">
                        {skinBarriers.map((barrier, index) => (
                          <div
                            key={barrier.id}
                            className="text-yellow-300/80 text-sm"
                          >
                            {index + 1}. {barrier.level} {barrier.option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-green-400 text-lg">
                    ✓{" "}
                    {Math.random() > 0.7
                      ? "Minor irregularities detected - recommend follow-up"
                      : "Normal heart sounds detected"}
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
            {/* <GlassButton
              variant="secondary"
              size="lg"
              onClick={() => scrollToSection(1)}
            >
              Back: Heart Location
            </GlassButton> */}
            {/* <p>{completedRecordings}</p> */}
            {/* {completedRecordings.map((recording, isCompleted) => (
              <div>yo</div>
            ))} */}
            {/* skinBarriers.map((barrier, index) => ( */}
            {isValidHeartLocation(selectedHeartArea) && completedRecordings[selectedHeartArea] &&
              !Object.values(completedRecordings).every(Boolean) && (
                <GlassButton
                  variant="primary"
                  size="lg"
                  onClick={() => scrollToSection(1)}
                >
                  Next: Choose another heart location
                </GlassButton>
              )}

            {isValidHeartLocation(selectedHeartArea) && !completedRecordings[selectedHeartArea] &&
              !Object.values(completedRecordings).every(Boolean) && (
                <GlassButton
                  variant="secondary"
                  size="lg"
                  onClick={() => scrollToSection(1)}
                >
                  Back: Choose another heart location
                </GlassButton>
              )}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

export default QuickScanPage;
