# P0 User Flow Diagrams

> **Version**: 1.0 | 2026-03-02
> **Priority**: P0 (Must-have for Phase 1)
> **Owner**: Teammate 6 (Designer)
> **Implementers**: Teammate 3 (OS Dashboard), Teammate 4 (Website)
> **Reference**: `NeuralTwin_Product_Enhancement_Spec.md` Sections 2.2 (Flows 1, 2), 4.3

---

## 1. Morning Digest Flow

**Goal**: Store manager opens the app each morning and gets a complete situational briefing in under 2 minutes, with clear next actions.

**Current Problem**: The dashboard shows raw data tabs (Traffic, Zones, Analytics). The user has to visit each tab, interpret numbers, and decide what to do. No prioritization, no AI summary, no guided path.

**Solution**: Replace the default home view with a Morning Digest that pre-answers "What happened yesterday?" and "What should I do today?"

### 1.1 Flow Diagram

```
[App Entry / Daily Morning]
    |
    | User opens app (browser / PWA)
    |
    v
+===================================+
||                                   ||
||   MORNING DIGEST (First Screen)  ||
||   ==============================  ||
||                                   ||
||   Good morning, [Store Name]      ||
||   Yesterday's Summary             ||
||   March 1, 2026 (Saturday)        ||
||                                   ||
+===================================+
    |
    | Auto-generated at 08:00 via
    | generate-morning-digest EF
    |
    v
+-----------------------------------+
|                                     |
|  KEY METRICS SECTION                |
|  (3 MetricCard 2.0 cards)          |
|                                     |
|  +--------+  +--------+  +--------+
|  |Visitors|  | Dwell  |  |Convert |
|  | 12,847 |  | 4:12   |  | 3.8%   |
|  | ▲ 8.3% |  | ▲ 12%  |  | ▼ 0.2% |
|  +--------+  +--------+  +--------+
|                                     |
+-----------------------------------+
    |
    | Scroll down
    v
+-----------------------------------+
|                                     |
|  AI DAILY BRIEF                    |
|  (Single AI-generated card)        |
|                                     |
|  [AI Icon] Today's Insight         |
|                                     |
|  "Afternoon B-zone dwell dropped   |
|   -22% from last week. The new     |
|   product display may have          |
|   changed foot traffic flow.       |
|   Recommend inspecting this        |
|   afternoon."                       |
|                                     |
|  [View in 3D ->]  [See Details]    |
|                                     |
+-----------------------------------+
    |
    | Scroll down
    v
+-----------------------------------+
|                                     |
|  TODAY'S TASKS (AI-recommended)    |
|                                     |
|  [ ] Check B-zone display POP     |
|  [ ] Review weekend staff schedule |
|  [ ] Check layout change report   |
|                                     |
|  [+ Add Custom Task]               |
|                                     |
+-----------------------------------+
    |
    | Scroll down
    v
+-----------------------------------+
|                                     |
|  QUICK ACTIONS (icon button row)   |
|                                     |
|  [Live]  [Analytics]  [3D Studio] |
|  [Report]  [Ask AI]               |
|                                     |
+-----------------------------------+
    |
    | Continue scrolling
    v
+-----------------------------------+
|                                     |
|  LIVE STATUS (real-time section)   |
|                                     |
|  Current in-store: 23 people       |
|  [Mini zone map with dot counts]  |
|                                     |
|  Today so far: 847 visitors        |
|  [Hourly bar chart, current hour  |
|   highlighted]                     |
|                                     |
+-----------------------------------+
```

### 1.2 Decision Points & Branches

```
                    [Morning Digest]
                          |
            +-------------+-------------+
            |             |             |
            v             v             v
    [Click Metric     [Click AI       [Click Quick
     Card]             Brief Action]   Action]
            |             |             |
            v             v             v
    [Metric Detail    [3D Studio      [Direct page
     Page — full       with B-zone     navigation]
     analytics for     highlighted,
     that KPI]         heatmap ON]
            |             |
            v             v
    [Drill further:   [AI Insight
     time range,       panel opens
     zone breakdown,   with context
     export PDF]       from brief]
```

