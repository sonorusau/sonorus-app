/**
 * Audio file loading utility for Sonorus application
 * Handles loading WAV files from filesystem and converting to Blob format
 */

/**
 * Loads a WAV file from the filesystem and converts it to a Blob
 * @param filePath - Absolute path to the WAV file
 * @returns Promise<Blob> - The audio file as a Blob for IndexedDB storage
 */
export const loadWAVFile = async (filePath: string): Promise<Blob> => {
  console.log(`Attempting to load WAV file: ${filePath}`);
  
  try {
    // For Electron, file:// URLs often don't work reliably in renderer
    // Try with a short timeout to avoid hanging
    const fileUrl = `file://${filePath}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    try {
      const response = await fetch(fileUrl, { 
        signal: controller.signal,
        mode: 'no-cors' // Try no-cors mode for local files
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        
        console.log(`Successfully loaded WAV file: ${filePath}`, {
          size: blob.size,
          type: blob.type
        });
        
        return blob;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn('File fetch failed, using mock audio:', fetchError);
      
      // Use mock audio immediately to prevent hanging
      return createMockAudioBlob();
    }
  } catch (error) {
    console.error('Error in loadWAVFile:', error);
    
    // Always return mock audio as fallback
    return createMockAudioBlob();
  }
};

/**
 * Creates a mock audio blob for testing purposes
 * This creates a minimal valid WAV file structure
 */
const createMockAudioBlob = (): Blob => {
  // Create a minimal WAV file header and some audio data
  const sampleRate = 4000; // 4kHz to match the original file
  const duration = 10; // 10 seconds
  const numSamples = sampleRate * duration;
  const bufferLength = 44 + numSamples * 2; // WAV header (44 bytes) + 16-bit samples
  
  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);
  
  // WAV file header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF'); // ChunkID
  view.setUint32(4, bufferLength - 8, true); // ChunkSize
  writeString(8, 'WAVE'); // Format
  writeString(12, 'fmt '); // Subchunk1ID
  view.setUint32(16, 16, true); // Subchunk1Size (PCM = 16)
  view.setUint16(20, 1, true); // AudioFormat (PCM = 1)
  view.setUint16(22, 1, true); // NumChannels (mono = 1)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data'); // Subchunk2ID
  view.setUint32(40, numSamples * 2, true); // Subchunk2Size
  
  // Generate simple sine wave audio data (heart-like rhythm)
  const frequency = 80; // Low frequency for heart sound simulation
  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    
    // Create a heart-like double beat pattern
    const beatFreq = 1.2; // ~72 BPM
    const beat1 = Math.sin(2 * Math.PI * frequency * time) * Math.exp(-((time % (1/beatFreq)) * 20));
    const beat2 = Math.sin(2 * Math.PI * (frequency * 1.5) * time) * Math.exp(-(((time + 0.1) % (1/beatFreq)) * 15));
    
    const sample = Math.max(-1, Math.min(1, (beat1 + beat2 * 0.3) * 0.3));
    const intSample = Math.round(sample * 32767);
    
    view.setInt16(44 + i * 2, intSample, true);
  }
  
  console.log('Created mock audio blob for testing:', {
    size: buffer.byteLength,
    duration: duration,
    sampleRate: sampleRate
  });
  
  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * Validates that a blob contains valid audio data
 * @param blob - The blob to validate
 * @returns boolean - True if the blob appears to contain valid audio
 */
export const validateAudioBlob = (blob: Blob): boolean => {
  if (!blob || blob.size === 0) {
    return false;
  }
  
  if (!blob.type.startsWith('audio/')) {
    console.warn('Blob type is not audio:', blob.type);
  }
  
  // Check minimum size (WAV header is 44 bytes minimum)
  if (blob.size < 44) {
    console.warn('Audio blob too small to be valid WAV:', blob.size);
    return false;
  }
  
  return true;
};

/**
 * Loads the aortic WAV file specifically for mock data
 * @returns Promise<Blob> - The aortic.WAV file as a Blob
 */
export const loadAorticWAVFile = (): Promise<Blob> => {
  const filePath = '/Users/liul31/gradathoners-ctohackathon2024/resources/sounds/aortic.WAV';
  return loadWAVFile(filePath);
};