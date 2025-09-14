import React, { useState, useEffect } from "react";
import { Input, Select, DatePicker, Space, Tooltip } from "antd";
import { 
  SearchOutlined, 
  FilterOutlined,
  HeartOutlined,
  CalendarOutlined,
  UserOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Recording {
  id: number;
  patientId: number;
  patientName: string;
  date: string;
  time: string;
  duration: string;
  heartArea: "aortic" | "pulmonary" | "tricuspid" | "mitral";
  result: "Normal" | "Abnormal" | "Pending";
  status: "completed" | "flagged" | "processing";
  deviceId?: string;
  notes?: string;
}

const mockRecordings: Recording[] = [
  {
    id: 1,
    patientId: 1,
    patientName: "Liam Carter",
    date: "2024-01-15",
    time: "10:30 AM",
    duration: "45s",
    heartArea: "mitral",
    result: "Normal",
    status: "completed",
    deviceId: "steth-001",
    notes: "Clear heart sounds, no murmurs detected"
  },
  {
    id: 2,
    patientId: 1,
    patientName: "Liam Carter", 
    date: "2024-01-10",
    time: "2:15 PM",
    duration: "38s",
    heartArea: "aortic",
    result: "Normal",
    status: "completed",
    deviceId: "steth-001"
  },
  {
    id: 3,
    patientId: 2,
    patientName: "Sarah Johnson",
    date: "2024-01-05", 
    time: "9:45 AM",
    duration: "52s",
    heartArea: "tricuspid",
    result: "Abnormal",
    status: "flagged",
    deviceId: "steth-002",
    notes: "Irregular heart rhythm detected, recommend further evaluation"
  },
  {
    id: 4,
    patientId: 3,
    patientName: "Michael Brown",
    date: "2024-01-20",
    time: "11:00 AM", 
    duration: "41s",
    heartArea: "pulmonary",
    result: "Normal",
    status: "completed",
    deviceId: "steth-001"
  },
  {
    id: 5,
    patientId: 2,
    patientName: "Sarah Johnson",
    date: "2024-01-22",
    time: "3:30 PM",
    duration: "35s", 
    heartArea: "aortic",
    result: "Pending",
    status: "processing",
    deviceId: "steth-001"
  }
];

function RecordingsList(): JSX.Element {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [heartAreaFilter, setHeartAreaFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    filterRecordings();
  }, [recordings, searchTerm, statusFilter, heartAreaFilter, dateRange]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setRecordings(mockRecordings);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading recordings:', error);
      setLoading(false);
    }
  };

  const filterRecordings = () => {
    let filtered = recordings;

    if (searchTerm) {
      filtered = filtered.filter(recording =>
        recording.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.heartArea.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(recording => recording.status === statusFilter);
    }

    if (heartAreaFilter !== "all") {
      filtered = filtered.filter(recording => recording.heartArea === heartAreaFilter);
    }

    if (dateRange) {
      filtered = filtered.filter(recording => {
        const recordingDate = dayjs(recording.date);
        return recordingDate.isAfter(dateRange[0]) && recordingDate.isBefore(dateRange[1]);
      });
    }

    setFilteredRecordings(filtered);
  };

  const getHeartAreaIcon = (area: string) => {
    // Return empty string - no emojis for heart areas
    return "";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#10b981";
      case "flagged": return "#f59e0b";  
      case "processing": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "Normal": return "#10b981";
      case "Abnormal": return "#ef4444";
      case "Pending": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const formatHeartArea = (area: string) => {
    return area.charAt(0).toUpperCase() + area.slice(1);
  };

  return (
    <div className="recordings-list-container max-w-7xl mx-auto">
      <div className="mb-6">
        <Title level={2} style={{ color: 'white', margin: 0 }}>
          All Recordings
        </Title>
        <p className="text-white/70 text-lg mt-2">
          View and manage all heart sound recordings across all patients
        </p>
      </div>

      {/* Filters */}
      <GlassCard padding="md" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-white/70 text-sm block mb-2">Search</label>
            <Input
              placeholder="Search by patient or heart area..."
              prefix={<SearchOutlined className="text-white/60" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              size="large"
            />
          </div>
          
          <div>
            <label className="text-white/70 text-sm block mb-2">Status</label>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
              size="large"
              style={{ 
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid #ACACE6"
              }}
            >
              <Option value="all">All Statuses</Option>
              <Option value="completed">Completed</Option>
              <Option value="flagged">Flagged</Option>
              <Option value="processing">Processing</Option>
            </Select>
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">Heart Area</label>
            <Select
              value={heartAreaFilter}
              onChange={setHeartAreaFilter}
              className="w-full"
              size="large"
              style={{ 
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid #ACACE6"
              }}
            >
              <Option value="all">All Areas</Option>
              <Option value="aortic">Aortic</Option>
              <Option value="pulmonary">Pulmonary</Option>
              <Option value="tricuspid">Tricuspid</Option>
              <Option value="mitral">Mitral</Option>
            </Select>
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">Date Range</label>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full"
              size="large"
              style={{ 
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid #ACACE6"
              }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20">
          <span className="text-white/60">
            Showing {filteredRecordings.length} of {recordings.length} recordings
          </span>
          <GlassButton
            variant="secondary"
            size="sm"
            icon={<FilterOutlined />}
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setHeartAreaFilter("all");
              setDateRange(null);
            }}
          >
            Clear Filters
          </GlassButton>
        </div>
      </GlassCard>

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <GlassCard padding="lg">
            <div className="text-center text-white/60 py-8">
              Loading recordings...
            </div>
          </GlassCard>
        ) : filteredRecordings.length === 0 ? (
          <GlassCard padding="lg">
            <div className="text-center text-white/60 py-8">
              No recordings found matching your criteria.
            </div>
          </GlassCard>
        ) : (
          filteredRecordings.map((recording) => (
            <GlassCard key={recording.id} padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Recording Info */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg flex-1">
                        {formatHeartArea(recording.heartArea)} Valve
                      </h3>
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 flex items-center gap-1 justify-center"
                        style={{ 
                          backgroundColor: `${getStatusColor(recording.status)}20`,
                          color: getStatusColor(recording.status),
                          minWidth: '100px'
                        }}
                      >
                        {recording.status === 'completed' ? (
                          <CheckCircleOutlined />
                        ) : recording.status === 'flagged' ? (
                          <ExclamationCircleOutlined />
                        ) : (
                          <PlayCircleOutlined />
                        )}
                        <span>{recording.status.charAt(0).toUpperCase() + recording.status.slice(1)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <UserOutlined className="text-white/60 flex-shrink-0" />
                        <span className="text-white truncate">{recording.patientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarOutlined className="text-white/60 flex-shrink-0" />
                        <span className="text-white/70 truncate">{recording.date} at {recording.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HeartOutlined className="text-white/60 flex-shrink-0" />
                        <span className="text-white/70">{recording.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HeartOutlined className="text-white/60 flex-shrink-0" />
                        <span className="text-white/60 flex-shrink-0">Result:</span>
                        <span 
                          className="font-medium truncate"
                          style={{ color: getResultColor(recording.result) }}
                        >
                          {recording.result}
                        </span>
                      </div>
                    </div>

                    {recording.notes && (
                      <div className="mt-2 p-2 bg-white/10 rounded text-sm">
                        <span className="text-white/60">Notes: </span>
                        <span className="text-white">{recording.notes}</span>
                      </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Tooltip title="Play Recording">
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      icon={<PlayCircleOutlined />}
                    />
                  </Tooltip>
                  <Tooltip title="Download">
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      icon={<DownloadOutlined />}
                    />
                  </Tooltip>
                  {recording.status === "flagged" && (
                    <Tooltip title="Needs Attention">
                      <GlassButton
                        variant="danger"
                        size="sm"
                        icon={<ExclamationCircleOutlined />}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}

export default RecordingsList;