### 1.3 Screen States

```
STATE: Loading
+-----------------------------------+
|                                     |
|  [Skeleton: 3 MetricCards]         |
|  [Skeleton: AI Brief card]        |
|  [Skeleton: Task list]            |
|                                     |
|  Shimmer animation on all blocks   |
|                                     |
+-----------------------------------+
Loading priority:
  1. Layout skeleton (instant)
  2. MetricCards (100ms)
  3. AI Brief (300ms, may wait for EF response)
  4. Live status (500ms, WebSocket connect)

STATE: No Data (new user with sample data)
+-----------------------------------+
|                                     |
|  [Same layout but with sample     |
|   data values]                     |
|                                     |
|  BANNER: "Viewing sample data.    |
|  Connect sensors for real data."  |
|                                     |
+-----------------------------------+

STATE: Error (digest generation failed)
+-----------------------------------+
|                                     |
|  [MetricCards load independently]  |
|                                     |
|  AI Brief:                         |
|  "Could not generate today's       |
|   summary. Try again later."      |
|  [Retry]                           |
|                                     |
+-----------------------------------+
Fallback: show MetricCards with raw data even if AI Brief fails.
The digest is enhancement, not gating.

STATE: Weekend / Holiday
+-----------------------------------+
|                                     |
|  AI Brief adds context:            |
|  "Yesterday was Saturday. Weekend  |
|   patterns show +35% afternoon    |
|   traffic. Compare with last      |
|   Saturday for accurate delta."   |
|                                     |
+-----------------------------------+
```

### 1.4 Data Sources

| Section | Data Source | Update Frequency |
|---------|------------|------------------|
| Key Metrics | `daily_kpis_agg` table | Every 15 min (near-real-time) |
| AI Brief | `generate-morning-digest` EF | Once daily at 08:00 |
| Today's Tasks | `ai_recommended_tasks` (new table) | With morning digest |
| Quick Actions | Static UI | N/A |
| Live Status | `neuralsense_live_state` via Realtime | Real-time (1s interval) |

### 1.5 Implementation Notes for T3

- The Morning Digest replaces the current default "Overview" page as the app entry point.
- Route: `/` or `/dashboard/home` should render the Morning Digest.
- MetricCards in the digest use the same `MetricCard 2.0` component from `component-specs-p0.md`.
- The AI Brief card is a distinct component: `MorningDigestCard`. It fetches from an EF response cached in `morning_digests` table.
- Tasks are stored in a new `ai_recommended_tasks` table. T2 Backend creates this table + the `generate-morning-digest` EF.
- Quick Actions row: use `<Link>` components wrapping icon buttons. Each navigates to the respective route.
- Live Status section: subscribe to Supabase Realtime channel `live-state:{store_id}`. Show current occupancy per zone.
- Scroll position: persist scroll position in `sessionStorage` so returning to digest resumes where user left off.
- Pull-to-refresh (mobile): trigger digest refresh from EF.

---

## 2. AI Proactive Flow

**Goal**: When the AI detects an anomaly, it proactively alerts the user through the AIInsightBubble, guiding them from notification to understanding to action without context loss.

**Current Problem**: AI only responds to explicit questions. Anomalies go unnoticed until the user manually checks dashboards. No push-based intelligence.

**Solution**: The anomaly detection engine (EF) pushes insights to the AIInsightBubble. The bubble captures attention, explains the issue, and offers direct action paths.

### 2.1 Flow Diagram

