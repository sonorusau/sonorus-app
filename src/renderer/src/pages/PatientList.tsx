import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Modal, Form, DatePicker, message, Tooltip, Slider } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import ConfirmationModal, {
  GlassTable,
  type TableRow,
} from "../components/ConfirmationModal";
import AudioWaveform from "../components/AudioWaveform";
import Title from "antd/es/typography/Title";
import type Patient from "../types/Patient";
import type PatientDetails from "../types/PatientDetails";
import type RecordingBatch from "../types/RecordingBatch";
import {
  getPatients,
  savePatient,
  deletePatient,
  getRecordingsByPatient,
  getRecordingBatchesByPatient,
  deleteRecordingBatch,
  deleteRecording,
} from "../utils/storage";
import "./PatientSelect.css";

interface NewPatientFormData {
  name: string;
  dob: dayjs.Dayjs;
  patient_uid: string;
  height: number;
  weight: number;
  medications: string;
  conditions: string;
  notes: string;
}

// Mock data removed - now using IndexedDB storage

function PatientList(): JSX.Element {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [patientBatches, setPatientBatches] = useState<RecordingBatch[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(
    new Set(),
  );
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [form] = Form.useForm<NewPatientFormData>();
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "batch" | "patient" | "recording";
    id: number;
    title: string;
    content: React.ReactNode;
  } | null>(null);
  const [playingRecordings, setPlayingRecordings] = useState<Set<number>>(
    new Set(),
  );
  const [pausedRecordings, setPausedRecordings] = useState<Set<number>>(
    new Set(),
  );
  const [audioInstances, setAudioInstances] = useState<Map<number, HTMLAudioElement>>(
    new Map(),
  );
  const [audioAnalysers, setAudioAnalysers] = useState<Map<number, AnalyserNode>>(
    new Map(),
  );
  const [audioContexts, setAudioContexts] = useState<Map<number, AudioContext>>(
    new Map(),
  );
  const [recordingProgress, setRecordingProgress] = useState<Map<number, { current: number; duration: number }>>(
    new Map(),
  );
  const progressIntervalRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    loadPatients();
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      progressIntervalRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      progressIntervalRef.current.clear();
    };
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientsData = await getPatients();
      setPatients(patientsData);
      if (patientsData.length > 0) {
        handlePatientSelect(patientsData[0]);
      }
    } catch (error) {
      console.error("Error loading patients:", error);
      message.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    // Load patient's recording batches
    try {
      const batches = await getRecordingBatchesByPatient(patient.id);
      setPatientBatches(batches);

      // Debug: Check audio data in loaded batches
      console.log("PatientList - Loaded batches for patient:", patient.name);
      batches.forEach((batch) => {
        if (batch.recordings) {
          console.log(
            `Batch ${batch.id} has ${batch.recordings.length} recordings`,
          );
          batch.recordings.forEach((recording) => {
            console.log(`Recording ${recording.id}:`, {
              hasAudio: !!recording.audio,
              audioType: recording.audio?.constructor?.name,
              audioSize: recording.audio?.size,
              location: recording.location,
            });
          });
        }
      });

      // Auto-expand first batch if it exists
      if (batches.length > 0) {
        setExpandedBatches(new Set([batches[0].id]));
      } else {
        setExpandedBatches(new Set());
      }
    } catch (error) {
      console.error("Error loading patient batches:", error);
    }
  };

  const handleAddRecording = () => {
    if (selectedPatient) {
      navigate("/quick-scan", { state: { patient: selectedPatient } });
    }
  };

  const handleAddNewPatient = () => {
    form.resetFields();
    // Set default values
    form.setFieldsValue({
      patient_uid: `P-${Date.now()}`, // Generate default UID
      height: 170,
      weight: 70,
      medications: "",
      conditions: "",
      notes: "",
    });
    setShowNewPatientModal(true);
  };

  const handleCreatePatient = async () => {
    try {
      const values = await form.validateFields();

      // Parse medications, conditions, and notes from comma-separated strings
      const medications = values.medications
        .split(",")
        .map((med) => med.trim())
        .filter((med) => med.length > 0);

      const conditions = values.conditions
        .split(",")
        .map((condition) => condition.trim())
        .filter((condition) => condition.length > 0);

      const notes = values.notes
        .split(",")
        .map((note) => note.trim())
        .filter((note) => note.length > 0);

      const patientDetails: PatientDetails = {
        id: 0, // Will be assigned by storage
        height: values.height,
        weight: values.weight,
        medications,
        conditions,
        notes,
      };

      const newPatient = await savePatient({
        name: values.name,
        dob: values.dob.toISOString(),
        patient_uid: values.patient_uid,
        patient_details: patientDetails,
      });

      // Update local patients list
      await loadPatients();

      // Select the newly created patient
      handlePatientSelect(newPatient);

      // Close modal
      setShowNewPatientModal(false);

      message.success(`Patient "${newPatient.name}" created successfully`);
    } catch (error) {
      console.error("Error creating patient:", error);
      message.error("Failed to create patient");
    }
  };

  const handleModalCancel = () => {
    setShowNewPatientModal(false);
    form.resetFields();
  };

  const toggleBatchExpansion = (batchId: number) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedBatches(newExpanded);
  };

  const getBatchProgress = (
    batch: RecordingBatch,
  ): { completed: number; total: number; percentage: number } => {
    const totalAreas = 4; // Aortic, Pulmonary, Tricuspid, Mitral
    const completedAreas = batch.recordings ? batch.recordings.length : 0;
    return {
      completed: completedAreas,
      total: totalAreas,
      percentage: (completedAreas / totalAreas) * 100,
    };
  };

  const getBatchStatusColor = (batch: RecordingBatch) => {
    if (batch.is_complete) return "#10b981"; // Green for complete
    const progress = getBatchProgress(batch);
    if (progress.completed === 0) return "#6b7280"; // Gray for not started
    return "#f59e0b"; // Amber for in progress
  };

  const handleResumeBatch = (batch: RecordingBatch) => {
    // Navigate to QuickScanPage with batch data for resume
    navigate("/quick-scan", {
      state: { patient: selectedPatient, resumeBatch: batch },
    });
  };

  const handleDeleteBatch = async (batchId: number) => {
    const batch = patientBatches.find((b) => b.id === batchId);
    if (!batch) return;

    const recordingCount = batch.recordings?.length || 0;
    const batchDate = new Date(batch.start_time).toLocaleDateString();

    const batchTableRows: TableRow[] = [
      { label: "Session", value: `Session #${batchId} from ${batchDate}` },
      {
        label: "Recordings",
        value: `${recordingCount} recording${recordingCount !== 1 ? "s" : ""}`,
      },
      ...(batch.skin_barriers && batch.skin_barriers.length > 0
        ? [{ label: "Skin Barriers", value: "Included in deletion" }]
        : []),
    ];

    setDeleteModal({
      open: true,
      type: "batch",
      id: batchId,
      title: "Delete Recording Session?",
      content: (
        <div>
          <p className="text-white/90 mb-4">This will permanently delete:</p>
          <GlassTable rows={batchTableRows} className="mb-4" />
          <p className="text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>
      ),
    });
  };

  const handleDeletePatient = async (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;

    const batches = patientBatches.length;
    const totalRecordings = patientBatches.reduce(
      (total, batch) => total + (batch.recordings?.length || 0),
      0,
    );

    const patientTableRows: TableRow[] = [
      { label: "Patient Name", value: patient.name },
      {
        label: "Sessions",
        value: `${batches} recording session${batches !== 1 ? "s" : ""}`,
      },
      {
        label: "Recordings",
        value: `${totalRecordings} recording${totalRecordings !== 1 ? "s" : ""}`,
      },
      { label: "Medical Data", value: "All history and patient data" },
    ];

    setDeleteModal({
      open: true,
      type: "patient",
      id: patientId,
      title: "Delete Patient?",
      content: (
        <div>
          <p className="text-white/90 mb-4">This will permanently delete:</p>
          <GlassTable rows={patientTableRows} className="mb-4" />
          <p className="text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>
      ),
    });
  };

  const handleDeleteIndividualRecording = async (recordingId: number) => {
    // Find the recording details
    let recordingToDelete: any = null;

    for (const batch of patientBatches) {
      if (batch.recordings) {
        const found = batch.recordings.find((r) => r.id === recordingId);
        if (found) {
          recordingToDelete = found;
          break;
        }
      }
    }

    if (!recordingToDelete || !selectedPatient) return;

    const recordingTableRows: TableRow[] = [
      { label: "Heart Valve", value: `${recordingToDelete.location} Valve` },
      { label: "Patient", value: selectedPatient.name },
      {
        label: "Date",
        value: new Date(recordingToDelete.start_time).toLocaleDateString(),
      },
      { label: "Duration", value: "30s recording" },
    ];

    setDeleteModal({
      open: true,
      type: "recording",
      id: recordingId,
      title: "Delete Recording?",
      content: (
        <div>
          <p className="text-white/90 mb-4">This will permanently delete:</p>
          <GlassTable rows={recordingTableRows} className="mb-4" />
          <p className="text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>
      ),
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;

    try {
      if (deleteModal.type === "batch") {
        await deleteRecordingBatch(deleteModal.id);
        if (selectedPatient) {
          await handlePatientSelect(selectedPatient);
        }
        message.success("Recording session deleted successfully");
      } else if (deleteModal.type === "patient") {
        await deletePatient(deleteModal.id);
        await loadPatients();
        message.success("Patient deleted successfully");
        if (selectedPatient?.id === deleteModal.id) {
          setSelectedPatient(null);
          setPatientBatches([]);
          setExpandedBatches(new Set());
        }
      } else if (deleteModal.type === "recording") {
        await deleteRecording(deleteModal.id);
        if (selectedPatient) {
          await handlePatientSelect(selectedPatient);
        }
        message.success("Recording deleted successfully");
      }

      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting:", error);
      message.error(`Failed to delete ${deleteModal.type}`);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal(null);
  };

  const handleStopRecording = (recordingId: number) => {
    try {
      // Get the audio instance for this recording
      const audio = audioInstances.get(recordingId);
      const audioContext = audioContexts.get(recordingId);

      if (audio) {
        // Pause the audio
        audio.pause();

        // Reset to beginning for next playback
        audio.currentTime = 0;

        // Clean up progress interval
        const interval = progressIntervalRef.current.get(recordingId);
        if (interval) {
          clearInterval(interval);
          progressIntervalRef.current.delete(recordingId);
        }

        // Clean up the audio object
        const url = audio.src;
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }

        // Remove event listeners to prevent memory leaks
        // Note: Event listeners are automatically cleaned up when audio element is removed
      }

      // Clean up AudioContext
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(console.error);
      }

      // Update state - remove from playing set and audio instances
      setPlayingRecordings(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });

      setPausedRecordings(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });

      setAudioInstances(prev => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });

      setAudioAnalysers(prev => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });

      setAudioContexts(prev => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });

      setRecordingProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });

      console.log(`Stopped recording playback: ${recordingId}`);
      message.success("Recording stopped");

    } catch (error) {
      console.error('Error stopping recording:', error);
      message.error("Failed to stop recording");
    }
  };

  const handlePlayRecording = async (recording: any) => {
    // Check if already playing
    if (playingRecordings.has(recording.id)) {
      return;
    }

    console.log("Playing recording:", {
      id: recording.id,
      hasAudio: !!recording.audio,
      audioType: recording.audio?.constructor?.name,
      audioSize: recording.audio?.size,
    });

    if (!recording.audio) {
      console.error("No audio data found for recording:", recording.id);
      message.error("No audio data available for this recording.");
      return;
    }

    if (!(recording.audio instanceof Blob)) {
      console.error("Audio data is not a Blob:", typeof recording.audio);
      message.error("Audio data format is invalid.");
      return;
    }

    if (recording.audio.size === 0) {
      console.error("Audio blob is empty for recording:", recording.id);
      message.error("Audio recording is empty.");
      return;
    }

    try {
      // Add to playing set
      setPlayingRecordings((prev) => new Set(prev).add(recording.id));

      const url = URL.createObjectURL(recording.audio);
      const audio = new Audio(url);

      // Create AudioContext and AnalyserNode for waveform visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      // Create a media element source from the audio element
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      // Store the audio instance, analyser, and context for later control
      setAudioInstances((prev) => new Map(prev).set(recording.id, audio));
      setAudioAnalysers((prev) => new Map(prev).set(recording.id, analyser));
      setAudioContexts((prev) => new Map(prev).set(recording.id, audioContext));

      // Set up event listeners
      const cleanup = () => {
        URL.revokeObjectURL(url);
        
        // Clean up duration check timeout
        if ((audio as any)._durationCheckTimeout) {
          clearTimeout((audio as any)._durationCheckTimeout);
        }
        
        // Clean up progress interval
        const interval = progressIntervalRef.current.get(recording.id);
        if (interval) {
          clearInterval(interval);
          progressIntervalRef.current.delete(recording.id);
        }
        
        // Clean up AudioContext
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(console.error);
        }
        
        setPlayingRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recording.id);
          return newSet;
        });
        setPausedRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recording.id);
          return newSet;
        });
        setAudioInstances((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recording.id);
          return newMap;
        });
        setAudioAnalysers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recording.id);
          return newMap;
        });
        setAudioContexts((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recording.id);
          return newMap;
        });
        setRecordingProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recording.id);
          return newMap;
        });
      };

      const handleEnded = () => {
        cleanup();
      };

      const handleError = (e: Event) => {
        console.error("Audio playback error:", e);
        cleanup();
        message.error("Failed to play audio. The audio file may be corrupted.");
      };

      const handleLoadedMetadata = () => {
        const duration = audio.duration;
        // Validate duration - check for NaN, Infinity, or invalid values
        const validDuration = (isFinite(duration) && duration > 0 && !isNaN(duration)) 
          ? duration 
          : 0;
        
        setRecordingProgress((prev) => {
          const newMap = new Map(prev);
          newMap.set(recording.id, { current: 0, duration: validDuration });
          return newMap;
        });
      };

      const startProgressTracking = () => {
        const interval = setInterval(() => {
          // Use the audio variable from closure
          if (audio) {
            setRecordingProgress((prev) => {
              const newMap = new Map(prev);
              const current = newMap.get(recording.id);
              if (current) {
                const audioCurrentTime = isFinite(audio.currentTime) && !isNaN(audio.currentTime) 
                  ? audio.currentTime 
                  : 0;
                const audioDuration = isFinite(audio.duration) && audio.duration > 0 && !isNaN(audio.duration)
                  ? audio.duration
                  : current.duration; // Keep existing duration if new one is invalid
                
                newMap.set(recording.id, {
                  current: audioCurrentTime,
                  duration: audioDuration,
                });
              }
              return newMap;
            });
          }
        }, 100);
        progressIntervalRef.current.set(recording.id, interval);
      };

      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      
      // Also check duration after a short delay in case metadata loads after play starts
      // This helps with short recordings or recordings where metadata isn't immediately available
      const checkDurationDelayed = setTimeout(() => {
        if (audio.readyState >= 1) { // HAVE_METADATA or higher
          const duration = audio.duration;
          const validDuration = (isFinite(duration) && duration > 0 && !isNaN(duration)) 
            ? duration 
            : 0;
          
          if (validDuration > 0) {
            setRecordingProgress((prev) => {
              const newMap = new Map(prev);
              const current = newMap.get(recording.id);
              if (current) {
                newMap.set(recording.id, { 
                  current: current.current, 
                  duration: validDuration 
                });
              } else {
                newMap.set(recording.id, { current: 0, duration: validDuration });
              }
              return newMap;
            });
          }
        }
      }, 500);

      // Attempt to play
      await audio.play();
      
      // Start tracking progress
      startProgressTracking();
      
      // Clean up timeout on cleanup
      (audio as any)._durationCheckTimeout = checkDurationDelayed;
      
      console.log(
        "Audio playback started successfully for recording:",
        recording.id,
      );
      message.success("Playing recording...");
    } catch (error) {
      console.error("Failed to play recording:", error);
      setPlayingRecordings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recording.id);
        return newSet;
      });
      setAudioInstances((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recording.id);
        return newMap;
      });
      setAudioAnalysers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recording.id);
        return newMap;
      });
      setAudioContexts((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recording.id);
        return newMap;
      });

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        message.error(
          "Browser blocked audio playback. Please click the play button again or check your browser settings.",
        );
      } else {
        message.error(
          `Failed to play audio: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  };

  const handlePlayPauseRecording = async (recording: any) => {
    // Check if already playing - if so, pause it
    if (playingRecordings.has(recording.id)) {
      // Currently playing - pause it
      const audio = audioInstances.get(recording.id);
      if (audio) {
        audio.pause();
        setPlayingRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recording.id);
          return newSet;
        });
        setPausedRecordings((prev) => new Set(prev).add(recording.id));
        
        // Stop progress tracking
        const interval = progressIntervalRef.current.get(recording.id);
        if (interval) {
          clearInterval(interval);
          progressIntervalRef.current.delete(recording.id);
        }
      }
    } else if (pausedRecordings.has(recording.id)) {
      // Currently paused - resume it
      const audio = audioInstances.get(recording.id);
      if (audio) {
        await audio.play();
        setPausedRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recording.id);
          return newSet;
        });
        setPlayingRecordings((prev) => new Set(prev).add(recording.id));
        
        // Resume progress tracking
        const startProgressTracking = () => {
          const interval = setInterval(() => {
            if (audio) {
              setRecordingProgress((prev) => {
                const newMap = new Map(prev);
                const current = newMap.get(recording.id);
                if (current) {
                  const audioCurrentTime = isFinite(audio.currentTime) && !isNaN(audio.currentTime) 
                    ? audio.currentTime 
                    : 0;
                  const audioDuration = isFinite(audio.duration) && audio.duration > 0 && !isNaN(audio.duration)
                    ? audio.duration
                    : current.duration; // Keep existing duration if new one is invalid
                  
                  newMap.set(recording.id, {
                    current: audioCurrentTime,
                    duration: audioDuration,
                  });
                }
                return newMap;
              });
            }
          }, 100);
          progressIntervalRef.current.set(recording.id, interval);
        };
        startProgressTracking();
      }
    } else {
      // Not playing or paused - start playback
      await handlePlayRecording(recording);
    }
  };

  const handleSeekRecording = (recordingId: number, value: number) => {
    const audio = audioInstances.get(recordingId);
    if (audio) {
      // Validate the seek value
      const validValue = isFinite(value) && !isNaN(value) && value >= 0 
        ? value 
        : 0;
      
      // Clamp to duration if available
      const progress = recordingProgress.get(recordingId);
      const maxValue = progress && isFinite(progress.duration) && progress.duration > 0
        ? progress.duration
        : validValue;
      
      const clampedValue = Math.min(validValue, maxValue);
      
      audio.currentTime = clampedValue;
      setRecordingProgress((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(recordingId);
        if (current) {
          newMap.set(recordingId, {
            current: clampedValue,
            duration: current.duration,
          });
        }
        return newMap;
      });
    }
  };

  const handleDownloadRecording = (recording: any) => {
    if (!recording.audio || !(recording.audio instanceof Blob)) {
      message.error("No audio data available for download.");
      return;
    }

    try {
      const url = URL.createObjectURL(recording.audio);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recording-${selectedPatient?.name}-${recording.location}-${new Date(recording.start_time).toLocaleDateString()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success("Recording downloaded successfully.");
    } catch (error) {
      console.error("Failed to download recording:", error);
      message.error("Failed to download recording.");
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="patient-select-container">
      {/* Patients sidebar */}
      <div className="patients-sidebar">
        <GlassCard padding="md" className="glass-card">
          <h1 className="text-2xl mb-4 text-white font-semibold">Patients</h1>

          {/* Search input */}
          <div className="mb-4">
            <Input
              className="search-input"
              size="large"
              placeholder="Search patients..."
              prefix={<SearchOutlined className="text-white/60" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <GlassButton
              variant="primary"
              size="sm"
              icon={<PlusOutlined />}
              onClick={handleAddNewPatient}
              className="w-full"
            >
              Add New Patient
            </GlassButton>
          </div>

          {/* Patient list */}
          <div className="patients-list">
            {loading ? (
              <div className="text-center text-white/60 py-8">
                Loading patients...
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`patient-card ${selectedPatient?.id === patient.id ? "selected" : ""}`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="flex items-center">
                    <div className="patient-avatar">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="patient-details">
                      <p className="patient-name">{patient.name}</p>
                      <p className="patient-dob">
                        DOB:{" "}
                        {new Date(patient.dob).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Main patient details */}
      <div className="main-content">
        <GlassCard padding="lg" className="h-full overflow-y-auto">
          {/* Patient Header */}
          {selectedPatient ? (
            <div className="patient-header">
              <div className="patient-header-avatar">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <h1 className="patient-title">{selectedPatient.name}</h1>
              </div>
            </div>
          ) : (
            <div className="text-center text-white/60 py-8">
              Select a patient to view details
            </div>
          )}

          {/* Patient Information Grid */}
          {selectedPatient && (
            <div className="info-grid">
              <div className="info-section">
                <div className="info-item">
                  <p className="info-label">Date of Birth</p>
                  <p className="info-value">
                    {new Date(selectedPatient.dob).toLocaleDateString()}
                  </p>
                </div>
                <div className="info-item">
                  <p className="info-label">Height</p>
                  <p className="info-value">
                    {selectedPatient.patient_details.height}cm
                  </p>
                </div>
                <div className="info-item">
                  <p className="info-label">Weight</p>
                  <p className="info-value">
                    {selectedPatient.patient_details.weight}kg
                  </p>
                </div>
              </div>
              <div className="info-section">
                <div className="info-item">
                  <p className="info-label">Patient UID</p>
                  <p className="info-value">{selectedPatient.patient_uid}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Actions</p>
                  <div className="flex gap-2">
                    <Tooltip title="Delete Patient">
                      <GlassButton
                        variant="danger"
                        size="sm"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeletePatient(selectedPatient.id)}
                      />
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medical History Section */}
          {selectedPatient && (
            <div className="mb-8">
              <div className="section-header">
                <div className="section-dot"></div>
                <h2 className="section-title">Medical History</h2>
              </div>

              <div className="info-grid">
                <div className="info-section">
                  <div className="info-item">
                    <p className="info-label">Conditions</p>
                    <p className="info-value">
                      {selectedPatient.patient_details.conditions.length > 0
                        ? selectedPatient.patient_details.conditions.join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-item">
                    <p className="info-label">Medications</p>
                    <p className="info-value">
                      {selectedPatient.patient_details.medications.length > 0
                        ? selectedPatient.patient_details.medications.join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recording Sessions Section */}
          {selectedPatient && (
            <div>
              <div className="section-header">
                <div className="section-dot"></div>
                <h2 className="section-title">Recording Sessions</h2>
                <div className="ml-auto">
                  <GlassButton
                    size="sm"
                    variant="primary"
                    onClick={handleAddRecording}
                  >
                    New Recording Session
                  </GlassButton>
                </div>
              </div>

              <div className="recordings-list max-w-4xl mx-auto">
                {patientBatches.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    <HeartOutlined
                      style={{
                        fontSize: "48px",
                        marginBottom: "16px",
                        opacity: 0.3,
                      }}
                    />
                    <div>No recording sessions found.</div>
                    <div className="text-sm mt-2">
                      Click "New Recording Session" to start recording heart
                      sounds.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientBatches.map((batch) => {
                      const isBatchExpanded = expandedBatches.has(batch.id);
                      const progress = getBatchProgress(batch);
                      const statusColor = getBatchStatusColor(batch);

                      return (
                        <div key={batch.id} className="space-y-2">
                          {/* Batch Header */}
                          <div
                            className="recording-card cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => toggleBatchExpansion(batch.id)}
                          >
                            <div className="recording-info flex-1">
                              <div className="recording-header">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                    style={{ backgroundColor: statusColor }}
                                  >
                                    {batch.is_complete
                                      ? "✓"
                                      : progress.completed}
                                  </div>
                                  <div className="recording-type">
                                    Session #{batch.id}
                                  </div>
                                  <div
                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                    style={{
                                      backgroundColor: `${statusColor}20`,
                                      color: statusColor,
                                    }}
                                  >
                                    {batch.is_complete
                                      ? "Complete"
                                      : "In Progress"}
                                  </div>
                                </div>
                              </div>
                              <div className="recording-details">
                                <span className="recording-date">
                                  {new Date(
                                    batch.start_time,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    batch.start_time,
                                  ).toLocaleTimeString()}
                                </span>
                                <span className="mx-2">•</span>
                                <span className="text-white/70">
                                  {progress.completed}/{progress.total} heart
                                  areas
                                </span>
                              </div>
                              {batch.skin_barriers &&
                                batch.skin_barriers.length > 0 && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <ExclamationCircleOutlined className="text-yellow-500 text-xs" />
                                    <span className="text-yellow-500 text-xs">
                                      Barriers:{" "}
                                      {batch.skin_barriers
                                        .map(
                                          (barrier) =>
                                            `${barrier.level} ${barrier.option}`,
                                        )
                                        .join(", ")}
                                    </span>
                                  </div>
                                )}
                              {progress.percentage > 0 &&
                                progress.percentage < 100 && (
                                  <div className="mt-2 w-full max-w-xs">
                                    <div className="w-full bg-white/20 rounded-full h-1">
                                      <div
                                        className="h-1 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${progress.percentage}%`,
                                          backgroundColor: statusColor,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className={`transform transition-transform cursor-pointer ${isBatchExpanded ? "rotate-180" : ""}`}
                              >
                                ▼
                              </div>
                              <div className="recording-actions flex items-center gap-2">
                                {!batch.is_complete &&
                                  progress.completed > 0 && (
                                    <Tooltip title="Resume Recording Session">
                                      <GlassButton
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleResumeBatch(batch)}
                                      >
                                        Resume
                                      </GlassButton>
                                    </Tooltip>
                                  )}
                                <Tooltip title="Delete Recording Session">
                                  <GlassButton
                                    size="sm"
                                    variant="danger"
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteBatch(batch.id)}
                                  />
                                </Tooltip>
                                <GlassButton size="sm" variant="secondary">
                                  View
                                </GlassButton>
                              </div>
                            </div>
                          </div>

                          {/* Individual Recordings */}
                          {isBatchExpanded && (
                            <div className="ml-6 space-y-2 flex flex-col items-center">
                              {batch.recordings &&
                              batch.recordings.length > 0 ? (
                                batch.recordings.map((recording) => (
                                  <GlassCard
                                    key={recording.id}
                                    padding="sm"
                                    className="w-[90%]"
                                  >
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-2">
                                            <h5 className="text-white font-medium">
                                              {recording.location} Valve
                                            </h5>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                              <span className="text-white/70">
                                                {new Date(
                                                  recording.start_time,
                                                ).toLocaleDateString()}{" "}
                                                at{" "}
                                                {new Date(
                                                  recording.start_time,
                                                ).toLocaleTimeString()}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-white/70">
                                                30s recording
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="recording-actions flex items-center gap-2 ml-4">
                                      <Tooltip
                                        title={
                                          playingRecordings.has(recording.id)
                                            ? "Pause Recording"
                                            : pausedRecordings.has(recording.id)
                                              ? "Resume Recording"
                                              : "Play Recording"
                                        }
                                      >
                                        <GlassButton
                                          size="sm"
                                          variant="secondary"
                                          icon={
                                            playingRecordings.has(recording.id) ? (
                                              <PauseCircleOutlined
                                                className="text-green-400"
                                              />
                                            ) : pausedRecordings.has(recording.id) ? (
                                              <PlayCircleOutlined
                                                className="text-yellow-400"
                                              />
                                            ) : (
                                              <PlayCircleOutlined />
                                            )
                                          }
                                          onClick={() =>
                                            handlePlayPauseRecording(recording)
                                          }
                                        />
                                      </Tooltip>
                                      <Tooltip title="Download">
                                        <GlassButton
                                          size="sm"
                                          variant="secondary"
                                          icon={<DownloadOutlined />}
                                          onClick={() =>
                                            handleDownloadRecording(recording)
                                          }
                                        />
                                      </Tooltip>
                                      <Tooltip title="Delete Recording">
                                        <GlassButton
                                          size="sm"
                                          variant="danger"
                                          icon={<DeleteOutlined />}
                                          onClick={() =>
                                            handleDeleteIndividualRecording(
                                              recording.id,
                                            )
                                          }
                                        />
                                      </Tooltip>
                                    </div>
                                    </div>
                                    
                                    {/* Waveform visualization when playing or paused */}
                                    {(playingRecordings.has(recording.id) || pausedRecordings.has(recording.id)) && (
                                      <div className="mt-3 w-full flex flex-col items-center gap-3">
                                        <div className="w-full flex justify-center">
                                          <AudioWaveform
                                            isActive={playingRecordings.has(recording.id)}
                                            analyser={audioAnalysers.get(recording.id) || null}
                                          />
                                        </div>
                                        
                                        {/* Seek control */}
                                        {(() => {
                                          const progress = recordingProgress.get(recording.id);
                                          // Validate duration - must be finite, positive, and not NaN
                                          const isValidDuration = progress && 
                                            isFinite(progress.duration) && 
                                            progress.duration > 0 && 
                                            !isNaN(progress.duration);
                                          
                                          if (isValidDuration) {
                                            const formatTime = (seconds: number) => {
                                              // Handle invalid values
                                              if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
                                                return "0:00";
                                              }
                                              const mins = Math.floor(seconds / 60);
                                              const secs = Math.floor(seconds % 60);
                                              return `${mins}:${secs.toString().padStart(2, '0')}`;
                                            };
                                            
                                            return (
                                              <div className="w-full max-w-md px-4">
                                                <Slider
                                                  min={0}
                                                  max={progress.duration}
                                                  value={Math.min(progress.current, progress.duration)}
                                                  onChange={(value) => handleSeekRecording(recording.id, value)}
                                                  tooltip={{
                                                    formatter: (value) => formatTime(value || 0),
                                                  }}
                                                  styles={{
                                                    track: { backgroundColor: 'rgba(140, 125, 209, 0.5)' },
                                                    rail: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                                                    handle: { borderColor: 'rgba(140, 125, 209, 0.8)' },
                                                  }}
                                                />
                                                <div className="flex justify-between text-xs text-white/70 mt-1">
                                                  <span>{formatTime(progress.current)}</span>
                                                  <span>{formatTime(progress.duration)}</span>
                                                </div>
                                              </div>
                                            );
                                          }
                                          // Show waveform even if duration is not available yet
                                          return null;
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                  </GlassCard>
                                ))
                              ) : (
                                <div className="text-center text-white/50 py-4 text-sm">
                                  No individual recordings in this session yet
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>
        <div className="mb-16"></div>
      </div>

      {/* New Patient Modal */}
      <Modal
        title="Add New Patient"
        open={showNewPatientModal}
        onOk={handleCreatePatient}
        onCancel={handleModalCancel}
        width={600}
        okText="Create Patient"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="Patient Name *"
            rules={[
              { required: true, message: "Please enter patient name" },
              { min: 2, message: "Name must be at least 2 characters" },
            ]}
          >
            <Input placeholder="Enter patient's full name" />
          </Form.Item>

          <Form.Item
            name="dob"
            label="Date of Birth *"
            rules={[{ required: true, message: "Please select date of birth" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Select date of birth"
              disabledDate={(current) => current && current > dayjs()}
            />
          </Form.Item>

          <Form.Item
            name="patient_uid"
            label="Patient UID *"
            rules={[
              { required: true, message: "Please enter patient UID" },
              { min: 3, message: "Patient UID must be at least 3 characters" },
            ]}
          >
            <Input placeholder="Unique patient identifier" />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Form.Item
              name="height"
              label="Height (cm) *"
              rules={[
                { required: true, message: "Please enter height" },
                {
                  type: "number",
                  min: 50,
                  max: 250,
                  message: "Height must be between 50-250 cm",
                },
              ]}
            >
              <Input type="number" placeholder="Height in cm" />
            </Form.Item>

            <Form.Item
              name="weight"
              label="Weight (kg) *"
              rules={[
                { required: true, message: "Please enter weight" },
                {
                  type: "number",
                  min: 10,
                  max: 300,
                  message: "Weight must be between 10-300 kg",
                },
              ]}
            >
              <Input type="number" placeholder="Weight in kg" />
            </Form.Item>
          </div>

          <Form.Item
            name="medications"
            label="Current Medications"
            extra="Enter medications separated by commas"
          >
            <Input.TextArea
              placeholder="e.g., Aspirin 81mg, Lisinopril 10mg, Metformin 500mg"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="conditions"
            label="Medical Conditions"
            extra="Enter conditions separated by commas"
          >
            <Input.TextArea
              placeholder="e.g., Hypertension, Diabetes Type 2, Atrial Fibrillation"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Additional Notes"
            extra="Any additional medical notes or observations"
          >
            <Input.TextArea
              placeholder="Additional medical history, allergies, or notes"
              rows={2}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={deleteModal?.open || false}
        title={deleteModal?.title || ""}
        content={deleteModal?.content}
        type="danger"
        confirmText={
          deleteModal?.type === "patient"
            ? "Delete Patient"
            : deleteModal?.type === "recording"
              ? "Delete Recording"
              : "Delete Session"
        }
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default PatientList;
