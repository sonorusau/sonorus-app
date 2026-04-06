# Sonorus Marketing Video - Scene Breakdown

**Total Duration**: 60-90 seconds
**Total Scenes**: 8
**Production Tool**: Kite

---

## Scene 1: Opening Hook
**Timestamp**: 0:00-0:10
**Duration**: 10 seconds
**App Area**: N/A (text-only scene)

### Content
**Voiceover**: "Traditional cardiac screenings are time-consuming, complex, and prone to human error."

**Visual Elements**:
- Dark background (medical blue or black)
- Text overlays appearing sequentially:
  - ❌ Manual processes (0:03)
  - ❌ Inconsistent analysis (0:06)
  - ❌ Disconnected workflows (0:09)

### Kite Actions
1. **Fade in** from black (0.5s)
2. **Text animation**: Each line slides in from left with subtle fade
3. **Background**: Optional blurred medical imagery or abstract patterns
4. **Camera**: Static frame

### Transition
- **Type**: Fade to black (0.3s)
- **Next**: Logo reveal leading into app

---

## Scene 2: App Launch & Landing Page
**Timestamp**: 0:10-0:20
**Duration**: 10 seconds
**App Area**: HomePage (`/`)

### Content
**Voiceover**: "Introducing Sonorus — the intelligent cardiac screening platform designed for healthcare professionals."

**Visual Elements**:
- Sonorus logo in glassmorphic container (center)
- Two large action cards:
  - "Quick Scan" (left)
  - "Patient Records" (right)
- Dark gradient background with subtle purple accents