```
[Anomaly Detection Engine]
    |
    | Backend EF detects anomaly:
    | "B-zone dwell time -34% vs weekly average"
    | Severity: alert (amber)
    |
    v
[Push via Supabase Realtime]
    |
    | Channel: ai-insights:{store_id}
    | Payload: { type, title, message, severity, actions }
    |
    v
+===================================================+
||                                                   ||
||  USER'S CURRENT SCREEN (any dashboard page)      ||
||                                                   ||
||                              +------------------+ ||
||                              |  [AI] New insight| ||
||                              |   [1]            | ||  <- AIInsightBubble
||                              +------------------+ ||     pulsing with amber glow
||                                                   ||
+===================================================+
    |
    | User notices bubble pulse
    | User clicks bubble
    |
    v
+===================================================+
||                                                   ||
||  DASHBOARD              | AI INSIGHT PANEL (320px)||
||  (shifts left)          |                         ||
||                         | NeuralMind        [X]  ||
||                         |                         ||
||                         | [!] Dwell Time Alert   ||
||                         |                         ||
||                         | "B-zone dwell time     ||
||                         |  dropped -34% from     ||
||                         |  the weekly average    ||
||                         |  (Tue 2-4 PM).         ||
||                         |                         ||
||                         |  The entrance promo    ||
||                         |  table appears to be   ||
||                         |  blocking natural      ||
||                         |  flow into B-zone."    ||
||                         |                         ||
||                         |  ---                    ||
||                         |  Source: Zone Analysis  ||
||                         |  Time: 2 min ago       ||
||                         |                         ||
||                         | [View Suggestion]      ||
||                         | [Simulate in 3D]       ||
||                         | [Dismiss]              ||
||                         |                         ||
+===================================================+
    |
    +------+------+------+
    |      |      |      |
    v      v      v      |
```

### 2.2 Branch: View Suggestion

```
[User clicks "View Suggestion"]
    |
    v
+===================================================+
||                         |                         ||
||  DASHBOARD              | AI INSIGHT PANEL        ||
||                         |                         ||
||                         | Suggested Action:       ||
||                         |                         ||
||                         | "Add a directional POP ||
||                         |  sign at the entrance  ||
||                         |  pointing toward       ||
||                         |  B-zone. Based on      ||
||                         |  similar stores, this  ||
||                         |  could recover 60-70%  ||
||                         |  of lost traffic."     ||
||                         |                         ||
||                         | Expected Impact:        ||
||                         | B-zone dwell:  +22%    ||
||                         | B-zone visits: +35%    ||
||                         | Confidence:    78%     ||
||                         |                         ||
||                         | [Apply & Track ROI ->] ||
||                         | [Simulate First]       ||
||                         |                         ||
+===================================================+
    |
    +-------+-------+
    |               |
    v               v
[Apply & Track]   [Simulate First]
    |               |
    v               v
[Create ROI      [Navigate to
 tracking entry   3D Studio —
 in strategies    B-zone selected,
 table + toast    edit mode,
 "Tracking        suggestion
  started"]       overlaid]
```

### 2.3 Branch: Simulate in 3D

```
[User clicks "Simulate in 3D"]
    |
    | AI panel collapses to bubble
    | Dashboard transitions to 3D Studio
    |
    v
+===================================================+
||                                                   ||
||  3D STUDIO VIEW                                  ||
||  B-zone is highlighted (cyan glow outline)        ||
||  Heatmap overlay is ON                            ||
||                                                   ||
||  +----------------------------------------------+ ||
||  |  [3D scene: store layout]                    | ||
||  |                                              | ||
||  |     A-zone        [B-zone]  <- highlighted   | ||
||  |                    ^^^^^^^^                  | ||
||  |     C-zone        D-zone                    | ||
||  |                                              | ||
||  +----------------------------------------------+ ||
||                                                   ||
||  CONTEXT SIDEBAR (right):                        ||
||  +----------------------------------------------+ ||
||  | Context: AI Alert                            | ||
||  | "B-zone dwell -34%"                          | ||
||  |                                              | ||
||  | Suggested: Move entrance table               | ||
||  | 1.5m to the right to open B-zone            | ||
||  | sightline                                    | ||
||  |                                              | ||
||  | [Start Simulation ->]                        | ||
||  +----------------------------------------------+ ||
||                                                   ||
||  +----------------------------------------------+ ||
||  | TIMELINE (bottom)                            | ||
||  | [<<] [<] [>] [>>]  Live    14:00  14:30     | ||
||  +----------------------------------------------+ ||
||                                                   ||
+===================================================+
    |
    | User drags furniture in editor
    | debounce 1000ms -> auto-simulation
    |
    v
+===================================================+
||                                                   ||
||  SIMULATION RESULTS (sidebar updates):           ||
||  +----------------------------------------------+ ||
||  | Expected Changes:                            | ||
||  |                                              | ||
||  | B-zone dwell:   +35%  [======]  ^            | ||
||  | A-zone visits:  -12%  [====]    v            | ||
||  | Conversion:     +1.2%p [=======] ^           | ||
||  |                                              | ||
||  | Confidence:     82%                          | ||
||  |                                              | ||
||  | AI: "Opening the entrance sightline         | ||
||  | to B-zone should increase exposure."        | ||
||  |                                              | ||
||  | [Apply This Change]  [Revert]               | ||
||  +----------------------------------------------+ ||
||                                                   ||
+===================================================+
```

