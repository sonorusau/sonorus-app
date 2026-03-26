import React, { useState, useEffect } from "react";
import { Progress } from "antd";
import { HeartOutlined, LoadingOutlined } from "@ant-design/icons";
import GlassCard from "./GlassCard";
import Title from "antd/es/typography/Title";

interface AnalysisProcessorProps {
  onAnalysisComplete: () => void;
  duration?: number; // Duration in milliseconds, default 3000
}

function AnalysisProcessor({
  onAnalysisComplete,
  duration = 3000,
}: AnalysisProcessorProps): JSX.Element {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing analysis...");
  const [timeRemaining, setTimeRemaining] = useState(3);

  const analysisSteps = [
    "Initializing analysis...",
    "Processing heart sound recordings...",
    "Analyzing valve functionality...",
    "Calculating regurgitation percentages...",
    "Evaluating stenosis indicators...",
    "Generating comprehensive report...",
    "Analysis complete!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 100 / (duration / 100);

        // Update current step based on progress
        const stepIndex = Math.floor(
          (newProgress / 100) * (analysisSteps.length - 1),
        );
        setCurrentStep(
          analysisSteps[Math.min(stepIndex, analysisSteps.length - 1)],
        );

        // Update time remaining
        const remainingTime = Math.ceil(
          (duration - (newProgress / 100) * duration) / 1000,
        );
        setTimeRemaining(Math.max(0, remainingTime));

        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onAnalysisComplete();
          }, 200); // Small delay for smooth transition
          return 100;
        }

        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onAnalysisComplete]);

  return (
    <div className="analysis-processor text-center">
      <GlassCard padding="lg" className="w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HeartOutlined className="text-purple-400 text-2xl animate-heartbeat" />
            <Title level={2} style={{ color: "white", margin: 0 }}>
              Comprehensive Analysis
            </Title>
            <LoadingOutlined className="text-purple-400 text-2xl" />
          </div>

          <p className="text-white/70 text-lg mb-2">
            AI analyzing all heart sounds together
          </p>

          <p className="text-white/60 text-sm">
            Processing recordings from all 4 valve areas...
          </p>
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <div className="mb-4">
            <Progress
              percent={Math.round(progress)}
              strokeColor={{
                "0%": "#744AA1",
                "50%": "#8C7DD1",
                "100%": "#ACACE6",
              }}
              trailColor="rgba(255,255,255,0.1)"
              strokeWidth={8}
              showInfo={false}
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">
              {Math.round(progress)}% Complete
            </span>
            <span className="text-white/60">{timeRemaining}s remaining</span>
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <LoadingOutlined className="text-white/80" />
            <span className="text-white font-medium">{currentStep}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {["Aortic", "Pulmonary", "Tricuspid", "Mitral"].map(
              (valve, index) => (
                <div
                  key={valve}
                  className={`p-2 rounded-lg border transition-all duration-300 ${
                    progress > (index + 1) * 25
                      ? "bg-green-500/20 border-green-500/40"
                      : progress > index * 25
                        ? "bg-purple-500/20 border-purple-500/40 animate-pulse"
                        : "bg-white/10 border-white/20"
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`text-xs font-medium ${
                        progress > (index + 1) * 25
                          ? "text-green-400"
                          : progress > index * 25
                            ? "text-purple-400"
                            : "text-white/60"
                      }`}
                    >
                      {valve}
                    </div>
                    {progress > (index + 1) * 25 && (
                      <div className="text-green-400 text-xs mt-1">✓</div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Analysis Status */}
        <div className="text-center">
          <div className="text-white/60 text-xs">
            Advanced AI algorithms processing heart sound patterns...
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default AnalysisProcessor;
