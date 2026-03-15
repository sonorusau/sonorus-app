import React, { useState, useEffect } from "react";
import { Input, Select, DatePicker, Space, Tooltip, Modal } from "antd";
import { message } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  HeartOutlined,
  CalendarOutlined,
  UserOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import ConfirmationModal, {
  GlassTable,
  type TableRow,
} from "../components/ConfirmationModal";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";
import type Recording from "../types/Recording";
import type RecordingBatch from "../types/RecordingBatch";
import type Patient from "../types/Patient";
import type HeartLocation from "../types/HeartLocation";
import HeartLocationEnum from "../types/HeartLocation";
import type Label from "../types/Label";
import LabelEnum from "../types/Label";
import {
  getExtendedRecordings,
  deleteRecording,
  deleteRecordingBatch,
  getGroupedExtendedRecordings,
  getGroupedRecordingBatches,
  getPatients,
  type ExtendedRecording,
} from "../utils/storage";
import { buildRecordingExportPayloads } from "../utils/exportRecordings";

const { RangePicker } = DatePicker;
const { Option } = Select;

// ExtendedRecording is now imported from storage utils

// Mock recordings removed - now using IndexedDB storage

interface GroupedRecordingData {
  patients: Record<number, Patient>;
  batches: Record<number, RecordingBatch[]>;
  recordings: Record<number, Record<number, ExtendedRecording[]>>;
}