### 2.4 Branch: Dismiss

```
[User clicks "Dismiss"]
    |
    v
[Insight marked as read]
[Panel closes, bubble returns to idle state]
[Insight moves to "Previous Insights" history in panel]
    |
    | If same anomaly persists for 2+ hours:
    v
[Re-surface as "persistent" insight with note:
 "This issue has continued for 2 hours.
  B-zone dwell is still -30% below average."]
    |
    | User can dismiss again or snooze for 24h
    v
[Snooze: do not re-surface this specific
 anomaly type for 24 hours]
```

### 2.5 Anomaly Severity Escalation

```
Time = 0 min     Anomaly first detected
                  |
                  v
                 [L1: Statistical anomaly]
                  Severity: info
                  Bubble: subtle notification, no pulse
                  Action: log only
                  |
                  | Persists for 15 min
                  v
                 [L2: Pattern anomaly]
                  Severity: insight (purple)
                  Bubble: gentle pulse, unread badge
                  Action: generate AI explanation
                  |
                  | Persists for 30 min OR crosses threshold
                  v
                 [L3: Alert]
                  Severity: alert (amber)
                  Bubble: amber pulse, sound (if enabled)
                  Action: generate suggestion + action buttons
                  |
                  | Persists for 60 min OR revenue impact > 100K KRW/hr
                  v
                 [L4: Critical]
                  Severity: critical (rose)
                  Bubble: rose pulse, persistent, sound
                  Action: full-screen notification overlay
                  Email/SMS notification to store manager
```

### 2.6 Complete State Machine

```
                  +-------+
                  | IDLE  |  <- No pending insights
                  +---+---+
                      |
            [New insight arrives]
                      |
                      v
              +-------+-------+
              | NOTIFICATION  |  <- Bubble pulsing
              +-------+-------+
                      |
            [User clicks bubble]
                      |
                      v
              +-------+-------+
              | PANEL OPEN    |  <- Side panel visible
              +-------+-------+
                      |
          +-----------+-----------+
          |           |           |
    [View         [Simulate    [Dismiss]
     Suggestion]   in 3D]        |
          |           |           v
          v           v     +-----+-----+
    +-----+---+  +----+----+ | DISMISSED |
    | SUGGEST | | 3D STUDIO| +-----------+
    | DETAIL  | | CONTEXT  |       |
    +----+----+ +----+-----+   [Re-surface
         |           |          after 2h?]
    [Apply]     [Apply]          |
         |           |           v
         v           v     +-----+-----+
    +----+----+ +----+----+| RE-NOTIFY |
    | TRACKING| | TRACKING|+-----------+
    +---------+ +---------+
```

### 2.7 Implementation Notes for T3

