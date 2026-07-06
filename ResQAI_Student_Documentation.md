# ResQAI — System Flow, Logic Verification & Usage Guide
# ResQAI — System Flow, Logic Verification & Usage Guide

This guide lists the exact, step-by-step verification flows for all roles in ResQAI (Admin, NGO, and Volunteer) to help you understand, test, and work with the system's live features.

---

## 🧭 Live Verification Walkthrough (Success Flow)

To trace a signal from submission to archiving, follow this sequence across the dashboards:

### Phase 1: Victim Submits SOS Signal
1. Navigate to the Victim's **Request Rescue** portal (usually at `http://localhost:3000/#request-emergency`).
2. Fill out the emergency form: select a type (e.g., **Supply Drop**), describe the incident, and click **LOCK SIGNAL**.
3. *System Action:* This inserts a document into the `requests` collection with `status: "Pending"`.

### Phase 2: NGO Receives or Deploys Assets
1. Log in to the **NGO Dashboard** (`http://localhost:3000/ngo-dashboard`).
2. Under **Strategic Signals**, you will see the victim's request.
3. Click the blue **DEPLOY ASSET** button.
4. *System Action:* 
   - The original request's status changes to `In Progress`.
   - A new Task is created in the database labeled `isNGOAlert: true` (with NO volunteer assigned yet).
   - A notification is auto-sent to all Admins saying a volunteer needs to be assigned.

### Phase 3: Admin Dispatches Field Personnel
1. Log in to the **Admin Dashboard** (`http://localhost:3000/admin-dashboard`) and go to the **Task Assignment** tab.
2. In the task list, locate the task corresponding to the NGO's deployment. You will see an orange pulsing **🔶 NGO Alert** badge next to it.
3. In the Personnel column, click **Assign**.
4. A Dispatch modal opens showing a list of registered volunteers. Recommended volunteers close to the victim's GPS coordinates are highlighted in green.
5. Select a volunteer and click **CONFIRM DISPATCH**.
6. *System Action:* 
   - The task's `volunteerId` is updated in the database.
   - The assigned volunteer gets a notification.

### Phase 4: Volunteer Executes the Mission
1. Log in to the **Volunteer Dashboard** (`http://localhost:3000/volunteer-dashboard`) or go to **Assigned Tasks** (`http://localhost:3000/volunteer/tasks`).
2. The task appears under **Active Field Missions**. The card displays the precise victim location (resolved via the SOS request), the victim's name, and contact details.
3. Click **INITIATE** on the task card when starting. (Status updates to `In Progress`).
4. Once work is complete, upload a physical verification photo in the **Completion Verification** section, type notes, and click **MARK AS RESCUED (COMPLETE)**.
5. *System Action:* 
   - Task status changes to `Completed`.
   - The linked victim SOS request's status changes to `Rescued`.
   - An audit notification is sent to both the Admin and the NGO.

### Phase 5: Audit & Conclude
1. **Admin Verification:**
   - The Admin visits the **Task Assignment** page and clicks the green **Audit Photo** button on the Completed task.
   - They click the photo thumbnail to view it in an enlarged full-screen **Lightbox overlay** displaying all volunteer notes and timestamps.
   - Click **VERIFY & RESOLVE**. (Task status updates to `Resolved` and moves to the resolved archive).
2. **NGO Resolution:**
   - The NGO visits the **Rescue Operations** tab (`http://localhost:3000/ngo/rescue`).
   - The row for the victim now shows an orange **RESCUED** status badge with a clickable green **RESOLVE** button.
   - Clicking **RESOLVE** updates the original request status to `Completed`, shifting the status badge to a green **MISSION ARCHIVED** label.

### Phase 6: Victim/Citizen Tracks Rescue & Dispatched Resources
1. Navigate to the Victim Portal (`http://localhost:3000/` landing page) and scroll to the **History** section (or click **History** in the navigation bar).
2. **Review Incidents:** The left pane displaying **Declared Incidents** lists all disaster events reported by the user, along with creation date and severity level.
3. **Verify Extractions:** The right pane displaying **Emergency Extractions & Relief** shows active and completed SOS requests.
4. **Inspect Dispatched Supplies:** If an NGO has assigned a volunteer, the card dynamically reflects that. Under **Dispatch Alert Telemetry**, the citizen can view:
   - The name and contact number of the responding volunteer.
   - Any dispatched supplies/resources (e.g. food rations, medical kits).
5. **View Resolution Summary:** Once the mission is completed, clicking **View Verification Details** opens a popup showing the volunteer's completion remarks, timestamp, and a high-resolution photo proof container (expandable in a full-screen Lightbox).

