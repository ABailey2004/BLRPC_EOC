# Control Room CAD - Quick Reference Guide

## Getting Started

### First Time Setup
1. Run `npm install` to install dependencies
2. Run `npm start` to launch the application
3. Book on duty with your operator name and ID

## Main Features Overview

### 📞 Creating a New Call (CAD)
1. Click **"+ Log New Call"** button
2. Select **Call Type** (Burglary, RTC, Assault, etc.)
3. Enter **Location** (e.g., AMERICANO WAY)
4. Select **Grading**:
   - 🔴 **Emergency** - Immediate response required
   - 🟠 **Priority** - Urgent but not life-threatening  
   - 🔵 **Standard** - Routine response
   - ⚫ **N/A** - No grading applicable
5. Enter detailed **Description**
6. Select **Channel** (CENT4, EEYE1, etc.)
7. Click **Create CAD**

### 👥 Creating Units
1. Click **"+ Create Unit"** in left sidebar
2. Enter **Call Sign** (e.g., DW28, TX48, CM452, AMB1)
3. Select **Unit Type**:
   - Traffic Car
   - Dogs
   - Ambulance
   - Response Vehicle
   - ARV (Armed Response)
   - Sergeant
   - Inspector
4. Enter **Officer/Crew** names
5. Set initial **Status**
6. Click **Create Unit**

### 📋 Managing a CAD
1. **Click on any CAD** in the main list to open details
2. In the detail view you can:
   - **Add Comments** - Document actions, updates, notes
   - **Assign Units** - Select from dropdown to dispatch
   - **View Timeline** - See start time and duration
   - **End Call** - Mark as resolved (removes from active)
   - **Delete CAD** - Permanently remove (use carefully!)

### 🚔 Assigning Units to Calls
1. Open CAD detail view
2. Use **"-- Assign Unit --"** dropdown
3. Select unit to dispatch
4. Unit status automatically changes to "On Scene"
5. Unit appears in "Assigned Units" section
6. Click **Remove** to unassign (unit becomes Available)

### 📝 Using Forms

#### Incident Log
- Record all incidents during shift
- Document actions taken
- Creates permanent record

#### Major Incident Information
- Use for large-scale incidents
- Assign incident commander
- Set severity level (1-4)
- Record situation reports
- Track deployed resources

#### Call Taking Information
- Log all incoming calls
- Record caller details
- Link to CAD reference if created
- Track call types (999, 101, Internal, Transfer)

## Unit Status Meanings

| Status | Color | Meaning |
|--------|-------|---------|
| **AVAILABLE** | 🟢 Green | Ready for dispatch |
| **ON SCENE** | 🔵 Blue | At incident location |
| **EN ROUTE** | 🟠 Orange | Traveling to incident |
| **UNAVAILABLE** | 🔴 Red | Off duty or unable to respond |

## CAD Reference Format
- Format: `XXXXXX/DDMMYY`
- Example: `000001/281123`
- Auto-increments with each new call

## Pro Tips

✅ **Add Comments Frequently** - Document all updates, decisions, and actions for audit trail

✅ **Create Units First** - Set up your shift's units before logging calls for easy assignment

✅ **Use Correct Grading** - Helps prioritize response and resource allocation

✅ **Check Unit Status** - Before assigning, verify unit is available

✅ **End Calls Properly** - Use "End Call" button to close resolved incidents

✅ **Regular Forms** - Complete incident logs and call taking info during shift

✅ **Monitor Duration** - Live timer shows how long CAD has been active

## Keyboard Tips
- **ESC** - Close any modal
- **Click outside modal** - Also closes modal

## Data Persistence
- All data saves automatically to local storage
- CADs, units, and forms persist between sessions
- No manual save required

## Common Workflows

### Responding to Emergency Call
1. Click "+ Log New Call"
2. Set Type and Grading to "EMERGENCY"
3. Enter location and description
4. Create CAD
5. Click on CAD to open details
6. Assign appropriate units
7. Add comment: "Units dispatched"
8. Monitor until resolved
9. Add closing comment
10. Click "End Call"

### Creating Shift Units
1. Click "+ Create Unit" for each unit on duty
2. Common call signs:
   - **DW##** - Dogs/Wildlife
   - **TX##** - Traffic
   - **CS###** - Dogs
   - **CM###** - Command
   - **AMB#** - Ambulance
3. Set all to "AVAILABLE" initially
4. Units now ready for assignment

### Major Incident Procedure
1. Create CAD for incident
2. Set grading to "EMERGENCY"
3. Go to Forms → Major Incident Information
4. Fill out major incident form
5. Return to CAD and assign multiple units
6. Add regular comments with updates
7. Coordinate response via comments

## Troubleshooting

**CAD won't create?**
- Check all required fields are filled
- Verify grading is selected

**Can't assign unit?**
- Unit may already be assigned to another call
- Check unit exists in sidebar

**Lost data?**
- Check browser local storage hasn't been cleared
- Data persists in same browser only

**Modal won't close?**
- Click X button or click outside modal
- Press ESC key

## Support
Refer to README.md for full documentation and technical details.

---
**Scottish Roleplay Emergency Services - Control Room Operations**