- The flow spans three systems: Backend (anomaly detection EF), Realtime (Supabase channel), Frontend (AIInsightBubble + navigation).
- T2 implements the anomaly detection EF and the Realtime push. T3 implements the frontend reception and UI.
- State management: extend the `useAIInsightStore` Zustand store with:
  - `severity` field on each insight
  - `snoozedUntil` field for dismissed insights
  - `escalationLevel` (1-4) to track severity progression
- Navigation from panel to 3D Studio: use React Router `navigate('/studio', { state: context })` where context includes `{ zoneId, overlay, suggestion }`.
- The 3D Studio must read `location.state` on mount and auto-configure the scene (highlight zone, enable overlay, show context sidebar).
- Auto-simulation after furniture drag: use `setTimeout` with 1000ms debounce. Call `run-simulation` EF. Display results in the context sidebar.
- Re-surfacing dismissed insights: implement a background check every 15 minutes via `setInterval`. Query the anomaly status from the backend. If the anomaly persists and the insight was dismissed more than 2 hours ago, re-add it to the insight list with an updated message.
- Sound notifications: use the Web Audio API with a short, non-intrusive chime. Gate behind a user preference stored in `localStorage` key `neuraltwin-sound-enabled`.

---

## 3. Onboarding 2.0 Flow

**Goal**: New user goes from signup to a populated, personalized dashboard in under 60 seconds. No friction, no multi-step wizard, immediate value demonstration.

**Current Problem**: 7-step onboarding wizard asks for store dimensions, zone definitions, sensor IDs, POS integration, team members, business hours, and notification preferences. Most users do not have this information ready at signup. High drop-off (estimated 40%+).

**Solution**: Reduce to 2 mandatory steps (type + name), immediately show a dashboard populated with realistic sample data, and guide further setup progressively.

### 3.1 Flow Diagram

