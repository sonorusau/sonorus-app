import React, { useState, useEffect } from "react";
import { Input, Button, Modal, Form, DatePicker, message, Tooltip } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, HeartOutlined, PlayCircleOutlined, DownloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import ConfirmationModal, { GlassTable, type TableRow } from "../components/ConfirmationModal";
import Title from "antd/es/typography/Title";
import type Patient from "../types/Patient";
import type PatientDetails from "../types/PatientDetails";
import type RecordingBatch from "../types/RecordingBatch";
import { getPatients, savePatient, deletePatient, getRecordingsByPatient, getRecordingBatchesByPatient, deleteRecordingBatch, deleteRecording } from "../utils/storage";
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
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [form] = Form.useForm<NewPatientFormData>();
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: 'batch' | 'patient' | 'recording';
    id: number;
    title: string;
    content: React.ReactNode;
  } | null>(null);

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
      console.error('Error loading patients:', error);
      message.error('Failed to load patients');
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
      // Auto-expand first batch if it exists
      if (batches.length > 0) {
        setExpandedBatches(new Set([batches[0].id]));
      } else {
        setExpandedBatches(new Set());
      }
    } catch (error) {
      console.error('Error loading patient batches:', error);
    }
  };

  const handleAddRecording = () => {
    if (selectedPatient) {
      navigate('/quick-scan', { state: { patient: selectedPatient } });
    }
  };

  const handleAddNewPatient = () => {
    form.resetFields();
    // Set default values
    form.setFieldsValue({
      patient_uid: `P-${Date.now()}`, // Generate default UID
      height: 170,
      weight: 70,
      medications: '',
      conditions: '',
      notes: ''
    });
    setShowNewPatientModal(true);
  };

  const handleCreatePatient = async () => {
    try {
      const values = await form.validateFields();

      // Parse medications, conditions, and notes from comma-separated strings
      const medications = values.medications
        .split(',')
        .map(med => med.trim())
        .filter(med => med.length > 0);

      const conditions = values.conditions
        .split(',')
        .map(condition => condition.trim())
        .filter(condition => condition.length > 0);

      const notes = values.notes
        .split(',')
        .map(note => note.trim())
        .filter(note => note.length > 0);

      const patientDetails: PatientDetails = {
        id: 0, // Will be assigned by storage
        height: values.height,
        weight: values.weight,
        medications,
        conditions,
        notes
      };

      const newPatient = await savePatient({
        name: values.name,
        dob: values.dob.toISOString(),
        patient_uid: values.patient_uid,
        patient_details: patientDetails
      });

      // Update local patients list
      await loadPatients();

      // Select the newly created patient
      handlePatientSelect(newPatient);

      // Close modal
      setShowNewPatientModal(false);

      message.success(`Patient "${newPatient.name}" created successfully`);

    } catch (error) {
      console.error('Error creating patient:', error);
      message.error('Failed to create patient');
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

  const getBatchProgress = (batch: RecordingBatch): { completed: number; total: number; percentage: number } => {
    const totalAreas = 4; // Aortic, Pulmonary, Tricuspid, Mitral
    const completedAreas = batch.recordings ? batch.recordings.length : 0;
    return {
      completed: completedAreas,
      total: totalAreas,
      percentage: (completedAreas / totalAreas) * 100
    };
  };

  const getBatchStatusColor = (batch: RecordingBatch) => {
    if (batch.is_complete) return '#10b981'; // Green for complete
    const progress = getBatchProgress(batch);
    if (progress.completed === 0) return '#6b7280'; // Gray for not started
    return '#f59e0b'; // Amber for in progress
  };

  const handleResumeBatch = (batch: RecordingBatch) => {
    // Navigate to QuickScanPage with batch data for resume
    navigate('/quick-scan', { state: { patient: selectedPatient, resumeBatch: batch } });
  };

  const handleDeleteBatch = async (batchId: number) => {
    const batch = patientBatches.find(b => b.id === batchId);
    if (!batch) return;

    const recordingCount = batch.recordings?.length || 0;
    const batchDate = new Date(batch.start_time).toLocaleDateString();

    const batchTableRows: TableRow[] = [
      { label: "Session", value: `Session #${batchId} from ${batchDate}` },
      { label: "Recordings", value: `${recordingCount} recording${recordingCount !== 1 ? 's' : ''}` },
      ...(batch.skin_barriers && batch.skin_barriers.length > 0 ? 
        [{ label: "Skin Barriers", value: "Included in deletion" }] : [])
    ];

    setDeleteModal({
      open: true,
      type: 'batch',
      id: batchId,
      title: 'Delete Recording Session?',
      content: (
        <div>
          <p className="text-white/90 mb-4">This will permanently delete:</p>
          <GlassTable rows={batchTableRows} className="mb-4" />
          <p className="text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>
      )
    });
  };

  const handleDeletePatient = async (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const batches = patientBatches.length;
    const totalRecordings = patientBatches.reduce((total, batch) =>
      total + (batch.recordings?.length || 0), 0);

    const patientTableRows: TableRow[] = [
      { label: "Patient Name", value: patient.name },
      { label: "Sessions", value: `${batches} recording session${batches !== 1 ? 's' : ''}` },
      { label: "Recordings", value: `${totalRecordings} recording${totalRecordings !== 1 ? 's' : ''}` },
      { label: "Medical Data", value: "All history and patient data" }
    ];

    setDeleteModal({
      open: true,
      type: 'patient',
      id: patientId,
      title: 'Delete Patient?',
      content: (
        <div>
          <p className="text-white/90 mb-4">This will permanently delete:</p>
          <GlassTable rows={patientTableRows} className="mb-4" />
          <p className="text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>
      )
    });
  };

  const handleDeleteIndividualRecording = async (recordingId: number) => {
    // Find the recording details
    let recordingToDelete: any = null;
    
    for (const batch of patientBatches) {
      if (batch.recordings) {
        const found = batch.recordings.find(r => r.id === recordingId);
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
      { label: "Date", value: new Date(recordingToDelete.start_time).toLocaleDateString() },
      { label: "Duration", value: "30s recording" }
    ];

    setDeleteModal({
      open: true,
      type: 'recording',
      id: recordingId,
      title: 'Delete Recording?',
      content: (
        <div>
          <p className="text-white/90 mb-4">This will permanently delete:</p>
          <GlassTable rows={recordingTableRows} className="mb-4" />
          <p className="text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>
      )
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;

    try {
      if (deleteModal.type === 'batch') {
        await deleteRecordingBatch(deleteModal.id);
        if (selectedPatient) {
          await handlePatientSelect(selectedPatient);
        }
        message.success('Recording session deleted successfully');
      } else if (deleteModal.type === 'patient') {
        await deletePatient(deleteModal.id);
        await loadPatients();
        message.success('Patient deleted successfully');
        if (selectedPatient?.id === deleteModal.id) {
          setSelectedPatient(null);
          setPatientBatches([]);
          setExpandedBatches(new Set());
        }
      } else if (deleteModal.type === 'recording') {
        await deleteRecording(deleteModal.id);
        if (selectedPatient) {
          await handlePatientSelect(selectedPatient);
        }
        message.success('Recording deleted successfully');
      }
      
      setDeleteModal(null);
    } catch (error) {
      console.error('Error deleting:', error);
      message.error(`Failed to delete ${deleteModal.type}`);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal(null);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                  className={`patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="flex items-center">
                    <div className="patient-avatar">{patient.name.charAt(0)}</div>
                    <div className="patient-details">
                      <p className="patient-name">{patient.name}</p>
                      <p className="patient-dob">DOB: {new Date(patient.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
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
              <div className="patient-header-avatar">{selectedPatient.name.charAt(0)}</div>
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
                  <p className="info-value">{new Date(selectedPatient.dob).toLocaleDateString()}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Height</p>
                  <p className="info-value">{selectedPatient.patient_details.height}cm</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Weight</p>
                  <p className="info-value">{selectedPatient.patient_details.weight}kg</p>
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
                        ? selectedPatient.patient_details.conditions.join(', ')
                        : 'None'}
                    </p>
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-item">
                    <p className="info-label">Medications</p>
                    <p className="info-value">
                      {selectedPatient.patient_details.medications.length > 0
                        ? selectedPatient.patient_details.medications.join(', ')
                        : 'None'}
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
                  <GlassButton size="sm" variant="primary" onClick={handleAddRecording}>
                    New Recording Session
                  </GlassButton>
                </div>
              </div>

              <div className="recordings-list">
                {patientBatches.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    <HeartOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                    <div>No recording sessions found.</div>
                    <div className="text-sm mt-2">Click "New Recording Session" to start recording heart sounds.</div>
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
                                    {batch.is_complete ? '✓' : progress.completed}
                                  </div>
                                  <div className="recording-type">Session #{batch.id}</div>
                                  <div
                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                    style={{
                                      backgroundColor: `${statusColor}20`,
                                      color: statusColor
                                    }}
                                  >
                                    {batch.is_complete ? 'Complete' : 'In Progress'}
                                  </div>
                                </div>
                              </div>
                              <div className="recording-details">
                                <span className="recording-date">
                                  {new Date(batch.start_time).toLocaleDateString()} at {new Date(batch.start_time).toLocaleTimeString()}
                                </span>
                                <span className="mx-2">•</span>
                                <span className="text-white/70">{progress.completed}/{progress.total} heart areas</span>
                              </div>
                              {batch.skin_barriers && batch.skin_barriers.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                  <ExclamationCircleOutlined className="text-yellow-500 text-xs" />
                                  <span className="text-yellow-500 text-xs">
                                    Barriers: {batch.skin_barriers.map(barrier => `${barrier.level} ${barrier.option}`).join(', ')}
                                  </span>
                                </div>
                              )}
                              {progress.percentage > 0 && progress.percentage < 100 && (
                                <div className="mt-2 w-full max-w-xs">
                                  <div className="w-full bg-white/20 rounded-full h-1">
                                    <div
                                      className="h-1 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${progress.percentage}%`,
                                        backgroundColor: statusColor
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`transform transition-transform cursor-pointer ${isBatchExpanded ? 'rotate-180' : ''}`}>
                                ▼
                              </div>
                              <div className="recording-actions flex items-center gap-2">
                                {!batch.is_complete && progress.completed > 0 && (
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
                            <div className="ml-8 space-y-2">
                              {batch.recordings && batch.recordings.length > 0 ? (
                                batch.recordings.map((recording) => (
                                  <div key={recording.id} className="recording-card bg-white/5">
                                    <div className="recording-info">
                                      <div className="recording-header">
                                        <div className="recording-type">{recording.location} Valve</div>
                                      </div>
                                      <div className="recording-details">
                                        <span className="recording-date">
                                          {new Date(recording.start_time).toLocaleDateString()} at {new Date(recording.start_time).toLocaleTimeString()}
                                        </span>
                                        <span className="mx-2">•</span>
                                        <span className="text-white/70">30s recording</span>
                                      </div>
                                    </div>
                                    <div className="recording-actions flex items-center gap-2">
                                      <Tooltip title="Play Recording">
                                        <GlassButton size="sm" variant="secondary" icon={<PlayCircleOutlined />} />
                                      </Tooltip>
                                      <Tooltip title="Download">
                                        <GlassButton size="sm" variant="secondary" icon={<DownloadOutlined />} />
                                      </Tooltip>
                                      <Tooltip title="Delete Recording">
                                        <GlassButton 
                                          size="sm" 
                                          variant="danger" 
                                          icon={<DeleteOutlined />}
                                          onClick={() => handleDeleteIndividualRecording(recording.id)}
                                        />
                                      </Tooltip>
                                    </div>
                                  </div>
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
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Patient Name *"
            rules={[
              { required: true, message: 'Please enter patient name' },
              { min: 2, message: 'Name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter patient's full name" />
          </Form.Item>

          <Form.Item
            name="dob"
            label="Date of Birth *"
            rules={[
              { required: true, message: 'Please select date of birth' }
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Select date of birth"
              disabledDate={(current) => current && current > dayjs()}
            />
          </Form.Item>

          <Form.Item
            name="patient_uid"
            label="Patient UID *"
            rules={[
              { required: true, message: 'Please enter patient UID' },
              { min: 3, message: 'Patient UID must be at least 3 characters' }
            ]}
          >
            <Input placeholder="Unique patient identifier" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="height"
              label="Height (cm) *"
              rules={[
                { required: true, message: 'Please enter height' },
                { type: 'number', min: 50, max: 250, message: 'Height must be between 50-250 cm' }
              ]}
            >
              <Input type="number" placeholder="Height in cm" />
            </Form.Item>

            <Form.Item
              name="weight"
              label="Weight (kg) *"
              rules={[
                { required: true, message: 'Please enter weight' },
                { type: 'number', min: 10, max: 300, message: 'Weight must be between 10-300 kg' }
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
        title={deleteModal?.title || ''}
        content={deleteModal?.content}
        type="danger"
        confirmText={
          deleteModal?.type === 'patient' ? 'Delete Patient' : 
          deleteModal?.type === 'recording' ? 'Delete Recording' : 
          'Delete Session'
        }
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default PatientList;
