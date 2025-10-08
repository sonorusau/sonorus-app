# Sonorus - Heart Sound Analysis Application

## 📋 Project Overview

**Sonorus** is a professional medical-grade heart sound analysis application built with React, TypeScript, and Electron. The application enables healthcare professionals to record, analyze, and manage heart sound data from multiple valve areas for comprehensive cardiac assessment.

## 🎨 Design System & Color Scheme

### Brand Colors
- **Primary Purple**: `#744AA1` (116, 74, 161) - Main brand color
- **Secondary Blue**: `#0672E5` (6, 114, 229) - Accent color
- **Tertiary Purple**: `#8C7DD1` (140, 125, 209) - Interactive elements
- **Periwinkle**: `#ACACE6` (172, 172, 230) - Borders and highlights

### Theme System
The application supports **Dark**, **Light**, and **System** theme modes with automatic detection.

#### Dark Theme (Default)
```css
--glass-bg: rgba(255, 255, 255, 0.03);
--glass-border: rgba(172, 172, 230, 0.15);
--glass-bg-hover: rgba(255, 255, 255, 0.06);
```

#### Light Theme
```css
--glass-bg: rgba(248, 250, 252, 0.8);
--glass-border: rgba(226, 232, 240, 1);
--glass-bg-hover: rgba(241, 245, 249, 0.9);
```

### Visual Design Philosophy
- **Glassmorphism**: Ultra-translucent glass effects with minimal blur
- **Medical Professional**: Clean, clinical appearance suitable for healthcare
- **Minimalist**: Reduced visual noise, focus on functionality
- **Accessibility**: High contrast ratios and readable typography

## 🏗️ Application Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS + Ant Design (antd)
- **Routing**: React Router with Hash routing
- **Desktop**: Electron framework
- **State Management**: React Context (Theme, Local State)

### File Structure
```
src/renderer/src/
├── components/
│   ├── GlassCard.tsx          # Translucent container component
│   ├── GlassButton.tsx        # Interactive button with glass effect
│   ├── FeaturePageLayout.tsx  # Main app layout wrapper
│   ├── BackgroundLayout.tsx   # Background and theme provider
│   └── Navbar.tsx            # Navigation component
├── pages/
│   ├── HomePage.tsx          # Landing page with navigation cards
│   ├── QuickScanPage.tsx     # Heart recording dashboard
│   ├── RecordingsList.tsx    # All recordings management
│   ├── AddFiles.tsx          # Patient records (PatientSelect)
│   └── Settings.tsx          # Application configuration
├── contexts/
│   └── ThemeContext.tsx      # Theme management system
└── styles/
    └── theme.css             # CSS variables and theme definitions
```

## 📱 Application Pages & Features

### 1. HomePage (`/`)
- **Purpose**: Landing page with navigation to main features
- **Features**: 
  - Glassmorphic navigation cards
  - Sonorus branding and logo display
  - Quick access to Patient Records and Quick Scan
- **Design**: Centered layout with translucent action cards

### 2. Quick Scan (`/quick-scan`)
**Comprehensive 4-Part Heart Recording Dashboard**

#### Key Features:
- **Interactive Anatomical Chest Diagram**: Clickable SVG showing realistic torso with heart valve positions
- **4-Valve Recording Workflow**: Aortic, Pulmonary, Tricuspid, Mitral
- **Real-time Progress Tracking**: Visual indicators for each completed recording
- **Connected Progress Steps**: Horizontal progress line with numbered circles
- **Compact Dashboard Layout**: No-scroll design fitting everything on screen

#### Recording Process:
1. **Select Heart Area**: Click on anatomical diagram or legend
2. **Record**: 30-second max recording with visual feedback
3. **Complete All 4 Areas**: System tracks completion status
4. **Comprehensive Analysis**: AI processes all recordings together
5. **Professional Results**: Medical-grade analysis report

#### UI Components:
- **3-Column Grid Layout**: Recording controls (2 cols) + Progress steps (1 col)
- **Anatomical Chest SVG**: 280×380px with clickable valve areas
- **Progress Indicators**: Color-coded completion status
- **Recording Visualizer**: Animated heart emoji with sound waves

### 3. All Recordings (`/recordings`)
**Advanced Filtering & Management System**

#### Features:
- **Multi-Filter System**: Status, Heart Area, Date Range, Search
- **Card-Based Display**: Individual recording cards with metadata
- **Status Management**: Completed, Flagged, Processing with icons
- **Action Buttons**: Play, Download, Flag for attention
- **Responsive Grid**: Adapts to screen size

#### Filter Options:
- **Search**: Patient name or heart area
- **Status**: All, Completed, Flagged, Processing
- **Heart Area**: All, Aortic, Pulmonary, Tricuspid, Mitral  
- **Date Range**: Calendar picker for time-based filtering

### 4. Patient Records (`/patients`)
**Comprehensive Patient Management**

#### Features:
- **Patient Selection**: Dropdown with search functionality
- **Detailed Profiles**: Demographics, medical history, vitals
- **Recording History**: Timeline of all patient recordings
- **Quick Actions**: Add new recordings, view existing data

### 5. Settings (`/settings`)
**Complete Configuration Management**

#### Categories:
- **Appearance**: Theme selection (Dark/Light/System)
- **Device Settings**: Auto-connect, timeout, audio feedback
- **Recording Settings**: Length, compression, auto-save
- **Analysis Settings**: Mode, confidence threshold, real-time
- **Data & Privacy**: Retention, export format, anonymization
- **Notifications**: Alerts and system notifications
- **Advanced**: Debug mode, API endpoints, custom notes

## 🔧 Technical Implementation Details

### Component Architecture