```
[Signup Complete]
    |
    | User verified email, logged in for first time
    | System checks: has_completed_onboarding === false
    |
    v
+===================================================+
||                                                   ||
||  STEP 1: STORE TYPE SELECTION                    ||
||                                                   ||
||  Welcome to NeuralTwin                      [X]  ||
||                                                   ||
||  What type of store do you run?                  ||
||  Pick one to see a tailored preview.             ||
||                                                   ||
||  +--------+  +--------+  +--------+              ||
||  |        |  |        |  |        |              ||
||  |Fashion |  | Beauty |  |  F&B   |              ||
||  |        |  |        |  |        |              ||
||  +--------+  +--------+  +--------+              ||
||                                                   ||
||  +--------+  +--------+                           ||
||  |        |  |        |                           ||
||  |Lifestyl|  | Other  |                           ||
||  |        |  |        |                           ||
||  +--------+  +--------+                           ||
||                                                   ||
+===================================================+
    |
    | User clicks a store type card (e.g., "Fashion")
    |
    v
+===================================================+
||                                                   ||
||  STEP 1: STORE TYPE SELECTED                     ||
||                                                   ||
||  What type of store do you run?                  ||
||                                                   ||
||  +--------+  +========+  +--------+              ||
||  |        |  ||Fashion||  |        |              ||
||  |Fashion |  || [v]   ||  |  F&B   |              ||
||  |        |  ||       ||  |        |              ||
||  +--------+  +========+  +--------+              ||
||                ^^^^^^^^                           ||
||                SELECTED (cyan border + glow)      ||
||                                                   ||
||  --- Preview fades in below ---                  ||
||                                                   ||
||  +--------+  +--------+  +--------+              ||
||  |Visitors|  | Dwell  |  |Convert |              ||
||  | 12,847 |  | 4:12   |  | 3.8%   |              ||
||  | ▲ 8.3% |  | ▲ 12%  |  | ▼ 0.2% |              ||
||  +--------+  +--------+  +--------+              ||
||                                                   ||
||  "This is what a fashion store dashboard         ||
||   looks like with NeuralTwin."                   ||
||                                                   ||
||                        [Next: Name Your Store ->]||
||                                                   ||
+===================================================+
    |
    | User clicks "Next"
    |
    v
+===================================================+
||                                                   ||
||  STEP 2: STORE NAME                              ||
||                                                   ||
||  [<- Back]     Almost done!                [X]   ||
||                                                   ||
||  Name your store                                  ||
||                                                   ||
||  +---------------------------------------------+ ||
||  |  Gangnam Flagship Store                      | ||
||  +---------------------------------------------+ ||
||                                                   ||
||  This is how your store appears in the           ||
||  dashboard. You can change it anytime.           ||
||                                                   ||
||                [Start with Sample Data ->]       ||
||                                                   ||
+===================================================+
    |
    | User types store name
    | User clicks "Start with Sample Data"
    |
    v
[Loading State]
+===================================================+
||                                                   ||
||  Setting up your dashboard...                    ||
||                                                   ||
||  [Progress indicator / spinner]                  ||
||                                                   ||
||  Creating store profile...  [v]                  ||
||  Loading sample data...     [v]                  ||
||  Preparing your dashboard...  [...]              ||
||                                                   ||
+===================================================+
    |
    | Backend: create-store EF
    |   - Creates store record
    |   - Seeds 30 days of sample data
    |   - Generates initial morning digest
    |   - Creates default zones for store type
    |
    | ~2-3 seconds
    |
    v
+===================================================+
||                                                   ||
||  DASHBOARD (with sample data)                    ||
||                                                   ||
||  +===============================================+||
||  || [i] You are viewing sample data.             |||
||  ||     Connect a Pi sensor for real data.       |||
||  ||     [Connect Sensor ->]       [Maybe Later]  |||
||  +===============================================+||
||                                                   ||
||  Morning Digest (sample data)                    ||
||  +--------+  +--------+  +--------+              ||
||  |Visitors|  | Dwell  |  |Convert |              ||
||  | 12,847 |  | 4:12   |  | 3.8%   |              ||
||  +--------+  +--------+  +--------+              ||
||                                                   ||
||  AI Brief: "Welcome! Here is a sample            ||
||  analysis for your fashion store..."              ||
||                                                   ||
||                                                   ||
||  +---TIP OVERLAY (first visit only)---+          ||
||  | "This card shows visitor count     |          ||
||  |  and daily trend. Click for more." |          ||
||  |  [Got it]                          |          ||
||  +------------------------------------+          ||
||                                                   ||
||                           +------------------+    ||
||                           | [AI] Welcome!   |    ||
||                           | I help analyze  |    ||
||                           | fashion stores. |    ||
||                           +------------------+    ||
||                                                   ||
+===================================================+
```

### 3.2 Decision Points & Alternate Paths

```
[Step 1: Store Type]
    |
    +--[User clicks X (close)]
    |      |
    |      v
    |  [Confirmation dialog]
    |  "Skip onboarding? You can set up later in Settings."
    |  [Skip]  [Continue Setup]
    |      |         |
    |      v         v
    |  [Dashboard    [Return to
    |   with generic  Step 1]
    |   "Other" type
    |   sample data]
    |
    +--[User clicks store type]
           |
           v
       [Preview + Next button]
           |
           +--[User clicks different type]
           |      |
           |      v
           |  [Preview updates with
           |   new type's sample data]
           |
           +--[User clicks Next]
                  |
                  v
              [Step 2: Name]
                  |
                  +--[User clicks Back]
                  |      |
                  |      v
                  |  [Return to Step 1,
                  |   previous selection preserved]
                  |
                  +--[User clicks X (close)]
                  |      |
                  |      v
                  |  [Same skip confirmation]
                  |
                  +--[Empty name + click Start]
                  |      |
                  |      v
                  |  [Validation: "Please enter a
                  |   store name (min 2 characters)"]
                  |  [Input border turns rose,
                  |   shake animation]
                  |
                  +--[Valid name + click Start]
                         |
                         v
                     [Loading -> Dashboard]
```

### 3.3 Post-Onboarding Progressive Setup

