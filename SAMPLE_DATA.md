# Sample Data for Testing

## Sample Units to Create

### Police Units
- **Call Sign:** DW28 | **Type:** Traffic Car | **Crew:** PC Smith [7654]
- **Call Sign:** TX48 | **Type:** Traffic Car | **Crew:** PC Jones [9223]
- **Call Sign:** CS431 | **Type:** Dogs | **Crew:** PC Wilson [1125]
- **Call Sign:** CM452 | **Type:** Response Vehicle | **Crew:** PC Brown [1111]
- **Call Sign:** R&R | **Type:** Sergeant | **Crew:** SGT Anderson [7654]
- **Call Sign:** PS | **Type:** Inspector | **Crew:** INSP MacLeod [7654]

### Medical Units
- **Call Sign:** AMB1 | **Type:** Ambulance | **Crew:** Paramedic Taylor [1125]
- **Call Sign:** TX48 | **Type:** Response Vehicle | **Crew:** PC Abbott [9223]

## Sample CAD Calls

### Emergency - Burglary in Progress
- **Type:** BURGLARY
- **Location:** AMERICANO WAY
- **Grading:** EMERGENCY
- **Description:** BURGLARY IN COMMERCIAL PREMISES - OFFENDERS ON SCENE - DESCRIBED AS TWO MALES BLUE COATS
- **Channel:** CENT4

### Priority - RTC
- **Type:** RTC
- **Location:** ACE JONES DRIVE
- **Grading:** PRIORITY
- **Description:** Two vehicle RTC, minor injuries reported, road partially blocked
- **Channel:** CENT4

### Standard - Missing Person
- **Type:** MISSING_PERSON
- **Location:** HIGH STREET, EDINBURGH
- **Grading:** STANDARD
- **Description:** Missing person report - Male, 45 years, last seen 2 hours ago wearing blue jacket
- **Channel:** CENT4

### Emergency - Cardiac Arrest
- **Type:** CARDIAC_ARREST
- **Location:** PRINCESS STREET
- **Grading:** EMERGENCY
- **Description:** 5000 - CARDIAC ARREST - Male in 60s, CPR in progress by bystanders
- **Channel:** EEYE1

### Standard - Public Order
- **Type:** PUBLIC_ORDER
- **Location:** GEORGE SQUARE
- **Grading:** PRIORITY
- **Description:** Group of youths causing disturbance, shouting and fighting
- **Channel:** CENT4

## Sample CAD Comments

When viewing a CAD, try adding comments like:
- "Units dispatched - ETA 5 minutes"
- "Unit DW28 on scene"
- "Suspects detained - 2 males in custody"
- "Ambulance requested for injured party"
- "Scene secured - CID en route"
- "Investigation ongoing - witnesses being interviewed"
- "All clear - units available"
- "Call resolved - no further action required"

## Sample Forms Data

### Incident Log Example
- **Date/Time:** [Current date/time]
- **Incident Type:** BURGLARY
- **Location:** 123 High Street, Glasgow
- **Description:** Commercial premises broken into overnight. Entry gained via rear window. Computer equipment and cash stolen.
- **Action Taken:** Scene secured, SOCO requested, witnesses interviewed, CCTV obtained. Crime reference created.

### Major Incident Example
- **Incident Name:** Bridge Collapse - M8 Motorway
- **Commander:** INSP MacLeod
- **Type:** MAJOR_RTC
- **Severity:** Level 3 - Severe
- **Location:** M8 Motorway Junction 15
- **Situation:** Multiple vehicle collision following partial bridge collapse. 12+ casualties. Road closed both directions. Multi-agency response active.
- **Resources:** 6 Police Units, 4 Ambulances, 2 Fire Appliances, Traffic Scotland, Highways
- **Actions:** Road closures implemented, diversion routes established, casualty bureau activated, media liaison contacted

### Call Taking Example
- **Call Received:** [Current date/time]
- **Caller Name:** John MacDonald
- **Contact:** 07700 900123
- **Call Type:** 999
- **Location:** Glasgow City Centre
- **Nature:** Caller witnessed assault on Buchanan Street. Two males fighting, one injured on ground. Caller staying at scene.
- **CAD Ref:** [Link to created CAD]

## Testing Workflow

1. **Book On Duty**
   - Name: Control Operator
   - ID: CTRL001

2. **Create 4-5 Units** using samples above

3. **Create 2-3 CADs** using samples above

4. **Open First CAD:**
   - Add comment: "Call received from witness"
   - Assign Unit: DW28
   - Add comment: "DW28 dispatched to scene"
   - Add comment: "DW28 on scene - situation under control"

5. **Try Forms:**
   - Go to Forms
   - Fill out an Incident Log
   - Fill out Call Taking Information
   - View recorded entries

6. **Change Unit Statuses:**
   - Click on units in sidebar
   - Change between Available/On Scene/En Route/Unavailable

7. **End a CAD:**
   - Open CAD detail
   - Add final comment: "Incident resolved"
   - Click "End Call"
   - Verify it's removed from active list

## Common Scottish Locations for Realism

- Princes Street, Edinburgh
- Buchanan Street, Glasgow
- Union Street, Aberdeen
- George Square, Glasgow
- Royal Mile, Edinburgh
- Sauchiehall Street, Glasgow
- The Meadows, Edinburgh
- Kelvingrove Park, Glasgow
- Aberdeen Beach
- Stirling Castle
- Fort William High Street
- Inverness City Centre

## Call Sign Conventions

Scottish Police typically use:
- **Letter codes** for division (E.g., E=Edinburgh, G=Glasgow)
- **Numbers** for unit identification
- **Suffixes** for special units (ARV, DOG, etc.)

Examples:
- E101 (Edinburgh patrol)
- G245 (Glasgow unit)
- TARV1 (Armed Response Vehicle)
- DOG5 (Dog unit)
- TRAF12 (Traffic unit)

This helps make your roleplay more authentic!
