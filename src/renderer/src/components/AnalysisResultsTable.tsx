import React from "react";
import { Table } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import GlassCard from "./GlassCard";
import Title from "antd/es/typography/Title";
import type { ComprehensiveAnalysisResult } from "../types/HeartAnalysis";

interface AnalysisResultsTableProps {
  analysisResult: ComprehensiveAnalysisResult;
}

function AnalysisResultsTable({
  analysisResult,
}: AnalysisResultsTableProps): JSX.Element {
  const {
    patient,
    valve_analyses,
    skin_barriers,
    overall_assessment,
    recommendations,
  } = analysisResult;

  // Calculate patient age from DOB
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Normal":
        return "#10b981"; // Green
      case "Mild":
        return "#f59e0b"; // Amber
      case "Moderate":
        return "#f97316"; // Orange
      case "Severe":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Normal":
        return <CheckCircleOutlined className="text-green-500" />;
      case "Mild":
        return <ExclamationCircleOutlined className="text-yellow-500" />;
      case "Moderate":
        return <WarningOutlined className="text-orange-500" />;
      case "Severe":
        return <WarningOutlined className="text-red-500" />;
      default:
        return null;
    }
  };

  const formatValveName = (valve: string): string => {
    return valve.charAt(0).toUpperCase() + valve.slice(1) + " Valve";
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`;
  };

  const columns = [
    {
      title: "Heart Valve",
      dataIndex: "valve",
      key: "valve",
      render: (valve: string) => (
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">
            {formatValveName(valve)}
          </span>
        </div>
      ),
    },
    {
      title: "Regurgitation",
      dataIndex: "regurgitation_percentage",
      key: "regurgitation",
      render: (percentage: number) => (
        <div className="text-center">
          <span className="text-white font-mono text-sm">
            {formatPercentage(percentage)}
          </span>
        </div>
      ),
    },
    {
      title: "Stenosis",
      dataIndex: "stenosis_percentage",
      key: "stenosis",
      render: (percentage: number) => (
        <div className="text-center">
          <span className="text-white font-mono text-sm">
            {formatPercentage(percentage)}
          </span>
        </div>
      ),
    },
    {
      title: "Assessment",
      dataIndex: "severity_level",
      key: "severity",
      render: (severity: string) => (
        <div className="flex items-center justify-center gap-2">
          {getSeverityIcon(severity)}
          <span
            className="font-medium text-sm"
            style={{ color: getSeverityColor(severity) }}
          >
            {severity}
          </span>
        </div>
      ),
    },
  ];

  const dataSource = valve_analyses.map((analysis, index) => ({
    key: index,
    ...analysis,
  }));

  return (
    <div className="analysis-results">
      <GlassCard padding="lg" className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <Title level={2} style={{ color: "white", margin: 0 }}>
              Comprehensive Heart Analysis
            </Title>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-white/10 border border-white/20">
            <div className="text-center">
              <div className="text-white/60 text-sm">Patient</div>
              <div className="text-white font-semibold">{patient.name}</div>
            </div>
            <div className="text-center">
              <div className="text-white/60 text-sm">Age</div>
              <div className="text-white font-semibold">
                {calculateAge(patient.dob)} years old
              </div>
            </div>
            <div className="text-center">
              <div className="text-white/60 text-sm">Session Time</div>
              <div className="text-white font-semibold">
                {new Date(
                  analysisResult.session_timestamp,
                ).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Skin Barriers (if any) */}
        {skin_barriers.length > 0 && (
          <div className="mb-6">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="text-yellow-400 text-sm font-medium mb-3 text-center">
                Active Skin Barriers Considered in Analysis
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {skin_barriers.map((barrier, index) => (
                  <div
                    key={index}
                    className="text-center p-2 rounded bg-yellow-500/20"
                  >
                    <div className="text-yellow-300 text-xs font-medium">
                      {barrier.level} {barrier.option}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="mb-6">
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            className="analysis-results-table"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          />
        </div>

        {/* Overall Assessment */}
        <div className="mb-6">
          <div className="p-4 rounded-lg bg-white/10 border border-white/20">
            <div className="text-white/70 text-sm font-medium mb-2">
              Overall Assessment:
            </div>
            <div className="text-white text-base">{overall_assessment}</div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-blue-400 text-sm font-medium mb-3">
                Clinical Recommendations:
              </div>
              <ul className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <li
                    key={index}
                    className="text-blue-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Analysis Timestamp */}
        <div className="text-center">
          <div className="text-white/50 text-xs">
            Analysis completed:{" "}
            {new Date(analysisResult.analysis_timestamp).toLocaleString()}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default AnalysisResultsTable;