After the initial 2-step onboarding, the system progressively nudges users toward full setup through contextual prompts (not a checklist page).

```
[Dashboard with Sample Data]
    |
    | User interacts naturally with dashboard
    |
    +--[Visits Zone Analysis page]
    |      |
    |      v
    |  +---------------------------------------+
    |  | "These zones are based on a typical   |
    |  |  fashion store layout. Want to set    |
    |  |  up your own zones?"                  |
    |  |  [Set Up Zones ->]  [Not Now]         |
    |  +---------------------------------------+
    |
    +--[Uses dashboard for 3+ days]
    |      |
    |      v
    |  AIInsightBubble:
    |  "You have been exploring sample data for
    |   3 days. Ready to see your real store data?
    |   It takes about 2 hours to set up sensors."
    |  [Connect Sensors ->]  [Not Yet]
    |
    +--[Visits Settings page]
    |      |
    |      v
    |  SETUP CHECKLIST (in Settings):
    |  +---------------------------------------+
    |  | Store Setup         67% complete      |
    |  | ============================------    |
    |  |                                       |
    |  | [v] Store type selected               |
    |  | [v] Store name set                    |
    |  | [v] Sample data loaded                |
    |  | [ ] Define store zones                |
    |  | [ ] Connect Pi sensors                |
    |  | [ ] Connect POS system                |
    |  | [ ] Invite team members               |
    |  | [ ] Set business hours                |
    |  +---------------------------------------+
    |
    +--[First sensor connects successfully]
           |
           v
       +---------------------------------------+
       | CELEBRATION MOMENT                    |
       |                                       |
       | "Your first sensor is live!           |
       | Real data is now flowing."            |
       |                                       |
       | [Confetti animation — one-time only]  |
       |                                       |
       | Banner changes to:                    |
       | "Live data active. Sample data has    |
       |  been replaced with real metrics."    |
       +---------------------------------------+
           |
           v
       [Dashboard transitions from sample
        data to real data. MetricCards update
        with real values (countUp animation)]
```

### 3.4 Error Handling

```
[Step 2: "Start with Sample Data" clicked]
    |
    +--[Network error / EF timeout]
    |      |
    |      v
    |  +---------------------------------------+
    |  | "Could not set up your store.         |
    |  |  Please check your connection."       |
    |  |  [Try Again]  [Contact Support]       |
    |  +---------------------------------------+
    |  Retry logic: 3 automatic retries with
    |  exponential backoff (1s, 2s, 4s)
    |
    +--[Store creation succeeds but sample data seeding fails]
    |      |
    |      v
    |  [Dashboard loads with empty state]
    |  +---------------------------------------+
    |  | "We created your store but could not  |
    |  |  load sample data. You can either:"   |
    |  |  [Retry Sample Data]                  |
    |  |  [Skip to Empty Dashboard]            |
    |  +---------------------------------------+
    |
    +--[User closes browser during loading]
           |
           v
       [On next login, check onboarding state]
       If store was created: skip to dashboard
       If store was not created: resume from Step 1
       State is persisted in `user_profiles.onboarding_step`
```

### 3.5 Complete State Machine

```
                  +----------+
                  | SIGNUP   |
                  | COMPLETE |
                  +----+-----+
                       |
                       v
                  +----+-----+
             +--->| STEP 1   |
             |    | TYPE     |
             |    +----+-----+
             |         |
             |    [Select type]
             |         |
             |         v
             |    +----+-----+
             |    | STEP 1   |
             |    | PREVIEW  |
             |    +----+-----+
             |         |
        [Back]    [Next]
             |         |
             |         v
             +----+----+-----+
                  | STEP 2   |
                  | NAME     |
                  +----+-----+
                       |
                  [Start]
                       |
                       v
                  +----+-----+
                  | LOADING  |
                  +----+-----+
                       |
              +--------+--------+
              |                 |
         [Success]         [Error]
              |                 |
              v                 v
         +----+-----+    +-----+----+
         | DASHBOARD|    | ERROR    |
         | + SAMPLE |    | RETRY   |
         +----+-----+    +-----+----+
              |                 |
              v            [Retry]
         +----+-----+          |
         | PROGRES- +<---------+
         | SIVE     |
         | SETUP    |
         +----------+
```

