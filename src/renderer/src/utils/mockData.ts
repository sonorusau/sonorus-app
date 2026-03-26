/**
 * Mock data seeding utility for Sonorus application
 * Creates default demonstration data including patients and recording batches
 */

import type Patient from "../types/Patient";
import type PatientDetails from "../types/PatientDetails";
import type RecordingBatch from "../types/RecordingBatch";
import type Recording from "../types/Recording";
import HeartLocationEnum from "../types/HeartLocation";
import { Steps } from "../enums/steps";
import { loadAorticWAVFile, validateAudioBlob } from "./audioLoader";
import {
  savePatient,
  saveRecordingBatch,
  saveRecording,
  getPatients,
  updateRecordingBatch,
} from "./storage";

/**
 * Creates the mock patient "Trevin Wadu" with complete details
 * @returns Patient object ready for storage
 */
const createTrevinWaduPatient = (): Omit<Patient, "id"> => {
  const patientDetails: Omit<PatientDetails, "id"> = {
    height: 180, // 1.80m as requested
    weight: 75, // Reasonable default weight
    medications: [], // No medications
    conditions: [], // No medical conditions
    notes: [
      "Mock patient created for demonstration purposes",
      "Complete heart valve recording session available",
      "All 4 cardiac areas recorded with high quality audio",
    ],
  };

  const patient: Omit<Patient, "id"> = {
    name: "Trevin Wadu",
    dob: "2000-02-20T00:00:00.000Z", // February 20, 2000
    patient_uid: "TW-2000-001",
    patient_details: patientDetails as PatientDetails,
  };

  return patient;
};

/**
 * Creates a complete recording batch for a patient
 * @param patient - The patient to create recordings for
 * @param audioBlob - The audio blob to use for all recordings
 * @returns Promise<RecordingBatch> - Complete recording batch with all 4 valve recordings
 */
const createCompleteRecordingBatch = async (
  patient: Patient,
  audioBlob: Blob,
): Promise<RecordingBatch> => {
  // Create the base recording batch
  const baseTime = new Date();
  const batchData: Omit<RecordingBatch, "id"> = {
    patient: patient,
    step_id: Steps.SelectLocation,
    skin_barriers: [], // No skin barriers for this mock patient
    start_time: baseTime.toISOString(),
    is_complete: false, // Will be set to true after adding all recordings
    recordings: [],
    selected_recordings: [],
  };

  // Save the initial batch
  const batch = await saveRecordingBatch(batchData);

  // Create recordings for all 4 heart valve locations
  const heartLocations = [
    HeartLocationEnum.Aortic,
    HeartLocationEnum.Pulmonary,
    HeartLocationEnum.Tricuspid,
    HeartLocationEnum.Mitral,
  ];

  const recordings: Recording[] = [];
  const selectedRecordingIds: number[] = [];

  // Create each recording with sequential timestamps
  for (let i = 0; i < heartLocations.length; i++) {
    const location = heartLocations[i];

    // Space recordings 30 seconds apart to simulate realistic recording session
    const recordingTime = new Date(baseTime.getTime() + i * 30 * 1000);

    const recordingData: Omit<Recording, "id"> = {
      recording_batch_id: batch.id,
      device_id: 1, // Default device ID
      location: location,
      audio: audioBlob, // Use the same audio blob for all recordings
      start_time: recordingTime.toISOString(),
    };

    const recording = await saveRecording(recordingData);
    recordings.push(recording);
    selectedRecordingIds.push(recording.id);

    console.log(`Created ${location} valve recording for Trevin Wadu:`, {
      id: recording.id,
      location: recording.location,
      audioSize: recording.audio.size,
      timestamp: recording.start_time,
    });
  }

  // Update the batch to include all recordings and mark as complete
  const completedBatch: RecordingBatch = {
    ...batch,
    recordings: recordings,
    selected_recordings: selectedRecordingIds,
    is_complete: true,
    step_id: Steps.Complete, // Mark as fully completed
  };

  await updateRecordingBatch(completedBatch);

  console.log(
    `Completed recording batch ${batch.id} for Trevin Wadu with ${recordings.length} recordings`,
  );

  return completedBatch;
};

/**
 * Finds a patient by name or patient UID
 * @param name - The patient name to search for
 * @param uid - Optional patient UID to also match
 * @returns Promise<Patient | null> - The patient if found, null otherwise
 */
const findPatientByNameOrUID = async (
  name: string,
  uid?: string,
): Promise<Patient | null> => {
  try {
    const patients = await getPatients();
    return (
      patients.find(
        (patient) =>
          patient.name === name || (uid && patient.patient_uid === uid),
      ) || null
    );
  } catch (error) {
    console.error("Error finding patient by name or UID:", error);
    return null;
  }
};

/**
 * Checks if Trevin Wadu exists and seeds him if not
 * This ensures Trevin Wadu is always available for demo purposes
 * @returns Promise<boolean> - True if seeding was performed, false if already exists
 */