### Kite Actions
1. **Camera zoom**: Start at 80%, zoom to 100% focused on logo (1s)
2. **Text overlay**: "Sonorus: AI-Powered Heart Sound Analysis" appears below logo (0:08-0:20)
3. **Cursor movement**: Auto-follow from logo → "Quick Scan" card (0.8s)
4. **Hover effect**: Card scales to 1.02x with purple glow (#8C7DD1)
5. **Click action**: Cursor clicks "Quick Scan" button (0:19)

### Transition
- **Type**: Smooth page navigation animation (0.3s)
- **Next**: Quick Scan page loads

---

## Scene 3: Heart Location Selection
**Timestamp**: 0:20-0:32
**Duration**: 12 seconds
**App Area**: QuickScanPage - Section 2 (Heart Location Selection)

### Content
**Voiceover**: "Record from all four heart valve areas with our interactive anatomical guide."

**Visual Elements**:
- Interactive chest diagram (350px, centered)
- 4 clickable valve circles:
  - A (Aortic) - 2nd intercostal, right sternal
  - P (Pulmonary) - 2nd intercostal, left sternal
  - T (Tricuspid) - 4th intercostal, left sternal
  - M (Mitral) - 5th intercostal, apex
- Legend on right: Area names with descriptions

### Kite Actions
1. **Camera zoom**: 100% → 150% focused on chest diagram (0.5s)
2. **Cursor sequence** (0.5s per valve):
   - Move to Aortic (A) circle → Click → Circle turns purple (#8C7DD1)
   - Move to Pulmonary (P) → Click → Circle turns purple
   - Move to Tricuspid (T) → Click → Circle turns purple
   - Move to Mitral (M) → Click → Circle turns purple
3. **Visual feedback**: Each clicked circle shows checkmark (✓)
4. **Progress indicator**: Top progress line fills 25% per valve
5. **Hover effect**: Circle scales 1.1x on hover

### Transition
- **Type**: Pan right (0.5s)
- **Next**: Recording controls section

---

## Scene 4: Recording & Waveform Visualization
**Timestamp**: 0:32-0:42
**Duration**: 10 seconds
**App Area**: QuickScanPage - Section 3 (Recording Controls)

### Content
**Voiceover**: "Real-time waveform visualization captures every detail."

**Visual Elements**:
- Large purple "Record" button (center-left)
- Real-time audio waveform with purple gradient
- Timer display: "00:05 / 00:30"
- Animated heart emoji with sound wave ripples
- Selected area label: "Recording: Aortic Valve"

### Kite Actions
1. **Camera position**: 150% zoom on recording controls (0.5s)
2. **Cursor movement**: Auto-follow to "Record" button (0.3s)
3. **Click action**: Button press → Changes to "Stop Recording" (red)
4. **Waveform animation** (4-5s showcase):
   - Purple gradient waveform moves left-to-right
   - Peaks and valleys animate smoothly
   - Timer increments: 00:01 → 00:02 → 00:03...
   - Heart emoji pulses in sync (scale 1.0x → 1.15x → 1.0x)
   - Sound wave ripples expand outward
5. **Stop action**: Cursor clicks "Stop Recording" (0:38)
6. **Processing**: Brief "Analyzing..." text appears (1s)

### Transition
- **Type**: Smooth scroll down (0.5s)
- **Next**: Analysis results table

---

## Scene 5: Analysis Results Display
**Timestamp**: 0:42-0:50
**Duration**: 8 seconds
**App Area**: QuickScanPage - Section 4 (Analysis Results)

### Content
**Voiceover**: "AI-powered analysis delivers comprehensive results in seconds, with color-coded severity indicators and clinical recommendations."

**Visual Elements**:
- Patient info header: "Sarah Johnson, 34 years | Session: 2024-01-15"
- Analysis results table (4 rows):
  - Columns: Heart Valve | Regurgitation % | Stenosis % | Assessment
  - Color-coded status icons (✓ green, ⚠️ yellow, ⚠️ orange, ❌ red)
- Overall assessment text box
- Clinical recommendations (blue box with bullet points)

### Kite Actions
1. **Camera zoom**: 150% → 120% to show full table (0.5s)
2. **Highlight sequence** (0.4s per row):
   - **Aortic Valve**: 2.3% regurg, 1.1% stenosis → Green "Normal" ✓
   - **Pulmonary Valve**: 3.5% regurg, 0.8% stenosis → Green "Normal" ✓
   - **Tricuspid Valve**: 5.2% regurg, 1.9% stenosis → Yellow "Mild" ⚠️
   - **Mitral Valve**: 1.8% regurg, 0.5% stenosis → Green "Normal" ✓
3. **Row animation**: Each row fades in with subtle slide-up effect
4. **Cursor movement**: Auto-follow down table rows
5. **Final pan**: Scroll to recommendations section (0.5s)
6. **Recommendations**: 3 bullet points appear sequentially

### Transition
- **Type**: Fade to benefits overlay (0.3s)
- **Next**: Benefits summary screen

---

## Scene 6: Patient Recordings Management [OPTIONAL]
**Timestamp**: 0:50-0:58
**Duration**: 8 seconds
**App Area**: RecordingsList (`/recordings`)

### Content
**Voiceover**: (Background continuation from previous scene)

**Visual Elements**:
- Patient-grouped recording cards in grid layout
- Filter system: Search, Status dropdown, Heart Area filter, Date range
- Recording cards showing:
  - Patient name, date, time, duration
  - Heart area icon
  - Status badge (Completed, Flagged, Processing)
  - Playback controls with waveform seek bar

### Kite Actions
1. **Camera pan**: Quick horizontal pan across recordings list (1s)
2. **Cursor hover**: Move to filter dropdown → Opens (0.5s)
3. **Filter selection**: Click "Aortic" from heart area filter
4. **Recording interaction**:
   - Click on a recording card → Expands
   - Playback waveform appears
   - Cursor hovers over waveform (seek functionality)
5. **Action buttons**: Highlight download and delete icons

### Transition
- **Type**: Quick fade (0.3s)
- **Next**: Benefits summary

**Note**: This scene can be cut if video exceeds 75 seconds. Priority is lower than core workflow scenes.

---

## Scene 7: Benefits Summary
**Timestamp**: 0:50-0:65 (or 0:58-0:65 if Scene 6 included)
**Duration**: 7-15 seconds
**App Area**: N/A (text overlay on blurred app background)

### Content
**Voiceover**: "Streamline your cardiac workflow. Increase diagnostic accuracy. Save valuable time."

**Visual Elements**:
- Blurred app interface background (QuickScan or HomePage)
- Three benefit statements with checkmarks:
  - ✓ 4x Faster Screening
  - ✓ AI-Powered Analysis
  - ✓ Comprehensive Reports

### Kite Actions
1. **Background**: Apply blur effect to app (backdrop-blur-lg)
2. **Text animations** (sequential):
   - ✓ 4x Faster Screening (fade in + slide up, 0:52)
   - ✓ AI-Powered Analysis (fade in + slide up, 0:55)
   - ✓ Comprehensive Reports (fade in + slide up, 0:58)
3. **Camera**: Subtle zoom out (100% → 95%) for parallax effect
4. **Hold**: All three benefits visible together (2-3s)

### Transition
- **Type**: Fade to black (0.5s)
- **Next**: Logo and CTA screen

---

## Scene 8: Closing & Call-to-Action
**Timestamp**: 0:65-0:90
**Duration**: 25 seconds
**App Area**: N/A (branded end screen)

### Content
**Voiceover**: "Sonorus. Professional cardiac screening, redefined."

**Visual Elements**:
- Sonorus logo (center, large)
- Tagline: "Professional Cardiac Screening, Redefined"
- Website CTA: "Learn More: sonorus.health"
- Optional: Social media icons or contact information

### Kite Actions
1. **Fade in**: Logo appears from black (1s)
2. **Logo animation**: Subtle pulse or glow effect (0:67-0:70)
3. **Tagline**: Fades in below logo (0:71)
4. **CTA**: Website URL fades in at bottom (0:74)
5. **Hold**: Static frame with all elements (0:75-0:90)
6. **Music**: Holds prominently in final 5 seconds

### Transition
- **Type**: Fade to black (final 2s)
- **Next**: End of video

---

## Technical Specifications for Kite

### Camera Movements
- **Zoom speeds**: 0.3-0.5s for smooth, professional feel
- **Pan speeds**: 0.5-1s for horizontal/vertical movement
- **No jarring cuts**: Always use transitions (fade, slide, blur)

### Cursor Behavior
- **Auto-follow**: Enable for all interactive elements
- **Speed**: Medium (not too fast to lose viewer)
- **Click delay**: 0.2-0.3s hover before click
- **Visual feedback**: Show all hover effects (scale, glow, color change)

### Text Overlays
- **Font**: Sans-serif, medical/professional (e.g., Inter, Roboto)
- **Color**: White or brand purple (#ACACE6) with high contrast
- **Animation**: Fade in + slide up (0.3s duration)
- **Readability**: Minimum 18pt font size, avoid clutter

### Export Settings
- **Resolution**: 1920x1080 (Full HD) minimum
- **Frame Rate**: 60fps for smooth waveform animation
- **Format**: MP4 (H.264) for web compatibility
- **Bitrate**: 8-10 Mbps for high quality

---

## Scene Priority Levels

**Critical (Must Include)**:
1. Scene 2: App Launch
2. Scene 3: Heart Location Selection
3. Scene 4: Recording & Waveform
4. Scene 5: Analysis Results
5. Scene 8: Closing & CTA

**Important (Should Include)**:
6. Scene 1: Opening Hook
7. Scene 7: Benefits Summary

**Optional (Time Permitting)**:
8. Scene 6: Recordings Management

---

## Timing Flexibility

- **If running short (55-60s)**: Extend Scene 8 hold time to 30s
- **If running long (90-95s)**: Cut Scene 6, reduce Scene 4 waveform to 3s
- **Optimal target**: 75 seconds (leaves buffer for adjustments)