### 3.6 Implementation Notes for T3/T4

**T3 (OS Dashboard)**:
- Onboarding modal renders on top of a blurred dashboard background (the blur gives a preview feel).
- Use Zustand store `useOnboardingStore` with state: `{ step, storeType, storeName, isComplete }`.
- Persist onboarding state to Supabase `user_profiles.onboarding_step` (via EF) so it survives browser close.
- The loading state shows a real progress sequence. Use Supabase channel subscription to get progress updates from the EF.
- After completion, set `has_completed_onboarding = true` in the user profile. This flag is checked on every app load to gate the onboarding modal.
- The tip overlay uses a queue system: show tip 1, wait for "Got it", then show tip 2 (if any). Max 3 tips on first visit.
- Sample data banner: render as a sticky top bar (z-40). Dismiss action stores preference in both `localStorage` and user profile.

**T4 (Website)**:
- The website's signup flow should collect email + password only. Store type and name are collected by the OS Dashboard onboarding (not the website).
- After signup, redirect to the OS Dashboard URL with a `?onboarding=true` query param.
- If the website implements its own demo mode (interactive landing), it may use a simplified version of the store type selector but does NOT create a real store. It uses client-side sample data only.

**T2 (Backend)**:
- Create `create-store` EF that accepts `{ storeType, storeName }` and:
  1. Creates a `stores` record
  2. Seeds `daily_kpis_agg` with 30 days of sample data appropriate to the store type
  3. Seeds `zone_analytics` with zone configurations for the store type
  4. Creates an initial `morning_digests` entry
  5. Updates `user_profiles.onboarding_step = 'complete'`
- Sample data seed files should be stored in `supabase/supabase/functions/_shared/sample-data/` as JSON files per store type.
- The EF should emit progress events via Supabase Realtime so the frontend can show step-by-step progress.

---

## Appendix: Flow Priority and Dependencies

### Implementation Order

```
PHASE 1 — Sprint 1-2 (W1-W4):

  [Week 1]
  T6: Finalize all three flow specs (this document)     DONE
  T2: Create morning_digests table + generate-morning-digest EF
  T2: Create ai_recommended_tasks table
  T2: Create create-store EF with sample data seeding

  [Week 2]
  T3: Implement OnboardingFlow 2.0 (Step 1 + Step 2 + loading)
  T3: Implement MorningDigestCard component
  T3: Implement Morning Digest page (replace Overview as home)

  [Week 3]
  T3: Implement AIInsightBubble (collapsed + expanded)
  T3: Connect AIInsightBubble to Supabase Realtime
  T2: Implement anomaly detection EF (L1 + L2)

  [Week 4]
  T3: Implement AI Proactive Flow (bubble -> panel -> 3D navigation)
  T3: Implement progressive setup nudges
  T2: Implement anomaly detection EF (L3 + L4)
```

### Cross-Team Dependencies

```
Onboarding 2.0:
  T6 (spec) -> T2 (create-store EF + sample data) -> T3 (frontend)
  Blocker: T2 must provide the EF before T3 can test the full flow

Morning Digest:
  T6 (spec) -> T5 (digest content template) + T2 (EF + cron) -> T3 (UI)
  Blocker: T2 must provide generate-morning-digest EF
  Blocker: T5 must provide digest prompt templates

AI Proactive:
  T6 (spec) -> T2 (anomaly detection EF + Realtime push) -> T3 (bubble UI + navigation)
  Blocker: T2 must provide anomaly detection + Realtime channel
  Parallel: T3 can build the bubble UI independently using mock data
```

---

*NeuralTwin P0 User Flows v1.0 | 2026-03-02 | T6 Designer*
