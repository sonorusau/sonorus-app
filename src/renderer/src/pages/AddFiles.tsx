import React, { useState, useEffect } from "react";
import { Input } from "antd";
import { CiSearch } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import "./PatientSelect.css";

interface Patient {
  id: number;
  name: string;
  dob: string;
  gender: string;
  height: string;
  weight: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  surgeries: string;
  recordings: Recording[];
}

interface Recording {
  id: number;
  date: string;
  time: string;
  duration: string;
  type: string;
  result: string;
  status: string;
}

const mockPatients: Patient[] = [
  {
    id: 1,
    name: "Liam Carter",
    dob: "01/01/1990",
    gender: "Male",
    height: "180cm",
    weight: "75kg",
    bloodType: "O+",
    allergies: "None",
    conditions: "None",
    medications: "None",
    surgeries: "None",
    recordings: [
      {
        id: 1,
        date: "2024-01-15",
        time: "10:30 AM",
        duration: "45s",
        type: "Mitral Valve",
        result: "Normal",
        status: "completed"
      },
      {
        id: 2,
        date: "2024-01-10",
        time: "2:15 PM", 
        duration: "38s",
        type: "Aortic Valve",
        result: "Normal",
        status: "completed"
      }
    ]
  },
  {
    id: 2,
    name: "Sarah Johnson",
    dob: "15/03/1985",
    gender: "Female",
    height: "165cm",
    weight: "62kg",
    bloodType: "A-",
    allergies: "Penicillin",
    conditions: "Hypertension",
    medications: "Lisinopril 10mg",
    surgeries: "Appendectomy (2010)",
    recordings: [
      {
        id: 3,
        date: "2024-01-05",
        time: "9:45 AM",
        duration: "52s", 
        type: "Tricuspid Valve",
        result: "Abnormal",
        status: "flagged"
      }
    ]
  },
  {
    id: 3,
    name: "Michael Brown",
    dob: "22/11/1978",
    gender: "Male",
    height: "175cm",
    weight: "80kg",
    bloodType: "B+",
    allergies: "None",
    conditions: "Diabetes Type 2",
    medications: "Metformin 500mg",
    surgeries: "None",
    recordings: []
  }
];

const mockAPI = {
  getPatients: async (): Promise<Patient[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockPatients);
      }, 300);
    });
  },
  
  getPatientById: async (id: number): Promise<Patient | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const patient = mockPatients.find(p => p.id === id);
        resolve(patient || null);
      }, 200);
    });
  }
};


function PatientSelect(): JSX.Element {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientsData = await mockAPI.getPatients();
      setPatients(patientsData);
      if (patientsData.length > 0) {
        setSelectedPatient(patientsData[0]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleAddRecording = () => {
    navigate('/list-team-repos', { state: { patientId: selectedPatient?.id } });
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
              prefix={<CiSearch className="text-white/60" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                      <p className="patient-dob">{patient.dob}</p>
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
                <p className="patient-id">Patient ID: #{selectedPatient.id.toString().padStart(5, '0')}</p>
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
                  <p className="info-value">{selectedPatient.dob}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">Height</p>
                  <p className="info-value">{selectedPatient.height}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">Blood Type</p>
                  <p className="info-value">{selectedPatient.bloodType}</p>
                </div>
              </div>

              <div className="info-section">
                <div className="info-item">
                  <p className="info-label">Gender</p>
                  <p className="info-value">{selectedPatient.gender}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">Weight</p>
                  <p className="info-value">{selectedPatient.weight}</p>
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
                    <p className="info-label">Allergies</p>
                    <p className="info-value">{selectedPatient.allergies}</p>
                  </div>

                  <div className="info-item">
                    <p className="info-label">Conditions</p>
                    <p className="info-value">{selectedPatient.conditions}</p>
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-item">
                    <p className="info-label">Medications</p>
                    <p className="info-value">{selectedPatient.medications}</p>
                  </div>

                  <div className="info-item">
                    <p className="info-label">Surgeries</p>
                    <p className="info-value">{selectedPatient.surgeries}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recordings Section */}
          {selectedPatient && (
            <div>
              <div className="section-header">
                <div className="section-dot"></div>
                <h2 className="section-title">Heart Sound Recordings</h2>
                <div className="ml-auto">
                  <GlassButton size="sm" variant="primary" onClick={handleAddRecording}>
                    Add Recording
                  </GlassButton>
                </div>
              </div>
              
              <div className="recordings-list">
                {selectedPatient.recordings.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    No recordings found. Click "Add Recording" to create the first recording.
                  </div>
                ) : (
                  selectedPatient.recordings.map((recording) => (
                    <div key={recording.id} className="recording-card">
                      <div className="recording-info">
                        <div className="recording-header">
                          <div className="recording-type">{recording.type}</div>
                          <div className={`recording-status status-${recording.status}`}>
                            {recording.status === 'completed' ? '✓' : '⚠'}
                          </div>
                        </div>
                        <div className="recording-details">
                          <span className="recording-date">{recording.date} at {recording.time}</span>
                          <span className="recording-duration">{recording.duration}</span>
                        </div>
                        <div className="recording-result">
                          Result: <span className={`result-${recording.result.toLowerCase()}`}>{recording.result}</span>
                        </div>
                      </div>
                      <div className="recording-actions">
                        <GlassButton size="sm" variant="secondary">
                          View
                        </GlassButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </GlassCard>
        <div className="mb-16"></div>
      </div>
    </div>
  );
}

export default PatientSelect;