#### GlassCard Component
```tsx
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: "sm" | "md" | "lg";
}
```
- **Ultra-translucent**: `backdrop-blur-md` with 3% opacity
- **Theme-aware**: Uses CSS custom properties
- **Interactive**: Hover effects with subtle scaling
- **Responsive**: Adaptive padding system

#### GlassButton Component
```tsx
interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  icon?: ReactNode;
}
```
- **4 Variants**: Each with custom styling and opacity
- **Minimal blur**: `backdrop-blur-sm` for cleaner appearance
- **Interactive states**: Hover scale, active press effects

### Heart Valve Recording System

#### Data Structure
```tsx
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
  notes?: string;
}
```

#### Anatomical Positioning
- **Aortic**: 2nd intercostal space, right sternal border
- **Pulmonary**: 2nd intercostal space, left sternal border  
- **Tricuspid**: 4th intercostal space, left sternal border
- **Mitral**: 5th intercostal space, apex (mid-clavicular line)

### Theme Management System

#### ThemeContext Implementation
```tsx
type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}
```

#### Features:
- **System Detection**: Automatically follows OS preference
- **Persistent Storage**: Saves preference to localStorage
- **Real-time Switching**: Instant theme updates
- **Media Query Integration**: Responds to system changes

## 🎯 User Experience & Design Decisions

### Medical Professional Focus
- **Clinical Aesthetics**: Clean, professional appearance suitable for medical environments
- **Workflow Optimization**: 4-part recording process mirrors real cardiac examination
- **Data Integrity**: Comprehensive tracking and result storage
- **Accessibility**: High contrast, clear typography, intuitive navigation

### Performance Optimizations
- **Minimal Blur Effects**: Reduced from `backdrop-blur-xl` to `backdrop-blur-md/sm`
- **Ultra-low Opacity**: Glass backgrounds at 3% for maximum translucency
- **Efficient Layouts**: Grid systems optimized for space utilization
- **Compact Design**: Dashboard approach minimizes scrolling

### Interactive Elements
- **Hover Feedback**: Subtle scale effects (1.02x-1.05x)
- **Visual States**: Color-coded completion status
- **Progress Tracking**: Real-time updates with connecting lines
- **Anatomical Interaction**: Clickable chest diagram for intuitive selection

## 🛠️ Development Patterns & Best Practices

### State Management
- **Local State**: React useState for component-level data
- **Context**: Theme and global application state
- **Derived State**: Computed values for UI states
- **Persistent Data**: localStorage for settings and preferences

### Styling Approach
- **CSS Custom Properties**: Theme-aware color systems
- **Tailwind Utility Classes**: Rapid development with consistency
- **Component-Scoped Styles**: Isolated styling per component
- **Responsive Design**: Mobile-first approach with breakpoints

### Code Organization
- **Feature-Based Structure**: Pages grouped by functionality
- **Shared Components**: Reusable UI elements with consistent props
- **Type Safety**: Full TypeScript coverage with interfaces
- **Clean Architecture**: Separation of concerns and modularity

### 🔒 Critical Type Safety Rules
- **Zero Interface Modifications**: Will not change any existing type definitions
- **Types and Enums Folder Protection**: Claude should never update anything in `src/renderer/src/types/` or `src/renderer/src/enums/` folders
- **Strict Type Adherence**: All code must strictly follow existing interfaces and enums without modifications
- **Type Immutability**: Existing type contracts are considered immutable and must be preserved

## 📊 Key Metrics & Specifications

### Performance Targets
- **Load Time**: < 2 seconds initial page load
- **Interaction Response**: < 100ms for UI feedback
- **Memory Usage**: Optimized for desktop application constraints
- **File Size**: Minimal bundle with tree-shaking

### Accessibility Standards
- **WCAG 2.1 AA Compliance**: Color contrast and keyboard navigation
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Keyboard Navigation**: Full functionality without mouse
- **High Contrast Mode**: Automatic detection and adaptation

## 🔮 Future Enhancements

### Technical Roadmap
- **Real Device Integration**: Bluetooth stethoscope connectivity
- **Advanced Analytics**: Machine learning heart sound classification
- **Cloud Sync**: Patient data synchronization across devices
- **Export System**: PDF reports and data export functionality
- **Offline Mode**: Local data storage and sync capabilities

### UX Improvements
- **Onboarding**: Interactive tutorial for new users
- **Keyboard Shortcuts**: Power user productivity features
- **Customization**: User-configurable dashboard layouts
- **Mobile Version**: Touch-optimized interface for tablets

## 📋 Configuration & Setup

### Environment Requirements
- **Node.js**: v16+ for development
- **Electron**: Desktop application framework
- **TypeScript**: v4.5+ for type safety
- **Tailwind CSS**: v3+ for styling system

### Development Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production  
npm run lint       # Code quality checks
npm run typecheck  # TypeScript validation
```

### Key Dependencies
- **React**: ^18.0.0 - UI framework
- **Ant Design**: ^5.0.0 - Component library
- **React Router**: ^6.0.0 - Navigation
- **Dayjs**: Date manipulation
- **Tailwind CSS**: ^3.0.0 - Utility styling

---

## 🏥 Medical Compliance & Standards

### Healthcare Focus
- **HIPAA Considerations**: Patient data protection patterns
- **Clinical Workflow**: Mirrors standard cardiac examination procedures  
- **Professional Terminology**: Accurate medical language and descriptions
- **Data Integrity**: Audit trails and recording verification

### Quality Assurance
- **Code Reviews**: Multi-layer validation process
- **Testing Strategy**: Unit and integration test coverage
- **Error Handling**: Graceful degradation and user feedback
- **Documentation**: Comprehensive inline and external docs

---

*Last Updated: January 2025*  
*Sonorus v1.0 - Professional Heart Sound Analysis Platform*