---

## 🛠️ Complete Navigation & Functionality Guide

### 👤 Citizen / Victim (User) Portal (Home Page)

The landing page functions as the secure command board for victims. It features standard navigation anchors:
1. **Live Map:** Interactive map showing shelters and safe zones.
2. **Weather Alerts:** Climate telemetry and live warning tickers.
3. **AI Prediction:** ML flood risk analyzer (predicting high/low threat levels based on rainfall).
4. **Nearby Shelters:** Live locator showing safe zones and hospitals close to location.
5. **Disaster Reporting:** Declaration form to report a new incident to authorities.
6. **Request Emergency:** SOS Distress signal emitter requesting rescue, supply drop, or medical evacuation.
7. **History:** Real-time summary detailing reported incidents, dispatch volunteers, items received, and audit proof pictures.

---

### 👨‍💼 Admin Sidebar Options

1. **Dashboard:** Overview of system statistics (total incidents, active rescues, available personnel, resource allotments).
2. **Manage Users:** View and manage profiles of all registered survivors/victims.
3. **Manage Volunteers:** List of field operators. Admins can toggle approval state here.
4. **Manage Authorities:** View and manage NGO profile accounts.
5. **Manage Incidents:** Declare general disaster zones (e.g. Floods, Wildfires) on the dashboard map.
6. **Manage Resources:** Log and track bulk provisions (medical crates, meal boxes) owned by specific NGOs.
7. **Manage Relief Nodes:** Configure safe shelters and resource centers.
8. **Task Assignment:** The task dispatch interface. Manage assignments, allocate resources, and audit photo verifications.
9. **Live Disaster Map:** High-level interactive map displaying active incident signals and relief shelters.
10. **Analytics:** Graph reports of disaster outcomes, resource distribution and response times.
11. **Tactical Chat:** Channel to broadcast messages to all responding NGOs and field units.
12. **Communication Mesh:** Admin's system notifications page.

---

### 🛡️ NGO Sidebar Options

1. **Dashboard:** Displays critical live alerts and the **Strategic Signals** pane for responding to raw victim SOS requests.
2. **Incident Analysis:** View active regional incidents and run predictive ML models to estimate risk levels.
3. **Resources:** Manage inventories of supplies (water, medicine) and request replenishments.
4. **Rescue Operations:** The coordination board displaying a live table of all ongoing extractions in the sector (auto-refreshing every 5 seconds). Allows final resolution of completed rescues.
5. **Tactical Chat:** Instant messaging panel to correspond with Admin coordinators.
6. **Communication Mesh:** Review alerts and incoming requests.
7. **Profile:** Update organization contact details and coordinates.

---

### 👷 Volunteer Sidebar Options

1. **Dashboard:** Access assigned field missions, task state buttons, and the direct **Open SOS Signals** feed to self-assign to pending victim requests.
2. **Assigned Tasks:** Detailed dashboard cards displaying task resources, destination coordinates, victim details, and photo upload verification forms.
3. **Disaster Intel:** View announced incidents and safe zones in the area.
4. **Live Map:** Interactive regional map showing victim signals and evacuation hubs.
5. **Tactical Chat:** Messaging board to coordinate with base Admins.
6. **Communication Mesh:** View task dispatch alerts and verification notifications.
7. **Profile:** Set coordinates and toggle availability status (`Available` / `Busy`).

---

## 🛡️ Logical Verification & Edge Cases

The application handles status syncs, access states, and credentials correctly, with the following logical features:

*   **Volunteer Availability Logic:** When a volunteer is auto-assigned via coordinates, their profile state changes from `Available` to `Busy` in the DB so they are excluded from subsequent assignments until they clear their queue.
*   **Coordinate Resolution:** Local coordinates are safely resolved dynamically when volunteers view tasks. If coordinates are missing, it falls back gracefully through the address field to profile records or a clean `"Location not provided"` placeholder.
*   **Approval Gate:** Volunteers must have `isApproved: true` toggled by an Admin under **Manage Volunteers** before they are recommended in the dispatch dropdown or included in the auto-assignment logic.
*   **Proof Reinforcement:** The frontend prevents submission of completed tasks if no verification file is attached, ensuring all closures are audited. If the Admin clicks **REJECT**, the task is reverted to `Rejected` status and notifies the volunteer to re-upload.
*   **Live Synchronization:** Both the NGO's **Rescue Operations** dashboard and the Admin's **Task Assignment** dashboard now run on background polling intervals to stay updated in real time.
