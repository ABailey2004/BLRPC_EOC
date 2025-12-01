# BLRPC Control Room CAD System

A professional Electron-based Computer Aided Dispatch (CAD) system for Scottish Roleplay emergency services control rooms with real-time multi-operator MongoDB synchronization.

## Installation

```bash
npm install
```

## Running the Application

Development mode:
```bash
npm start
```

Build Windows installer:
```bash
npm run build:win
```

## Features

### Dashboard
- **Book On/Off Duty** - Track operator duty time with live timer
- **Active CAD Management** - View and manage all active calls
- **Unit Management** - Create and track emergency service units
- **Professional FMS-style Interface** - Dark theme matching real control room systems

### Call Logging
- Create new CAD entries with:
  - Call type (Burglary, RTC, Assault, etc.)
  - Location tracking
  - Grading system (Emergency, Priority, Standard, N/A)
  - Detailed descriptions
  - Communication channel assignment

### CAD Details
- View complete call information
- Add CAD comments with timestamps
- Assign units to calls
- Track call duration in real-time
- End or delete calls
- Full audit trail

### Unit Management
- Create call signs (DW28, TX48, CM452, etc.)
- Unit types (Traffic Car, Dogs, Ambulance, ARV, etc.)
- Track unit status:
  - Available (Green)
  - On Scene (Blue)
  - En Route (Orange)
  - Unavailable (Red)
- Assign units to active CADs

### Forms System

#### Incident Log
- Record incident details
- Document actions taken
- Track date/time and operator

#### Major Incident Information
- Declare major incidents
- Assign incident commanders
- Track severity levels (Level 1-4)
- Record situation reports
- Document resources deployed

#### Call Taking Information
- Record caller details
- Track call types (999, 101, Internal, Transfer)
- Link to CAD references
- Document call nature and details

## Installation

1. Install Node.js (if not already installed)
2. Navigate to the project directory
3. Install dependencies:
```bash
npm install
```

## Running the Application

```bash
npm start
```

For development mode with DevTools:
```bash
npm run dev
```

## Usage

1. **Book On Duty**
   - Enter your operator name and ID
   - Click "Book On Duty"
   - Your duty timer will start automatically

2. **Create a Unit**
   - Click "+ Create Unit" in the left sidebar
   - Enter call sign, type, and crew information
   - Unit will appear in the sidebar

3. **Log a New Call**
   - Click "+ Log New Call"
   - Fill in call type, location, grading, and description
   - Call appears in the active CADs list

4. **Manage CAD**
   - Click on any CAD to view details
   - Add comments for audit trail
   - Assign units from dropdown
   - End call when resolved
   - Delete if needed

5. **Access Forms**
   - Click "Forms" button in header
   - Switch between tabs:
     - Incident Log
     - Major Incident Information
     - Call Taking Information
   - Fill out and submit forms
   - View previously submitted records

## Data Persistence

All data is automatically saved to browser local storage:
- Active and closed CADs
- Created units
- Form submissions
- CAD reference numbering

Data persists between sessions.

## Keyboard Shortcuts

- ESC key closes modals
- Click outside modals to close

## Color Coding

### Grading Levels
- **Red** - Emergency
- **Orange** - Priority
- **Blue** - Standard
- **Grey** - N/A

### Unit Status
- **Green** - Available
- **Blue** - On Scene
- **Orange** - En Route
- **Red** - Unavailable

## Technical Details

- **Framework**: Electron 27.0.0
- **Storage**: LocalStorage API
- **UI**: Vanilla HTML/CSS/JavaScript
- **Theme**: Dark mode professional control room design

## Support

For issues or questions about this control room system, please refer to the documentation or contact your system administrator.

---

**Scottish Roleplay Emergency Services**
*Professional Control Room Operations*