function RecordingsList(): JSX.Element {
  const navigate = useNavigate();
  const [groupedData, setGroupedData] = useState<GroupedRecordingData>({
    patients: {},
    batches: {},
    recordings: {},
  });
  const [filteredData, setFilteredData] = useState<GroupedRecordingData>({
    patients: {},
    batches: {},
    recordings: {},
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [heartAreaFilter, setHeartAreaFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(
    new Set(),
  );
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(
    new Set(),
  );
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "recording" | "batch";
    id: number;
    patientId?: number;
    title: string;
    content: React.ReactNode;
  } | null>(null);
  const [playingRecordings, setPlayingRecordings] = useState<Set<number>>(
    new Set(),
  );
  const [audioInstances, setAudioInstances] = useState<Map<number, HTMLAudioElement>>(
    new Map(),
  );
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    filterRecordings();
  }, [groupedData, searchTerm, statusFilter, heartAreaFilter, dateRange]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const [patients, groupedBatches, groupedRecordings] = await Promise.all([
        getPatients(),
        getGroupedRecordingBatches(),
        getGroupedExtendedRecordings(),
      ]);

      const patientsMap: Record<number, Patient> = {};
      patients.forEach((patient) => {
        patientsMap[patient.id] = patient;
      });

      setGroupedData({
        patients: patientsMap,
        batches: groupedBatches,
        recordings: groupedRecordings,
      });

      // Auto-expand first patient and first batch for better UX
      const firstPatientId = Object.keys(groupedBatches)[0];
      if (firstPatientId) {
        const patientId = parseInt(firstPatientId);
        setExpandedPatients(new Set([patientId]));
        const firstBatch = groupedBatches[patientId]?.[0];
        if (firstBatch) {
          setExpandedBatches(new Set([firstBatch.id]));
        }
      }
    } catch (error) {
      console.error("Error loading recordings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportRecordings = async () => {
    try {
      setExporting(true);
      const payloads = await buildRecordingExportPayloads();

      if (!payloads.length) {
        message.info("No recordings available to export.");
        return;
      }

      const result = await window.api.exportRecordings(payloads);

      if (result.success) {
        const count = result.writtenFiles ?? 0;
        message.success(
          `Exported ${count} recording${count === 1 ? "" : "s"} successfully.`,
        );
      } else if (result.canceled) {
        message.info("Export cancelled.");
      } else {
        message.error(result.error ?? "Failed to export recordings.");
      }
    } catch (error) {
      console.error("Error exporting recordings:", error);
      message.error("Failed to export recordings.");
    } finally {
      setExporting(false);
    }
  };

  const filterRecordings = () => {
    const filteredPatients: Record<number, Patient> = {};
    const filteredBatches: Record<number, RecordingBatch[]> = {};
    const filteredRecordingsData: Record<
      number,
      Record<number, ExtendedRecording[]>
    > = {};

    // Apply filters to each patient's recordings
    Object.entries(groupedData.recordings).forEach(
      ([patientIdStr, patientBatches]) => {
        const patientId = parseInt(patientIdStr);
        const patient = groupedData.patients[patientId];

        if (!patient) return;

        let hasMatchingRecordings = false;
        const patientFilteredBatches: RecordingBatch[] = [];
        const patientFilteredRecordings: Record<number, ExtendedRecording[]> =
          {};

        Object.entries(patientBatches).forEach(
          ([batchIdStr, batchRecordings]) => {
            const batchId = parseInt(batchIdStr);
            const batch = groupedData.batches[patientId]?.find(
              (b) => b.id === batchId,
            );

            if (!batch) return;

            let batchFilteredRecordings = batchRecordings;

            // Apply search filter
            if (searchTerm) {
              batchFilteredRecordings = batchFilteredRecordings.filter(
                (recording) =>
                  recording.patientName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  recording.location
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
              );
            }

            // Apply status filter
            if (statusFilter !== "all") {
              batchFilteredRecordings = batchFilteredRecordings.filter(
                (recording) => recording.status === statusFilter,
              );
            }

            // Apply heart area filter
            if (heartAreaFilter !== "all") {
              batchFilteredRecordings = batchFilteredRecordings.filter(
                (recording) => recording.location === heartAreaFilter,
              );
            }

            // Apply date range filter
            if (dateRange) {
              batchFilteredRecordings = batchFilteredRecordings.filter(
                (recording) => {
                  const recordingDate = dayjs(recording.date);
                  return (
                    recordingDate.isAfter(dateRange[0]) &&
                    recordingDate.isBefore(dateRange[1])
                  );
                },
              );
            }

            // If this batch has matching recordings, include it
            if (batchFilteredRecordings.length > 0) {
              hasMatchingRecordings = true;
              patientFilteredBatches.push(batch);
              patientFilteredRecordings[batchId] = batchFilteredRecordings;
            }
          },
        );

        // If this patient has matching recordings, include them
        if (hasMatchingRecordings) {
          filteredPatients[patientId] = patient;
          filteredBatches[patientId] = patientFilteredBatches;
          filteredRecordingsData[patientId] = patientFilteredRecordings;
        }
      },
    );

    setFilteredData({
      patients: filteredPatients,
      batches: filteredBatches,
      recordings: filteredRecordingsData,
    });
  };

  const getHeartAreaIcon = (area: string) => {
    // Return empty string - no emojis for heart areas
    return "";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "flagged":
        return "#f59e0b";
      case "processing":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getResultColor = (result: Label) => {
    switch (result) {
      case LabelEnum.Normal:
        return "#10b981";
      case LabelEnum.Abnormal:
        return "#ef4444";
      case LabelEnum.Unknown:
        return "#f59e0b";
      case LabelEnum.Unlabelled:
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const togglePatientExpansion = (patientId: number) => {
    const newExpanded = new Set(expandedPatients);
    if (newExpanded.has(patientId)) {
      newExpanded.delete(patientId);
      // Also collapse all batches for this patient
      const patientBatches = filteredData.batches[patientId] || [];
      const newExpandedBatches = new Set(expandedBatches);
      patientBatches.forEach((batch) => {
        newExpandedBatches.delete(batch.id);
      });
      setExpandedBatches(newExpandedBatches);
    } else {
      newExpanded.add(patientId);
    }
    setExpandedPatients(newExpanded);
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

  const handleDeleteRecording = async (id: number) => {
    // Find the recording details for the confirmation dialog
    let recordingToDelete: ExtendedRecording | undefined;

    Object.values(groupedData.recordings).forEach((patientBatches) => {
      Object.values(patientBatches).forEach((batchRecordings) => {
        const found = batchRecordings.find((r) => r.id === id);
        if (found) recordingToDelete = found;
      });
    });

    if (!recordingToDelete) return;

    const tableRows: TableRow[] = [
      {
        label: "Heart Valve",
        value: `${formatHeartArea(recordingToDelete.location)} Valve`,
      },
      { label: "Patient", value: recordingToDelete.patientName },
      { label: "Date", value: recordingToDelete.time },
      { label: "Duration", value: recordingToDelete.duration },
    ];

    setDeleteModal({
      open: true,
      type: "recording",
      id,
      title: "Delete Recording?",
      content: (
        <div>
          <p className="text-white/90 mb-4">This will permanently delete:</p>
          <GlassTable rows={tableRows} className="mb-4" />
          <p className="text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>
      ),
    });
  };

  const handleResumeBatch = (batch: RecordingBatch) => {
    const patient = groupedData.patients[batch.patient.id];
    if (patient) {
      navigate("/quick-scan", {
        state: {
          patient: patient,
          resumeBatch: batch,
        },
      });
    }
  };

  const handleDeleteBatch = async (batchId: number, patientId: number) => {
    const patient = groupedData.patients[patientId];
    const batch = groupedData.batches[patientId]?.find((b) => b.id === batchId);

    if (!batch || !patient) return;

    const recordingCount = batch.recordings?.length || 0;
    const batchDate = new Date(batch.start_time).toLocaleDateString();

    const batchTableRows: TableRow[] = [
      { label: "Session", value: `Session #${batchId} from ${batchDate}` },
      { label: "Patient", value: patient.name },
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
      patientId,
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

  const handlePlayRecording = async (recording: ExtendedRecording) => {
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
      alert("No audio data available for this recording.");
      return;
    }

    if (!(recording.audio instanceof Blob)) {
      console.error("Audio data is not a Blob:", typeof recording.audio);
      alert("Audio data format is invalid.");
      return;
    }

    if (recording.audio.size === 0) {
      console.error("Audio blob is empty for recording:", recording.id);
      alert("Audio recording is empty.");
      return;
    }

    try {
      // Add to playing set
      setPlayingRecordings((prev) => new Set(prev).add(recording.id));

      const url = URL.createObjectURL(recording.audio);
      const audio = new Audio(url);

      // Store the audio instance for later pause/stop control
      setAudioInstances((prev) => new Map(prev).set(recording.id, audio));

      // Set up event listeners
      const cleanup = () => {
        URL.revokeObjectURL(url);
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
      };

      // Store cleanup functions on the audio object for later reference
      audio.onended = cleanup;
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        cleanup();
        alert("Failed to play audio. The audio file may be corrupted.");
      };

      audio.addEventListener("ended", audio.onended);
      audio.addEventListener("error", audio.onerror);

      // Attempt to play
      await audio.play();
      console.log(
        "Audio playback started successfully for recording:",
        recording.id,
      );
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

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert(
          "Browser blocked audio playback. Please click the play button again or check your browser settings.",
        );
      } else {
        alert(
          `Failed to play audio: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  };

  const handlePlayPauseRecording = async (recording: ExtendedRecording) => {
    // Check if already playing - if so, stop it; if not, play it
    if (playingRecordings.has(recording.id)) {
      // Currently playing - stop/pause it
      handleStopRecording(recording.id);
    } else {
      // Not playing - start playback
      await handlePlayRecording(recording);
    }
  };

  const handleDownloadRecording = (recording: ExtendedRecording) => {
    if (recording.audio && recording.audio instanceof Blob) {
      const url = URL.createObjectURL(recording.audio);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recording-${recording.patientName}-${recording.location}-${recording.date}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const formatHeartArea = (area: string) => {
    return area.charAt(0).toUpperCase() + area.slice(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;

    try {
      if (deleteModal.type === "recording") {
        await deleteRecording(deleteModal.id);
      } else if (deleteModal.type === "batch") {
        await deleteRecordingBatch(deleteModal.id);
      }

      // Close modal first, then reload data
      setDeleteModal(null);
      await loadRecordings(); // Reload the data
    } catch (error) {
      console.error("Error deleting:", error);
      // Keep modal open on error so user can try again or cancel
      alert("Failed to delete. Please try again.");
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal(null);
  };

  const handleStopRecording = (recordingId: number) => {
    try {
      // Get the audio instance for this recording
      const audio = audioInstances.get(recordingId);

      if (audio) {
        // Pause the audio
        audio.pause();

        // Reset to beginning for next playback
        audio.currentTime = 0;

        // Clean up the audio object
        const url = audio.src;
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }

        // Remove event listeners to prevent memory leaks
        if (audio.onended) {
          audio.removeEventListener("ended", audio.onended);
        }
        if (audio.onerror) {
          audio.removeEventListener(
            "error",
            audio.onerror as EventListenerOrEventListenerObject,
          );
        }
      }

      // Update state - remove from playing set and audio instances
      setPlayingRecordings(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });

      setAudioInstances(prev => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });

      console.log(`Stopped recording playback: ${recordingId}`);

    } catch (error) {
      console.error('Error stopping recording:', error);
      alert("Failed to stop recording");
    }
  };

  return (
    <div className="recordings-list-container max-w-4xl mx-auto">
      <div className="mb-6">
        <Title level={2} style={{ color: "white", margin: 0 }}>
          All Recordings
        </Title>
        <p className="text-white/70 text-lg mt-2">
          View and manage all heart sound recordings across all patients
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <GlassButton
            variant="secondary"
            size="sm"
            icon={<ReloadOutlined />}
            onClick={loadRecordings}
          >
            Refresh
          </GlassButton>
          <GlassButton
            size="sm"
            icon={<DownloadOutlined />}
            onClick={handleExportRecordings}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Recordings"}
          </GlassButton>
        </div>
      </div>

      {/* Filters */}
      <GlassCard padding="md" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-white/70 text-sm block mb-2">Search</label>
            <Input
              placeholder="Search by patient or heart area..."
              prefix={<SearchOutlined className="text-white/60" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              size="large"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">Status</label>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full recordings-list-status-select"
              size="large"
            >
              <Option value="all">All Statuses</Option>
              <Option value="completed">Completed</Option>
              <Option value="flagged">Flagged</Option>
              <Option value="processing">Processing</Option>
            </Select>
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">
              Heart Area
            </label>
            <Select
              value={heartAreaFilter}
              onChange={setHeartAreaFilter}
              className="w-full recordings-list-heart-area-select"
              size="large"
            >
              <Option value="all">All Areas</Option>
              <Option value={HeartLocationEnum.Aortic}>Aortic</Option>
              <Option value={HeartLocationEnum.Pulmonary}>Pulmonary</Option>
              <Option value={HeartLocationEnum.Tricuspid}>Tricuspid</Option>
              <Option value={HeartLocationEnum.Mitral}>Mitral</Option>
            </Select>
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">
              Date Range
            </label>
            <RangePicker
              value={dateRange}
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
              className="w-full recordings-list-date-picker"
              size="large"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20">
          <span className="text-white/60">
            Showing {Object.keys(filteredData.patients).length} patients with{" "}
            {Object.values(filteredData.recordings).reduce(
              (total, patientBatches) =>
                total +
                Object.values(patientBatches).reduce(
                  (batchTotal, batchRecordings) =>
                    batchTotal + batchRecordings.length,
                  0,
                ),
              0,
            )}{" "}
            recordings
          </span>
          <GlassButton
            variant="secondary"
            size="sm"
            icon={<FilterOutlined />}
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setHeartAreaFilter("all");
              setDateRange(null);
            }}
          >
            Clear Filters
          </GlassButton>
        </div>
      </GlassCard>

      {/* Grouped Recordings Display */}
      <div className="space-y-6 mb-16">
        {loading ? (
          <GlassCard padding="lg">
            <div className="text-center text-white/60 py-8">
              Loading recordings...
            </div>
          </GlassCard>
        ) : Object.keys(filteredData.patients).length === 0 ? (
          <GlassCard padding="lg">
            <div className="text-center text-white/60 py-8">
              {Object.keys(groupedData.patients).length === 0 ? (
                <div>
                  <HeartOutlined
                    style={{
                      fontSize: "48px",
                      marginBottom: "16px",
                      opacity: 0.3,
                    }}
                  />
                  <div className="text-lg mb-2">No recordings found</div>
                  <div className="text-sm">
                    Start a recording session to see recordings here
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-lg mb-2">
                    No recordings match your criteria
                  </div>
                  <div className="text-sm">
                    Try adjusting your filters or search terms
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        ) : (
          // Patient Groups
          Object.entries(filteredData.patients).map(
            ([patientIdStr, patient]) => {
              const patientId = parseInt(patientIdStr);
              const isPatientExpanded = expandedPatients.has(patientId);
              const patientBatches = filteredData.batches[patientId] || [];
              const totalRecordings = Object.values(
                filteredData.recordings[patientId] || {},
              ).reduce((total, recordings) => total + recordings.length, 0);

              return (
                <div key={patientId} className="space-y-3">
                  {/* Patient Header */}
                  <GlassCard
                    padding="md"
                    className="cursor-pointer hover:scale-[1.01] transition-transform"
                  >
                    <div
                      className="flex items-center justify-between"
                      onClick={() => togglePatientExpansion(patientId)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-white text-xl font-semibold">
                            {patient.name}
                          </h3>
                          <div className="text-white/60 text-sm">
                            {patientBatches.length} recording session
                            {patientBatches.length !== 1 ? "s" : ""} •{" "}
                            {totalRecordings} recording
                            {totalRecordings !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-white/60 text-sm">
                          {isPatientExpanded
                            ? "Click to collapse"
                            : "Click to expand"}
                        </div>
                        <div
                          className={`transform transition-transform ${isPatientExpanded ? "rotate-180" : ""}`}
                        >
                          ▼
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Patient's Recording Batches */}
                  {isPatientExpanded && (
                    <div className="space-y-3 flex flex-col items-center">
                      {patientBatches.map((batch) => {
                        const isBatchExpanded = expandedBatches.has(batch.id);
                        const batchRecordings =
                          filteredData.recordings[patientId]?.[batch.id] || [];
                        const progress = getBatchProgress(batch);
                        const statusColor = getBatchStatusColor(batch);

                        return (
                          <div key={batch.id} className="space-y-2 w-[90%]">
                            {/* Batch Header */}
                            <GlassCard
                              padding="md"
                              className="cursor-pointer hover:scale-[1.005] transition-transform"
                            >
                              <div
                                className="flex items-center justify-between"
                                onClick={() => toggleBatchExpansion(batch.id)}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                    style={{ backgroundColor: statusColor }}
                                  >
                                    {batch.is_complete
                                      ? "✓"
                                      : progress.completed}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-white font-medium">
                                        Recording Session #{batch.id}
                                      </h4>
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
                                    <div className="flex items-center gap-6 text-sm text-white/70">
                                      <div className="flex items-center gap-2">
                                        <CalendarOutlined className="text-white/60" />
                                        <span>
                                          {new Date(
                                            batch.start_time,
                                          ).toLocaleDateString()}{" "}
                                          at{" "}
                                          {new Date(
                                            batch.start_time,
                                          ).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <HeartOutlined className="text-white/60" />
                                        <span>
                                          {progress.completed}/{progress.total}{" "}
                                          areas
                                        </span>
                                      </div>
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
                                          <div className="w-full bg-white/20 rounded-full h-1.5">
                                            <div
                                              className="h-1.5 rounded-full transition-all duration-300"
                                              style={{
                                                width: `${progress.percentage}%`,
                                                backgroundColor: statusColor,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-white/60 text-sm mr-2">
                                    {batchRecordings.length} recording
                                    {batchRecordings.length !== 1 ? "s" : ""}
                                  </div>
                                  <div
                                    className={`transform transition-transform cursor-pointer mr-3 ${isBatchExpanded ? "rotate-180" : ""}`}
                                  >
                                    ▼
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!batch.is_complete &&
                                      progress.completed > 0 && (
                                        <Tooltip title="Resume Recording Session">
                                          <div
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <GlassButton
                                              variant="primary"
                                              size="sm"
                                              onClick={() =>
                                                handleResumeBatch(batch)
                                              }
                                            >
                                              Resume
                                            </GlassButton>
                                          </div>
                                        </Tooltip>
                                      )}
                                    <Tooltip title="Delete Recording Session">
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <GlassButton
                                          variant="danger"
                                          size="sm"
                                          icon={<DeleteOutlined />}
                                          onClick={() =>
                                            handleDeleteBatch(
                                              batch.id,
                                              patientId,
                                            )
                                          }
                                        />
                                      </div>
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>
                            </GlassCard>

                            {/* Batch Recordings */}
                            {isBatchExpanded && (
                              <div className="ml-6 space-y-2">
                                {batchRecordings.map((recording) => (
                                  <GlassCard key={recording.id}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="text-white font-medium">
                                            {formatHeartArea(
                                              recording.location,
                                            )}{" "}
                                            Valve
                                          </h5>
                                          <div
                                            className="px-2 py-1 rounded-full text-xs font-medium"
                                            style={{
                                              backgroundColor: `${getStatusColor(recording.status)}20`,
                                              color: getStatusColor(
                                                recording.status,
                                              ),
                                            }}
                                          >
                                            {recording.status ===
                                            "completed" ? (
                                              <>
                                                <CheckCircleOutlined className="mr-1" />{" "}
                                                Completed
                                              </>
                                            ) : recording.status ===
                                              "flagged" ? (
                                              <>
                                                <ExclamationCircleOutlined className="mr-1" />{" "}
                                                Flagged
                                              </>
                                            ) : (
                                              <>
                                                <PlayCircleOutlined className="mr-1" />{" "}
                                                Processing
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div className="flex items-center gap-2">
                                            <CalendarOutlined className="text-white/60" />
                                            <span className="text-white/70">
                                              {recording.time}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <HeartOutlined className="text-white/60" />
                                            <span className="text-white/70">
                                              {recording.duration}
                                            </span>
                                          </div>
                                        </div>

                                        {recording.notes && (
                                          <div className="mt-2 p-2 bg-white/10 rounded text-sm">
                                            <span className="text-white/60">
                                              Notes:{" "}
                                            </span>
                                            <span className="text-white">
                                              {recording.notes}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Recording Actions */}
                                      <div className="flex items-center gap-2 ml-4">
                                        <Tooltip
                                          title={
                                            playingRecordings.has(recording.id)
                                              ? "Pause Recording"
                                              : "Play Recording"
                                          }
                                        >
                                          <GlassButton
                                            variant="secondary"
                                            size="sm"
                                            icon={
                                              playingRecordings.has(recording.id) ? (
                                                <PauseCircleOutlined
                                                  className="text-green-400"
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
                                            variant="secondary"
                                            size="sm"
                                            icon={<DownloadOutlined />}
                                            onClick={() =>
                                              handleDownloadRecording(recording)
                                            }
                                          />
                                        </Tooltip>
                                        <Tooltip title="Delete Recording">
                                          <GlassButton
                                            variant="danger"
                                            size="sm"
                                            icon={<DeleteOutlined />}
                                            onClick={() =>
                                              handleDeleteRecording(
                                                recording.id,
                                              )
                                            }
                                          />
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </GlassCard>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            },
          )
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={deleteModal?.open || false}
        title={deleteModal?.title || ""}
        content={deleteModal?.content}
        type="danger"
        confirmText={
          deleteModal?.type === "recording"
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

export default RecordingsList;
