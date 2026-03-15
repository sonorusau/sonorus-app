import type HeartLocation from "./HeartLocation";
import type Patient from "./Patient";
import type SkinBarrier from "./SkinBarrier";

export interface ValveAnalysis {
  valve: HeartLocation;
  regurgitation_percentage: number;
  stenosis_percentage: number;
  severity_level: "Normal" | "Mild" | "Moderate" | "Severe";
  notes?: string;
}

export interface ComprehensiveAnalysisResult {
  patient: Patient;
  session_timestamp: string;
  analysis_timestamp: string;
  valve_analyses: ValveAnalysis[];
  skin_barriers: SkinBarrier[];
  overall_assessment: string;
  recommendations: string[];
}

export interface AnalysisProcessingState {
  is_processing: boolean;
  progress_percentage: number;
  current_step: string;
  time_remaining: number;
}