export const checkAndSeedTrevinWadu = async (): Promise<boolean> => {
  try {
    console.log("🔍 Checking if Trevin Wadu exists in database...");

    // Check if Trevin Wadu already exists
    const existingTrevin = await findPatientByNameOrUID(
      "Trevin Wadu",
      "TW-2000-001",
    );

    if (existingTrevin) {
      console.log("✅ Trevin Wadu already exists in database:", {
        id: existingTrevin.id,
        name: existingTrevin.name,
        uid: existingTrevin.patient_uid,
      });
      return false; // Already exists, no seeding needed
    }

    console.log("📝 Trevin Wadu not found, creating mock patient...");

    // Load the audio file with timeout protection
    console.log("🎵 Loading audio file for Trevin Wadu recordings...");
    const audioBlob = await Promise.race([
      loadAorticWAVFile(),
      new Promise<Blob>((_, reject) =>
        setTimeout(() => reject(new Error("Audio loading timeout")), 5000),
      ),
    ]);

    if (!validateAudioBlob(audioBlob)) {
      console.warn(
        "⚠️ Audio validation failed, but continuing with available blob",
      );
    }

    console.log("🎵 Audio loaded for Trevin Wadu:", {
      size: audioBlob.size,
      type: audioBlob.type,
    });

    // Create Trevin Wadu patient
    console.log("👤 Creating Trevin Wadu patient...");
    const patientData = createTrevinWaduPatient();
    const patient = await savePatient(patientData);

    console.log("✅ Trevin Wadu patient created:", {
      id: patient.id,
      name: patient.name,
      dob: patient.dob,
      height: patient.patient_details.height,
    });

    // Create complete recording batch with 4 valve recordings
    console.log("🫀 Creating complete heart valve recording batch...");
    const recordingBatch = await createCompleteRecordingBatch(
      patient,
      audioBlob,
    );

    console.log("🎉 Trevin Wadu seeded successfully!", {
      patient: patient.name,
      batchId: recordingBatch.id,
      recordings: recordingBatch.recordings.length,
      complete: recordingBatch.is_complete,
      valves: recordingBatch.recordings.map((r) => r.location),
    });

    return true; // Seeding was performed
  } catch (error) {
    console.error("❌ Error checking/seeding Trevin Wadu:", error);

    // Don't throw the error - just log it and continue
    // This prevents the app from crashing if seeding fails
    return false;
  }
};

/**
 * Seeds the database with mock data if it's empty
 * This creates a demonstration patient with complete recording history
 * @returns Promise<boolean> - True if seeding was performed, false if data already exists
 */
export const seedMockDataIfEmpty = async (): Promise<boolean> => {
  try {
    console.log("Checking if mock data seeding is needed...");

    // Check if any patients already exist
    const existingPatients = await getPatients();

    if (existingPatients.length > 0) {
      console.log(
        "Database already contains patient data, skipping mock data seeding",
      );
      return false;
    }

    console.log("Database is empty, starting mock data seeding...");

    // Load the audio file with timeout protection
    console.log("Loading audio file for mock recordings...");
    const audioBlob = await Promise.race([
      loadAorticWAVFile(),
      new Promise<Blob>((_, reject) =>
        setTimeout(() => reject(new Error("Audio loading timeout")), 5000),
      ),
    ]);

    if (!validateAudioBlob(audioBlob)) {
      console.warn(
        "Audio validation failed, but continuing with available blob",
      );
    }

    console.log("Audio loaded:", {
      size: audioBlob.size,
      type: audioBlob.type,
    });

    // Create the mock patient
    console.log("Creating Trevin Wadu patient...");
    const patientData = createTrevinWaduPatient();
    const patient = await savePatient(patientData);

    console.log("Trevin Wadu patient created:", {
      id: patient.id,
      name: patient.name,
      dob: patient.dob,
    });

    // Create complete recording batch
    console.log("Creating recording batch with 4 valve recordings...");
    const recordingBatch = await createCompleteRecordingBatch(
      patient,
      audioBlob,
    );

    console.log("✅ Mock data seeding completed successfully!", {
      patient: patient.name,
      batchId: recordingBatch.id,
      recordings: recordingBatch.recordings.length,
      complete: recordingBatch.is_complete,
    });

    return true;
  } catch (error) {
    console.error("❌ Error seeding mock data:", error);

    // Don't throw the error - just log it and continue
    // This prevents the app from crashing if mock data seeding fails
    return false;
  }
};

/**
 * Forces creation of mock data (even if database is not empty)
 * Useful for development and testing
 * @returns Promise<boolean> - True if seeding was successful
 */
export const forceSeedMockData = async (): Promise<boolean> => {
  try {
    console.log("Force seeding mock data...");

    // Load the audio file
    const audioBlob = await loadAorticWAVFile();

    if (!validateAudioBlob(audioBlob)) {
      console.error("Failed to load valid audio blob");
      return false;
    }

    // Create the mock patient
    const patientData = createTrevinWaduPatient();
    const patient = await savePatient(patientData);

    // Create complete recording batch
    await createCompleteRecordingBatch(patient, audioBlob);

    console.log("Force mock data seeding completed successfully!");
    return true;
  } catch (error) {
    console.error("Error in force seeding mock data:", error);
    return false;
  }
};
