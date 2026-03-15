import React, { useState, useEffect } from "react";
import { Select, Button, Modal, Form, Input, DatePicker, message } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type Patient from "../types/Patient";
import type PatientDetails from "../types/PatientDetails";
import { getPatients, savePatient } from "../utils/storage";

const { Option } = Select;

interface PatientSelectorProps {
  selectedPatientId?: number | null;
  onPatientSelect: (patient: Patient | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  style?: React.CSSProperties;
}

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

const PatientSelector: React.FC<PatientSelectorProps> = ({
  selectedPatientId,
  onPatientSelect,
  placeholder = "Select a patient...",
  allowClear = true,
  style,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [form] = Form.useForm<NewPatientFormData>();

  // Load patients on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const allPatients = await getPatients();
      setPatients(allPatients);
    } catch (error) {
      console.error("Error loading patients:", error);
      message.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = (patientId: number | null) => {
    if (patientId === null) {
      onPatientSelect(null);
      return;
    }

    const patient = patients.find((p) => p.id === patientId);
    onPatientSelect(patient || null);
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

      // Parse medications and conditions from comma-separated strings
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
      setPatients((prev) => [...prev, newPatient]);

      // Select the newly created patient
      onPatientSelect(newPatient);

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

  return (
    <>
      <Select
        value={selectedPatientId}
        onChange={handlePatientChange}
        placeholder={placeholder}
        allowClear={allowClear}
        loading={loading}
        style={style}
        size="large"
        showSearch
        filterOption={(input, option) =>
          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }
        dropdownRender={(menu) => (
          <div>
            {menu}
            <div style={{ padding: "8px 0" }}>
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={handleAddNewPatient}
                style={{ width: "100%", textAlign: "left" }}
              >
                Add New Patient
              </Button>
            </div>
          </div>
        )}
      >
        {patients.map((patient) => (
          <Option
            key={patient.id}
            value={patient.id}
            label={`${patient.name} ${patient.patient_uid}`}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserOutlined />
              <span>{patient.name}</span>
              <span style={{ color: "#666", fontSize: "12px" }}>
                (ID: {patient.patient_uid})
              </span>
            </div>
          </Option>
        ))}
      </Select>

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
            label="Patient Name"
            rules={[
              { required: true, message: "Please enter patient name" },
              { min: 2, message: "Name must be at least 2 characters" },
            ]}
          >
            <Input placeholder="Enter patient's full name" />
          </Form.Item>

          <Form.Item
            name="dob"
            label="Date of Birth"
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
            label="Patient ID"
            rules={[
              { required: true, message: "Please enter patient ID" },
              { min: 3, message: "Patient ID must be at least 3 characters" },
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
              label="Height (cm)"
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
              label="Weight (kg)"
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
    </>
  );
};

export default PatientSelector;
