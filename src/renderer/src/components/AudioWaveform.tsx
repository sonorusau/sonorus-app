import React, { useEffect, useId, useMemo, useRef, useState } from "react";

interface AudioWaveformProps {
  isActive: boolean;
  analyser?: AnalyserNode | null;
  samples?: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const buildPaths = (samples: number[]) => {
  if (samples.length < 2) {
    return { strokePath: "", fillPath: "" };
  }

  const width = 100;
  const height = 100;
  const midline = height / 2;
  const amplitudeRange = height * 0.28;
  const step = width / (samples.length - 1);

  type Point = { x: number; y: number };

  const topPoints: Point[] = [];
  const bottomPoints: Point[] = [];

  samples.forEach((sample, index) => {
    const x = Number((index * step).toFixed(2));
    const displacement = clamp(sample, -1, 1) * amplitudeRange;

    topPoints.push({ x, y: Number((midline - displacement).toFixed(2)) });
    bottomPoints.push({ x, y: Number((midline + displacement).toFixed(2)) });
  });

  const buildCurve = (points: Point[], moveToStart: boolean): string => {
    if (!points.length) return "";

    let path = moveToStart
      ? `M ${points[0].x} ${points[0].y}`
      : `L ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const deltaX = current.x - prev.x;
      const controlXOffset = deltaX / 3;

      const controlX1 = Number((prev.x + controlXOffset).toFixed(2));
      const controlY1 = Number(prev.y.toFixed(2));
      const controlX2 = Number((current.x - controlXOffset).toFixed(2));
      const controlY2 = Number(current.y.toFixed(2));

      path += ` C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${current.x} ${current.y}`;
    }

    return path;
  };

  const topPath = buildCurve(topPoints, true);
  const mirroredBottomPath = buildCurve(bottomPoints.slice().reverse(), false);

  return {
    strokePath: topPath,
    fillPath: `${topPath}${mirroredBottomPath} Z`
  };
};

const createEmptySamples = (count: number): number[] => new Array(count).fill(0);

const TIMELINE_SECONDS = 2;
const FRAME_RATE_GUESS = 60;
const MIN_SAMPLE_COUNT = 64;
const MAX_SAMPLE_COUNT = 512;

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  analyser = null,
  samples = 480,
}) => {
  const sampleCount = Math.min(Math.max(samples, MIN_SAMPLE_COUNT), MAX_SAMPLE_COUNT);
  const [values, setValues] = useState<number[]>(() => createEmptySamples(sampleCount));
  const animationFrameRef = useRef<number>();
  const rawId = useId();
  const gradientBaseId = useMemo(() => rawId.replace(/:/g, ""), [rawId]);

  useEffect(() => {
    setValues(createEmptySamples(sampleCount));
  }, [sampleCount]);

  useEffect(() => {
    const stopAnimation = () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };

    if (!isActive || !analyser) {
      stopAnimation();

      const fadeOut = () => {
        let maximum = 0;
        setValues((previous) => {
          const faded = previous.map((value) => {
            const next = value * 0.85;
            maximum = Math.max(maximum, Math.abs(next));
            return Math.abs(next) < 0.0005 ? 0 : next;
          });

          return maximum < 0.004 ? createEmptySamples(sampleCount) : faded;
        });

        if (maximum >= 0.004) {
          animationFrameRef.current = requestAnimationFrame(fadeOut);
        } else {
          animationFrameRef.current = undefined;
        }
      };

      animationFrameRef.current = requestAnimationFrame(fadeOut);
      return stopAnimation;
    }

    const bufferLength = analyser.fftSize;
    if (!bufferLength) {
      return stopAnimation;
    }

    const dataArray = new Uint8Array(bufferLength);
    const targetChunkSize = Math.max(
      Math.round(sampleCount / (TIMELINE_SECONDS * FRAME_RATE_GUESS)),
      1
    );
    const chunkSize = Math.min(targetChunkSize, sampleCount);

    const renderFrame = () => {
      analyser.getByteTimeDomainData(dataArray);

      const step = Math.max(Math.floor(bufferLength / chunkSize), 1);
      const newChunk: number[] = [];

      for (let index = 0; index < bufferLength && newChunk.length < chunkSize; index += step) {
        const normalized = dataArray[index] / 128 - 1;
        newChunk.push(clamp(normalized, -1, 1));
      }

      if (newChunk.length > 0) {
        setValues((previous) => {
          if (previous.length !== sampleCount) {
            return [...createEmptySamples(sampleCount - newChunk.length), ...newChunk];
          }

          const trimmed = previous.slice(newChunk.length);
          const baseline = trimmed.length
            ? trimmed[trimmed.length - 1]
            : previous.length
              ? previous[previous.length - 1]
              : 0;

          const smoothedChunk: number[] = [];
          newChunk.forEach((value, index) => {
            const anchor = index === 0 ? baseline : smoothedChunk[index - 1];
            smoothedChunk.push(anchor * 0.3 + value * 0.7);
          });

          const merged = trimmed.concat(smoothedChunk);

          if (merged.length < sampleCount) {
            return [...createEmptySamples(sampleCount - merged.length), ...merged];
          }

          return merged.slice(merged.length - sampleCount);
        });
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return stopAnimation;
  }, [analyser, isActive, sampleCount]);

  const { strokePath, fillPath } = useMemo(() => buildPaths(values), [values]);

  const strokeGradientId = `${gradientBaseId}-stroke`;
  const fillGradientId = `${gradientBaseId}-fill`;

  return (
    <div className={`audio-waveform ${isActive ? "audio-waveform--active" : "audio-waveform--inactive"}`}>
      <svg
        className="audio-waveform__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={strokeGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(172, 172, 230, 0.9)" />
            <stop offset="70%" stopColor="rgba(140, 125, 209, 0.95)" />
            <stop offset="100%" stopColor="rgba(132, 112, 210, 0.9)" />
          </linearGradient>
          <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(172, 172, 230, 0.28)" />
            <stop offset="60%" stopColor="rgba(140, 125, 209, 0.18)" />
            <stop offset="100%" stopColor="rgba(124, 103, 206, 0.08)" />
          </linearGradient>
        </defs>

        {fillPath && (
          <path
            d={fillPath}
            fill={`url(#${fillGradientId})`}
            className="audio-waveform__fill"
          />
        )}

        <line x1="0" y1="50" x2="100" y2="50" className="audio-waveform__baseline" />

        {strokePath && (
          <path
            d={strokePath}
            stroke={`url(#${strokeGradientId})`}
            className="audio-waveform__stroke"
          />
        )}
      </svg>
    </div>
  );
};

export default AudioWaveform;
