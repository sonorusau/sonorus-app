import React, { useState, useEffect } from "react";
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
import useAudioPlayback from "../hooks/useAudioPlayback";
import { PatientCardSkeleton, PatientDetailSkeleton, RecordingCardSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
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
  const {
    playingRecordings,
    pausedRecordings,
    audioAnalysers,
    recordingProgress,
    playRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    seekRecording,
    togglePlayPause,
  } = useAudioPlayback();

  useEffect(() => {
    loadPatients();
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
    stopRecording(recordingId);
    message.success("Recording stopped");
  };

  const handlePlayPauseRecording = async (recording: any) => {
    if (!recording.audio) {
      message.error("No audio data available for this recording.");
      return;
    }
    await togglePlayPause(recording.id, recording.audio);
  };

  const handleSeekRecording = (recordingId: number, value: number) => {
    seekRecording(recordingId, value);
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
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <PatientCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <EmptyState
                type="patients"
                title={searchTerm ? "No matching patients" : "No patients yet"}
                description={searchTerm ? "Try a different search term" : "Add your first patient to start recording heart sounds."}
                actionLabel={!searchTerm ? "Add New Patient" : undefined}
                onAction={!searchTerm ? handleAddNewPatient : undefined}
              />
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
          {loading ? (
            <PatientDetailSkeleton />
          ) : selectedPatient ? (
            <>
              {/* Patient Header */}
              <div className="patient-header">
                <div className="patient-header-avatar">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="patient-title text-heading">{selectedPatient.name}</h1>
                  <p className="text-white/60 text-sm">
                    Patient ID: {selectedPatient.patient_uid}
                  </p>
                </div>
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
            </>
          ) : (
            <EmptyState
              type="generic"
              title="Select a patient"
              description="Choose a patient from the list to view their details and recording history."
            />
          )}

          {/* Quick Stats Row */}
          {selectedPatient && !loading && (
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { value: patientBatches.length, label: "Sessions" },
                { value: patientBatches.reduce((acc, b) => acc + (b.recordings?.length || 0), 0), label: "Recordings" },
                { value: `${selectedPatient.patient_details.height}cm`, label: "Height" },
                { value: `${selectedPatient.patient_details.weight}kg`, label: "Weight" },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="rounded-xl p-4 text-center border border-white/[0.08]"
                  style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }}
                >
                  <p className="text-xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Patient Details Section */}
          {selectedPatient && !loading && (
            <section className="border border-white/10 rounded-xl overflow-hidden mb-8">
              <div className="bg-white/5 px-5 py-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-white/90 uppercase tracking-wide">
                  Patient Details
                </h2>
              </div>
              <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-label text-white/50 mb-1">Date of Birth</p>
                  <p className="text-white">{new Date(selectedPatient.dob).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-label text-white/50 mb-1">Patient UID</p>
                  <p className="text-white font-mono text-sm">{selectedPatient.patient_uid}</p>
                </div>
                <div>
                  <p className="text-label text-white/50 mb-1">Conditions</p>
                  <p className="text-white">
                    {selectedPatient.patient_details.conditions.length > 0
                      ? selectedPatient.patient_details.conditions.join(", ")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-label text-white/50 mb-1">Medications</p>
                  <p className="text-white">
                    {selectedPatient.patient_details.medications.length > 0
                      ? selectedPatient.patient_details.medications.join(", ")
                      : "—"}
                  </p>
                </div>
              </div>
            </section>
          )}


          {/* Recording Sessions Section */}
          {selectedPatient && !loading && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 text-heading">
                  <HeartOutlined className="text-purple-400" />
                  Recording Sessions
                </h2>
                <GlassButton
                  size="sm"
                  variant="primary"
                  onClick={handleAddRecording}
                >
                  New Session
                </GlassButton>
              </div>

              <div className="recordings-list max-w-4xl mx-auto">
                {patientBatches.length === 0 ? (
                  <EmptyState
                    type="recordings"
                    title="No recording sessions"
                    description="Start a new recording session to capture heart sounds for this patient."
                    actionLabel="Start Recording"
                    onAction={handleAddRecording}
                  />
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
            </section>
          )}
        </GlassCard>
        <div className="mb-16"></div>
      </div>

      {/* New Patient Modal - Enhanced */}
      <Modal
        open={showNewPatientModal}
        onCancel={handleModalCancel}
        footer={null}
        width={640}
        centered
        closable={true}
        maskClosable={false}
        className="new-patient-modal"
        maskStyle={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
        }}
      >
        <div className="p-2">
          {/* Modal Header */}
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgb(116, 74, 161)" }}
            >
              <PlusOutlined className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white m-0 text-heading">
                Add New Patient
              </h2>
              <p className="text-white/60 text-sm m-0 mt-1">
                Enter patient information to create a new record
              </p>
            </div>
          </div>

          <Form form={form} layout="vertical" requiredMark={false} className="new-patient-form">
            {/* Basic Information Section */}
            <div className="form-section mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Basic Information
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="name"
                  label={<span className="text-white/90 font-medium">Full Name</span>}
                  rules={[
                    { required: true, message: "Please enter patient name" },
                    { min: 2, message: "Name must be at least 2 characters" },
                  ]}
                  className="col-span-2"
                >
                  <Input 
                    placeholder="Enter patient's full name" 
                    size="large"
                    className="modal-input"
                  />
                </Form.Item>

                <Form.Item
                  name="dob"
                  label={<span className="text-white/90 font-medium">Date of Birth</span>}
                  rules={[{ required: true, message: "Please select date of birth" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    size="large"
                    placeholder="Select date"
                    disabledDate={(current) => current && current > dayjs()}
                    className="modal-input"
                  />
                </Form.Item>

                <Form.Item
                  name="patient_uid"
                  label={<span className="text-white/90 font-medium">Patient ID</span>}
                  rules={[
                    { required: true, message: "Please enter patient ID" },
                    { min: 3, message: "ID must be at least 3 characters" },
                  ]}
                >
                  <Input 
                    placeholder="Unique identifier" 
                    size="large"
                    className="modal-input"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Physical Measurements Section */}
            <div className="form-section mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Physical Measurements
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="height"
                  label={<span className="text-white/90 font-medium">Height</span>}
                  rules={[
                    { required: true, message: "Required" },
                    {
                      type: "number",
                      min: 50,
                      max: 250,
                      message: "50-250 cm",
                    },
                  ]}
                >
                  <Input 
                    type="number" 
                    placeholder="Height" 
                    size="large"
                    suffix={<span className="text-white/40">cm</span>}
                    className="modal-input"
                  />
                </Form.Item>

                <Form.Item
                  name="weight"
                  label={<span className="text-white/90 font-medium">Weight</span>}
                  rules={[
                    { required: true, message: "Required" },
                    {
                      type: "number",
                      min: 10,
                      max: 300,
                      message: "10-300 kg",
                    },
                  ]}
                >
                  <Input 
                    type="number" 
                    placeholder="Weight" 
                    size="large"
                    suffix={<span className="text-white/40">kg</span>}
                    className="modal-input"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Medical History Section */}
            <div className="form-section mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Medical History
                </span>
                <span className="text-xs text-white/40 ml-auto">Optional</span>
              </div>
              
              <div className="space-y-4">
                <Form.Item
                  name="conditions"
                  label={<span className="text-white/90 font-medium">Medical Conditions</span>}
                >
                  <Input.TextArea
                    placeholder="e.g., Hypertension, Diabetes Type 2, Atrial Fibrillation"
                    rows={2}
                    className="modal-input"
                  />
                  <p className="text-white/40 text-xs mt-1">Separate multiple conditions with commas</p>
                </Form.Item>

                <Form.Item
                  name="medications"
                  label={<span className="text-white/90 font-medium">Current Medications</span>}
                >
                  <Input.TextArea
                    placeholder="e.g., Aspirin 81mg, Lisinopril 10mg, Metformin 500mg"
                    rows={2}
                    className="modal-input"
                  />
                  <p className="text-white/40 text-xs mt-1">Include dosage if known</p>
                </Form.Item>

                <Form.Item
                  name="notes"
                  label={<span className="text-white/90 font-medium">Additional Notes</span>}
                >
                  <Input.TextArea
                    placeholder="Allergies, special considerations, or other relevant information"
                    rows={2}
                    className="modal-input"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <GlassButton
                variant="secondary"
                onClick={handleModalCancel}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleCreatePatient}
                icon={<PlusOutlined />}
              >
                Create Patient
              </GlassButton>
            </div>
          </Form>
        </div>
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
