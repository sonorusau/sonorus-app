import { useCallback, useEffect, useRef, useState } from "react";

type AudioContextConstructor = typeof AudioContext;

type ExtendedWindow = Window & {
  webkitAudioContext?: AudioContextConstructor;
};

const getAudioContext = (): AudioContext => {
  const extendedWindow = window as ExtendedWindow;
  const AudioContextCtor = window.AudioContext || extendedWindow.webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error("Web Audio API is not supported in this environment");
  }

  return new AudioContextCtor();
};

const MICROPHONE_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
};

const PERMISSION_ERROR_MESSAGE =
  "Unable to access the microphone. Please verify that the application has permission to use your audio input device.";

const UNSUPPORTED_ERROR_MESSAGE =
  "Microphone access is not supported in this environment.";

interface UseMicrophoneAnalyserResult {
  analyser: AnalyserNode | null;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
  clearError: () => void;
}

const useMicrophoneAnalyser = (): UseMicrophoneAnalyserResult => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (disconnectError) {
        console.warn("Failed to disconnect audio source", disconnectError);
      }
      sourceNodeRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (disconnectError) {
        console.warn("Failed to disconnect analyser", disconnectError);
      }
      analyserRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state === "running") {
      void audioContextRef.current.suspend().catch(() => undefined);
    }

    setAnalyser(null);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(UNSUPPORTED_ERROR_MESSAGE);
      throw new Error(UNSUPPORTED_ERROR_MESSAGE);
    }

    if (streamRef.current) {
      stop();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(MICROPHONE_CONSTRAINTS);
      streamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = getAudioContext();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (disconnectError) {
          console.warn("Failed to disconnect existing audio source", disconnectError);
        }
      }

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (disconnectError) {
          console.warn("Failed to disconnect existing analyser", disconnectError);
        }
      }

      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.minDecibels = -85;
      analyserNode.maxDecibels = -5;
      analyserNode.smoothingTimeConstant = 0.85;

      sourceNode.connect(analyserNode);

      analyserRef.current = analyserNode;
      setAnalyser(analyserNode);
      setError(null);
    } catch (startError) {
      console.error("Failed to start microphone analyser", startError);
      stop();

      const isPermissionError = startError instanceof DOMException &&
        (startError.name === "NotAllowedError" || startError.name === "SecurityError");

      if (isPermissionError) {
        setError(PERMISSION_ERROR_MESSAGE);
      } else if (startError instanceof Error) {
        setError(startError.message || PERMISSION_ERROR_MESSAGE);
      } else {
        setError(PERMISSION_ERROR_MESSAGE);
      }

      throw startError;
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, [stop]);

  return {
    analyser,
    start,
    stop,
    error,
    clearError,
  };
};

export default useMicrophoneAnalyser;
