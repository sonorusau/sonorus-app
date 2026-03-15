import { useState, useRef, useEffect, useCallback } from "react";
import { message } from "antd";

interface RecordingProgress {
  current: number;
  duration: number;
}

interface UseAudioPlaybackResult {
  // State
  playingRecordings: Set<number>;
  pausedRecordings: Set<number>;
  audioAnalysers: Map<number, AnalyserNode>;
  recordingProgress: Map<number, RecordingProgress>;

  // Controls
  playRecording: (recordingId: number, audioBlob: Blob) => Promise<void>;
  pauseRecording: (recordingId: number) => void;
  resumeRecording: (recordingId: number) => Promise<void>;
  stopRecording: (recordingId: number) => void;
  seekRecording: (recordingId: number, value: number) => void;
  togglePlayPause: (recordingId: number, audioBlob: Blob) => Promise<void>;
}

const useAudioPlayback = (): UseAudioPlaybackResult => {
  const [playingRecordings, setPlayingRecordings] = useState<Set<number>>(
    new Set(),
  );
  const [pausedRecordings, setPausedRecordings] = useState<Set<number>>(
    new Set(),
  );
  const [audioInstances, setAudioInstances] = useState<
    Map<number, HTMLAudioElement>
  >(new Map());
  const [audioAnalysers, setAudioAnalysers] = useState<
    Map<number, AnalyserNode>
  >(new Map());
  const [audioContexts, setAudioContexts] = useState<Map<number, AudioContext>>(
    new Map(),
  );
  const [recordingProgress, setRecordingProgress] = useState<
    Map<number, RecordingProgress>
  >(new Map());
  const progressIntervalRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      progressIntervalRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      progressIntervalRef.current.clear();
    };
  }, []);

  const validateDuration = useCallback((duration: number): number => {
    return isFinite(duration) && duration > 0 && !isNaN(duration)
      ? duration
      : 0;
  }, []);

  const startProgressTracking = useCallback(
    (recordingId: number, audio: HTMLAudioElement) => {
      const interval = setInterval(() => {
        setRecordingProgress((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(recordingId);
          if (current) {
            const audioCurrentTime =
              isFinite(audio.currentTime) && !isNaN(audio.currentTime)
                ? audio.currentTime
                : 0;
            const audioDuration = validateDuration(audio.duration);
            const duration =
              audioDuration > 0 ? audioDuration : current.duration;

            newMap.set(recordingId, {
              current: audioCurrentTime,
              duration,
            });
          }
          return newMap;
        });
      }, 100);
      progressIntervalRef.current.set(recordingId, interval);
    },
    [validateDuration],
  );

  const cleanup = useCallback(
    (recordingId: number, url: string, audioContext?: AudioContext) => {
      URL.revokeObjectURL(url);

      // Clean up duration check timeout
      const audio = audioInstances.get(recordingId);
      if (audio && (audio as any)._durationCheckTimeout) {
        clearTimeout((audio as any)._durationCheckTimeout);
      }

      // Clean up progress interval
      const interval = progressIntervalRef.current.get(recordingId);
      if (interval) {
        clearInterval(interval);
        progressIntervalRef.current.delete(recordingId);
      }

      // Clean up AudioContext
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(console.error);
      }

      setPlayingRecordings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
      setPausedRecordings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
      setAudioInstances((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });
      setAudioAnalysers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });
      setAudioContexts((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });
      setRecordingProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });
    },
    [audioInstances],
  );

  const playRecording = useCallback(
    async (recordingId: number, audioBlob: Blob) => {
      // Check if already playing
      if (playingRecordings.has(recordingId)) {
        return;
      }

      if (!audioBlob || !(audioBlob instanceof Blob)) {
        console.error("Invalid audio blob for recording:", recordingId);
        message.error("Audio data format is invalid.");
        return;
      }

      if (audioBlob.size === 0) {
        console.error("Audio blob is empty for recording:", recordingId);
        message.error("Audio recording is empty.");
        return;
      }

      try {
        // Add to playing set
        setPlayingRecordings((prev) => new Set(prev).add(recordingId));

        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);

        // Create AudioContext and AnalyserNode for waveform visualization
        const audioContext = new (
          globalThis.AudioContext ||
          (globalThis as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        // Create a media element source from the audio element
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Store the audio instance, analyser, and context for later control
        setAudioInstances((prev) => new Map(prev).set(recordingId, audio));
        setAudioAnalysers((prev) => new Map(prev).set(recordingId, analyser));
        setAudioContexts((prev) =>
          new Map(prev).set(recordingId, audioContext),
        );

        // Set up event listeners
        const handleEnded = () => {
          cleanup(recordingId, url, audioContext);
        };

        const handleError = (e: Event) => {
          console.error("Audio playback error:", e);
          cleanup(recordingId, url, audioContext);
          message.error(
            "Failed to play audio. The audio file may be corrupted.",
          );
        };

        const handleLoadedMetadata = () => {
          const duration = audio.duration;
          const validDuration = validateDuration(duration);

          setRecordingProgress((prev) => {
            const newMap = new Map(prev);
            newMap.set(recordingId, { current: 0, duration: validDuration });
            return newMap;
          });
        };

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);

        // Also check duration after a short delay in case metadata loads after play starts
        const checkDurationDelayed = setTimeout(() => {
          if (audio.readyState >= 1) {
            // HAVE_METADATA or higher
            const duration = audio.duration;
            const validDuration = validateDuration(duration);

            if (validDuration > 0) {
              setRecordingProgress((prev) => {
                const newMap = new Map(prev);
                const current = newMap.get(recordingId);
                if (current) {
                  newMap.set(recordingId, {
                    current: current.current,
                    duration: validDuration,
                  });
                } else {
                  newMap.set(recordingId, {
                    current: 0,
                    duration: validDuration,
                  });
                }
                return newMap;
              });
            }
          }
        }, 500);

        // Store timeout reference for cleanup
        (audio as any)._durationCheckTimeout = checkDurationDelayed;

        // Attempt to play
        await audio.play();

        // Start tracking progress
        startProgressTracking(recordingId, audio);

        console.log(
          "Audio playback started successfully for recording:",
          recordingId,
        );
        message.success("Playing recording...");
      } catch (error) {
        console.error("Failed to play recording:", error);
        setPlayingRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recordingId);
          return newSet;
        });
        setAudioInstances((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recordingId);
          return newMap;
        });
        setAudioAnalysers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recordingId);
          return newMap;
        });
        setAudioContexts((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recordingId);
          return newMap;
        });

        if (error instanceof DOMException && error.name === "NotAllowedError") {
          message.error(
            "Browser blocked audio playback. Please click the play button again or check your browser settings.",
          );
        } else {
          message.error(
            `Failed to play audio: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }
      }
    },
    [playingRecordings, cleanup, validateDuration, startProgressTracking],
  );

  const pauseRecording = useCallback(
    (recordingId: number) => {
      const audio = audioInstances.get(recordingId);
      if (audio) {
        audio.pause();
        setPlayingRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recordingId);
          return newSet;
        });
        setPausedRecordings((prev) => new Set(prev).add(recordingId));

        // Stop progress tracking
        const interval = progressIntervalRef.current.get(recordingId);
        if (interval) {
          clearInterval(interval);
          progressIntervalRef.current.delete(recordingId);
        }
      }
    },
    [audioInstances],
  );

  const resumeRecording = useCallback(
    async (recordingId: number) => {
      const audio = audioInstances.get(recordingId);
      if (audio) {
        await audio.play();
        setPausedRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recordingId);
          return newSet;
        });
        setPlayingRecordings((prev) => new Set(prev).add(recordingId));

        // Resume progress tracking
        startProgressTracking(recordingId, audio);
      }
    },
    [audioInstances, startProgressTracking],
  );

  const stopRecording = useCallback(
    (recordingId: number) => {
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

        // Clean up duration check timeout
        if ((audio as any)._durationCheckTimeout) {
          clearTimeout((audio as any)._durationCheckTimeout);
        }

        // Clean up the audio object
        const url = audio.src;
        if (url.startsWith("blob:")) {
          cleanup(recordingId, url, audioContext);
        } else {
          // If URL is not a blob, still clean up state
          cleanup(recordingId, "", audioContext);
        }
      } else if (audioContext) {
        // Clean up context even if audio is gone
        cleanup(recordingId, "", audioContext);
      }
    },
    [audioInstances, audioContexts, cleanup],
  );

  const seekRecording = useCallback(
    (recordingId: number, value: number) => {
      const audio = audioInstances.get(recordingId);
      if (audio) {
        // Validate the seek value
        const validValue =
          isFinite(value) && !isNaN(value) && value >= 0 ? value : 0;

        // Clamp to duration if available
        const progress = recordingProgress.get(recordingId);
        const maxValue =
          progress && isFinite(progress.duration) && progress.duration > 0
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
    },
    [audioInstances, recordingProgress],
  );

  const togglePlayPause = useCallback(
    async (recordingId: number, audioBlob: Blob) => {
      if (playingRecordings.has(recordingId)) {
        pauseRecording(recordingId);
      } else if (pausedRecordings.has(recordingId)) {
        await resumeRecording(recordingId);
      } else {
        await playRecording(recordingId, audioBlob);
      }
    },
    [
      playingRecordings,
      pausedRecordings,
      playRecording,
      pauseRecording,
      resumeRecording,
    ],
  );

  return {
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
  };
};

export default useAudioPlayback;
