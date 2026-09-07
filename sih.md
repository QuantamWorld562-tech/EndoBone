# 🏛️ SIH Technical Evaluation — EndoBone AI Frontend
### Judge: Strict AI Technical Evaluator | Mode: Interactive Interrogation

---

> **How to use this file:**
> Each question has an ideal answer written from the perspective of someone who deeply understands the codebase.
> Study the answers, relate them back to the actual code, and practice speaking them out loud.

---

## 📋 Project Stack (Detected from Codebase)

- **Frontend:** React + React Router v6, Suspense + lazy loading, Context API
- **State:** `PatientDataContext` (React Context) + custom hooks (`usePatientData`, `useBiomarkers`, `useAssessment`, `useSurgicalPlan`, `useTrendingData`)
- **API Layer:** Axios (`apiClient.js`) → `api.js` → feature services (`patientService`, `biomarkerService`, `assessmentService`, `authService`)
- **Backend:** FastAPI (Python) at `/api`, proxied via Vite dev server
- **UI:** Tailwind CSS + custom `@keyframes` animations in `index.css`
- **Views:** Landing, Login, Register, Dashboard, MetabolicContext, AIAssessment, Planning3D, PreSurgicalSummary, Admin

---

## 🎯 SIH Evaluation Rubric

| Criterion | What Judges Look For |
|-----------|----------------------|
| **Technical Depth** | Can you explain *why* architectural choices were made? |
| **Defensibility** | Can you trace data from user action → state → API → UI update? |
| **Error Handling** | What breaks if backend goes down? How do you recover? |
| **Real-World Readiness** | Does the app work on slow networks or small screens? |

---

## 📚 Topics Covered

- [x] **Opening Summary**
- [x] **Topic 1:** Component Hierarchy, React Lifecycle & Custom Hooks
- [x] **Topic 2:** Global State Management & Data Flow
- [x] **Topic 3:** API Routing, Error Handling & Real-time Data
- [x] **Topic 4:** UI/UX Decisions, CSS Layout & Popups

---

---

## 🔰 OPENING — Warm-up

---

### ❓ Q0 — What does the EndoBone AI frontend do?

> Before we begin, give me a brief 2-sentence summary of what EndoBone AI does — what problem it solves and how the frontend delivers that solution.

---

### ✅ IDEAL ANSWER

EndoBone AI is a clinical decision-support platform for orthopedic surgeons that analyzes a patient's bone metabolic biomarkers (PTH, Vitamin D, Calcium, CTX, ALP, Phosphate) and generates AI-driven bone quality risk assessments and pre-surgical planning recommendations. The React frontend delivers a multi-step clinical workspace — from a Dashboard for patient selection, through Metabolic Context analysis, AI Assessment with a local rule engine, interactive 3D bone geometry planning, and a printable Pre-Surgical Summary — all powered by React Router v6 for navigation, a Context API state layer for global patient data, Axios for FastAPI REST calls, and Tailwind CSS for a responsive clinical UI.

---

---

## 🔷 TOPIC 1 — Component Hierarchy, React Lifecycle & Custom Hooks

---

### ❓ Q1.1 — Walk me through the component tree from `main.jsx` to a leaf component.

---

### ✅ IDEAL ANSWER

```
main.jsx
  └── <App />                    ← BrowserRouter wraps everything
        ├── PatientDataProvider  ← Global context — all views share patient state
        │     └── Suspense       ← Shows <AppLoadingScreen /> while lazy chunks load
        │           ├── PublicOnlyRoute → LandingView, LoginView, RegisterView
        │           └── ProtectedRoute
        │                 └── MainLayout     ← Sidebar + TopBar + WorkflowStepper + <Outlet />
        │                       ├── DashboardView
        │                       ├── MetabolicContextView
        │                       ├── AIAssessmentView
        │                       ├── Planning3DView
        │                       ├── PreSurgicalSummaryView
        │                       └── AdminDashboardView (AdminRoute guard)
```

- `PatientDataProvider` wraps the entire app so all views share one patient state
- `MainLayout` uses React Router's `<Outlet />` — the matched child route renders there without repeating Sidebar/TopBar
- All views are **lazy-loaded** — they only download when first visited, keeping the initial bundle small

---

### 📝 KEY CONCEPTS

**Smart vs Dumb Components:**
- `MainLayout`, `DashboardView` = **smart/container** — read context, fetch data, handle logic
- `SkeletonBlock`, `RiskDonut` = **dumb/presentational** — receive props and render only

**Outlet Pattern (React Router v6):**
`<Outlet />` is a placeholder in the parent layout where React Router renders the matched child route. This avoids copy-pasting Sidebar/TopBar into every view.

---

### ❓ Q1.2 — What is `React.lazy()` and why did you use it? What would happen without it?

---

### ✅ IDEAL ANSWER

`React.lazy()` enables **code splitting** — each view becomes a separate JS chunk that only downloads when first visited:

```js
// App.jsx
const Planning3DView = lazy(() => import('./components/views/Planning3D/Planning3DView'));
```

`Planning3DView` uses Three.js, `@react-three/fiber`, and `@react-three/drei` — those libraries alone can be 500KB+. Without lazy loading, that code would be bundled into the initial JS file, making the first page load 2-3x slower.

`<Suspense fallback={<AppLoadingScreen />}>` shows the branded loading screen while the chunk is downloading. Suspense is the boundary that catches the "not yet loaded" state of lazy components.

| With `lazy()` | Without `lazy()` |
|---------------|-----------------|
| Initial bundle ~200KB | Initial bundle ~2MB+ |
| 3D libraries load only at `/planning` | 3D libraries load on first visit |
| Fast Time-to-Interactive | Slow first paint |

Vite's `rollupOptions.manualChunks` in `vite.config.js` also splits `react`, `react-dom`, `axios`, and `lucide-react` into a stable `vendor` chunk that can be cached by the browser across deployments.

---

### ❓ Q1.3 — Explain `cancelledRef = useRef(false)` in `useBiomarkers`. What bug does it prevent?

---

### ✅ IDEAL ANSWER

This is the **async race condition / stale closure** fix. The problem:

1. Doctor opens Patient A → `fetchBiomarkers()` starts (async, takes 500ms)
2. Doctor quickly switches to Patient B → `useEffect` cleanup runs, new fetch for Patient B starts
3. Patient A's fetch finishes first → without the guard, it would call `setBiomarkers(patientAData)` while we're viewing Patient B

The fix:
```js
useEffect(() => {
  cancelledRef.current = false;           // mark as active for this run

  const fetchBiomarkers = async () => {
    const data = await biomarkerService.getBiomarkers(patientId);
    if (!cancelledRef.current) {          // only update if still relevant
      setBiomarkers(data);
    }
  };

  fetchBiomarkers();

  return () => {
    cancelledRef.current = true;          // runs when patientId changes or unmount
  };
}, [patientId]);
```

**Why `useRef` and not `useState` for the flag?**
Changing a ref does NOT trigger a re-render. If we used `useState(false)` for cancelled, setting it to `true` would cause a re-render, potentially creating a loop. `useRef` is a mutable container with zero rendering side effects.

---

### 📝 KEY CONCEPTS

- `useEffect` cleanup runs: (a) when dependencies change, OR (b) when component unmounts
- The modern browser-native alternative is `AbortController` with `fetch()` — but `cancelledRef` works for any async pattern
- Without this guard: **wrong patient's data flashes on screen** when navigating quickly

---

### ❓ Q1.4 — What is `useCallback` and why is `selectPatient` wrapped in it with `[]`?

---

### ✅ IDEAL ANSWER

`useCallback` returns a **memoized function** — it only creates a new function reference when its dependencies change:

```js
const selectPatient = useCallback(async (patientId) => {
  setLoading(true);
  const patient = await patientService.getPatientById(patientId);
  setSelectedPatient(patientId);
  setPatientData(patient);
  setLoading(false);
}, []); // empty → created once, never recreated
```

In React, every re-render creates a **new function reference** for every inline function. If `selectPatient` is passed as a prop to a child component, that child sees a "new" function on every parent render and re-renders unnecessarily. With `useCallback([])`, the function reference is stable — children that receive it don't re-render unless their own props change.

**Empty `[]`** means: this function doesn't read any external variables that could change (it only calls `useState` setters, which are always stable).

| Hook | Purpose |
|------|---------|
| `useMemo` | Memoize a **computed value** |
| `useCallback` | Memoize a **function reference** |
| `useRef` | Mutable value that **never triggers re-render** |
| `useEffect` | Run side effects + cleanup |

---

---

## 🔷 TOPIC 2 — Global State Management & Data Flow

---

### ❓ Q2.1 — Why did you use React Context instead of Redux Toolkit?

---

### ✅ IDEAL ANSWER

Redux Toolkit is powerful but introduces significant boilerplate — slices, reducers, dispatchers, selectors — that isn't justified when the entire global state is one tightly coupled domain: the active patient and their clinical data.

**Reasons Context was the right choice:**

1. **Single concern**: Patient ID, biomarkers, assessment, and surgical plan all belong together. Context manages them as one coherent unit — no cross-slice dependencies to coordinate.
2. **No global action broadcasting**: Redux shines when many unrelated components dispatch actions to a shared store. Here, data flows from `PatientDataProvider` downward in a predictable tree.
3. **Simpler mental model**: Any component calls `usePatientContext()` and gets exactly what it needs — no `connect()`, no `mapStateToProps`, no selectors.

**Where Redux would be better:** If the app had separate concerns — notifications, user preferences, chat history, analytics dashboards — that needed isolated slices, middleware (`redux-thunk`/`redux-saga`), or time-travel debugging.

| React Context | Redux Toolkit |
|---------------|---------------|
| Built-in, zero install | External library |
| Good for low-frequency updates | Good for high-frequency, complex state |
| Re-renders all consumers on update | Selectors prevent unnecessary re-renders |
| No DevTools (without extra work) | Excellent Redux DevTools |

---

### ❓ Q2.2 — Trace the full data flow when a doctor updates a biomarker value.

---

### ✅ IDEAL ANSWER

```
1. Doctor types "90" into PTH input in MetabolicContextView
         ↓
2. Component calls: updateBiomarker(activePatientId, 'pth', 90)
   (from usePatientContext())
         ↓
3. PatientDataContext.updateBiomarker() runs:
   - Reads referenceRanges['pth'] → { max: 65 }
   - 90 > 65 → status = 'elevated'
   - trend = 'up' (90 > previous value)
   - setAllBiomarkers(prev => ({ ...prev, [patientId]: updatedData }))
         ↓
4. allBiomarkers state updates
   → activeBiomarkers (useMemo) recomputes
         ↓
5. biomarkerValueKey (useMemo) recomputes:
   Old: "65|30|9.0|3.5|80|300"
   New: "90|30|9.0|3.5|80|300"  ← string changed
         ↓
6. dynamicAssessment (useMemo) recomputes because biomarkerValueKey changed:
   computeDynamicAssessment() runs:
   pth=90 → qualityRisk += 25 → risk = "high"
   → new insights array, new recommendedPathway
         ↓
7. All context consumers re-render with new data:
   - Risk donut turns red
   - Risk score % updates
   - Clinical insights panel shows new text
   - Recommended pathway changes to "critical"
```

**Key optimization:** `biomarkerValueKey` is a stable primitive string (`"90|30|..."`) derived from biomarker values. It only changes when actual VALUES change — preventing `computeDynamicAssessment` (150+ lines) from re-running when unrelated state updates (like a modal opening).

---

### ❓ Q2.3 — What happens if you remove `useMemo` from `dynamicAssessment`?

---

### ✅ IDEAL ANSWER

Without `useMemo`, `computeDynamicAssessment()` runs on **every render** of `PatientDataProvider` — every modal open, every scroll event that triggers state, every unrelated context update.

```js
// WITHOUT useMemo — re-runs on EVERY provider render:
const dynamicAssessment = computeDynamicAssessment(activePatientId, activeBiomarkers);

// WITH useMemo — only re-runs when biomarker VALUES actually change:
const dynamicAssessment = useMemo(() =>
  computeDynamicAssessment(activePatientId, activeBiomarkers),
  [activePatientId, biomarkerValueKey, activeBiomarkers]
);
```

Two problems without `useMemo`:
1. **Performance**: 150 lines of conditional math and array building runs on every keystroke anywhere in the app
2. **Referential instability**: Components receiving `assessment` as a prop would see a new object reference every render, causing unnecessary child re-renders even when values are identical

---

### ❓ Q2.4 — The hospital loses internet. What happens in your app?

---

### ✅ IDEAL ANSWER

The app has **graceful offline fallback at multiple levels:**

**1. Patient list — falls back to mock seed:**
```js
try {
  const remotePatients = await patientService.getPatients();
  setPatientList(remotePatients);
} catch {
  setPatientList([...patients]); // mockData.js seed
}
```

**2. New case creation — local-first:**
If `createPatient()` API call fails, the case is still added to `patientList` in local state. The doctor can continue working. An `apiError` banner displays: *"Case saved locally only — Changes may not persist after a page refresh."*

**3. AI Assessment — fully offline capable:**
`computeDynamicAssessment()` runs entirely in the browser using local JavaScript — no API call. Doctors can update biomarkers and get instant risk scores, clinical insights, and surgical pathway recommendations even with zero connectivity.

**4. Error banner in `MainLayout`:**
When `apiError` is set, a dismissible red banner appears:
> *"Backend Service Alert: Local offline clinical decision rule engine is actively handling assessment and planning."*

**5. Axios 401 interceptor:**
If the session expires, the interceptor silently clears localStorage tokens. The next API call that hits a route guard triggers a redirect to `/login`.

---

---

## 🔷 TOPIC 3 — API Routing, Error Handling & Real-time Data

---

### ❓ Q3.1 — Walk me through `apiClient.js`. What do the interceptors do?

---

### ✅ IDEAL ANSWER

`apiClient` is an Axios instance with:
- `baseURL`: from `VITE_API_URL` env var, falls back to `/api` (Vite proxy handles it in dev)
- `timeout: 30000` — requests fail after 30 seconds instead of hanging forever
- Default `Content-Type: application/json`

**Request Interceptor — auto-attaches JWT:**
```js
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('endobone_auth_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
Every API call automatically gets the JWT Bearer token — individual service functions never need to manually add auth headers.

**Response Interceptor — handles session expiry:**
```js
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('endobone_auth_token');
      localStorage.removeItem('endobone_doctor_profile');
    }
    return Promise.reject(error); // still propagates to service catch blocks
  }
);
```
401 responses clear the session automatically — except for the login URL itself (to avoid a redirect loop where a failed login triggers logout-then-redirect).

`Promise.reject(error)` ensures errors still reach the calling service function's `catch` block for component-level handling.

---

### ❓ Q3.2 — Why don't you get a CORS error in development? Explain the Vite proxy.

---

### ✅ IDEAL ANSWER

Browsers enforce **Same-Origin Policy** — a page on `localhost:5173` cannot make requests to `localhost:8000` without the server sending CORS headers.

The Vite proxy in `vite.config.js` solves this:
```js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    timeout: 30000,
  },
},
```

When the browser calls `/api/cases`, it goes to **Vite's dev server** (`localhost:5173` — same origin, no CORS issue). Vite then **server-side forwards** the request to `localhost:8000/api/cases`. Server-to-server communication is not subject to browser CORS restrictions.

`changeOrigin: true` makes the proxy rewrite the `Host` header to the target server's domain, which some servers require.

**In production:** The frontend and FastAPI are served from the same domain (via Vercel/nginx routing), so there's no cross-origin issue and no proxy is needed.

---

### ❓ Q3.3 — Why use a layered service architecture instead of calling `fetch()` directly in components?

---

### ✅ IDEAL ANSWER

The layers: `Component → usePatientContext() → patientService → apiService → apiClient`

**Reasons for layering:**

1. **Single point of change**: If `/cases` renames to `/patients`, I update `api.js` in one place — not 10 components
2. **Auth is automatic**: The `apiClient` interceptor attaches JWT to every call — components never think about it
3. **Error normalization**: FastAPI returns errors as `{ detail: [{ msg, loc }] }` — `readApiError()` normalizes this to a simple string for any component to display
4. **Testability**: `patientService` can be mocked in unit tests independently of the component tree
5. **Separation of concerns**: Components describe UI. Services describe data access. Neither mixes into the other.

```js
// readApiError in authService.js handles both FastAPI error formats:
export function readApiError(error, fallbackMessage) {
  const data = error?.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  return fallbackMessage || 'An unexpected error occurred.';
}
```

---

### ❓ Q3.4 — Does your app use WebSockets or Socket.io? How do you achieve real-time feel?

---

### ✅ IDEAL ANSWER

The current implementation does **not use WebSockets**. The real-time feel is achieved through:

**1. Reactive local computation:**
When a doctor updates a biomarker, `computeDynamicAssessment()` runs synchronously in the browser — risk scores, insights, and pathways update **instantly** without any network round-trip. The clinical rule engine lives entirely in `PatientDataContext`.

**2. Optimistic UI:**
In `addNewCase()`, the new patient is immediately added to `patientList` in local state before the API call completes. The doctor sees their new case instantly; any sync failure shows the error banner.

**3. On-demand fetching:**
Data is fetched when a patient is selected or a component mounts — not continuously polled.

**If WebSockets were needed** (e.g., multi-doctor collaboration on a case), the pattern would be:
```js
useEffect(() => {
  const socket = io('/cases');
  socket.on('biomarker_updated', (data) => updateBiomarker(data));
  socket.on('connect_error', () => setConnectionError('Socket disconnected'));
  return () => socket.disconnect(); // CRITICAL cleanup to prevent memory leaks
}, []);
```
The `return () => socket.disconnect()` cleanup in `useEffect` is the WebSocket equivalent of `cancelledRef.current = true` — without it, multiple socket connections accumulate on every re-render.

---

---

## 🔷 TOPIC 4 — UI/UX Decisions, CSS Layout & Popups

---

### ❓ Q4.1 — How does the layout adapt to mobile? Walk through `MainLayout`'s responsive CSS.

---

### ✅ IDEAL ANSWER

`MainLayout` uses a **flex-based responsive layout**:

```jsx
// Outer shell — full-screen flex row
<div className="min-h-screen bg-slate-50 flex overflow-x-hidden">

  // Sidebar — sticky on desktop, drawer on mobile
  <div className="print:hidden lg:sticky lg:top-0 lg:h-screen lg:self-start z-40 shrink-0">
    <Sidebar isMobileOpen={mobileSidebarOpen} onCloseMobile={...} />
  </div>

  // Main content — takes remaining horizontal space
  <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
    <TopBar onToggleMobileMenu={...} />
    <WorkflowStepper />
    <main className="flex-1 p-3.5 sm:p-5 lg:p-8">
      <Outlet />
    </main>
  </div>
```

**Responsive behavior:**
- **Desktop (lg: ≥1024px)**: Sidebar is `lg:sticky lg:top-0 lg:h-screen` — stays visible while content scrolls
- **Mobile (<1024px)**: Tailwind's `lg:` prefixes don't apply — Sidebar becomes a drawer, toggled by the hamburger button in `TopBar` via `mobileSidebarOpen` state. Location changes automatically close it via `useEffect`.

**`min-w-0` on the content div** is a critical Flexbox fix — without it, the flex child can overflow its container when content (long URLs, wide tables) is wider than the available space.

**`shrink-0` on the sidebar** prevents the sidebar from compressing even when content is small.

**Padding scale:** `p-3.5 sm:p-5 lg:p-8` — tighter on mobile, comfortable on desktop.

---

### ❓ Q4.2 — Explain your skeleton loading strategy. How does `CaseLoadingOverlay` work?

---

### ✅ IDEAL ANSWER

**Why skeletons over a spinner?**
Skeletons preserve the **shape and layout** of incoming content — a doctor immediately knows where the patient list, biomarker cards, and chart will appear. Spinners say "wait." Skeletons say "content is loading here" and dramatically reduce perceived loading time.

**`SkeletonBlock` implementation:**
```jsx
export function SkeletonBlock({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-gradient-to-r
      from-slate-200 via-slate-100 to-slate-200
      bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}
```
`animate-shimmer` is a custom `@keyframes shimmer` in `index.css` that sweeps a bright gradient band across the element — the classic "light sweep" loading effect. Tailwind's built-in `animate-pulse` only gives opacity pulsing, not this moving gradient.

**`CaseLoadingOverlay` — shown for 650ms when a patient case loads:**
```js
// PatientDataContext.selectPatientCase()
setIsCaseLoading(true);
setTimeout(() => setIsCaseLoading(false), 650);
```
Inside the overlay, 3 clinical steps display sequentially using `setTimeout` chains at 180ms → 360ms → 520ms:
- "Retrieving DEXA & Endocrine Lab Panels..."
- "Synthesizing Metabolic & Biomechanical Risk..."
- "Initializing Interactive 3D Bone Geometry..."

This is a **deliberate UX design** — the data may already be loaded, but the animation makes the context switch feel intentional and clinical rather than jarring.

---

### ❓ Q4.3 — Why are modals managed in Context and rendered at the layout root?

---

### ✅ IDEAL ANSWER

Modal open/close state lives in `PatientDataContext`:
```js
const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
// ...
```

Modals are rendered **once** at the root of `MainLayout`:
```jsx
<NewCaseModal />
<SettingsModal />
<SupportModal />
<DoctorProfileModal />
```

**Why this design?**

1. **Any component can trigger any modal** — The Sidebar's "New Case" button, TopBar's settings icon, and Dashboard's CTA can all call `setIsNewCaseModalOpen(true)` via `usePatientContext()`. No prop drilling required.

2. **Single DOM instance** — If `NewCaseModal` lived inside `DashboardView`, navigating away from Dashboard while the modal is open would unmount it and lose the form state.

3. **Decoupling trigger from UI** — The button that opens a modal doesn't own the modal's JSX. It's just a state setter.

4. **Z-index stacking** — Modals are the last children in the layout, so they naturally appear above all content. The alternative (`ReactDOM.createPortal()`) renders into `document.body` to escape CSS stacking contexts — both approaches achieve the same result.

---

### ❓ Q4.4 — What is the `useEffect` in `MainLayout` doing with `location.pathname`?

---

### ✅ IDEAL ANSWER

```js
useEffect(() => {
  const match = location.pathname.match(/\/patients\/([^/]+)/);
  const routePatientId = match ? match[1] : null;

  if (routePatientId && routePatientId !== activePatientId) {
    setActivePatientId(routePatientId);  // URL has patient → activate it
  } else if (!routePatientId && activePatientId) {
    setActivePatientId(null);            // URL has no patient → clear state
  }
}, [location.pathname]);
```

**The URL ↔ State desync bug it prevents:**

**Case 1 — Deep link:** A doctor shares `/patients/PEB-8842-A/assessment`. When opened fresh, `activePatientId` is `null` (default). Without this sync, `AIAssessmentView` would render with no patient data even though the URL clearly specifies one. The `useEffect` reads the ID from the URL and activates it.

**Case 2 — Clear on navigate:** A doctor navigates from `/patients/PEB-8842-A/assessment` back to `/dashboard`. The URL has no `/patients/` segment, so `routePatientId = null`. Without clearing, the dashboard might still show the previous patient's data. Clearing `activePatientId` resets all patient-dependent views.

**`location.pathname` as dependency** — the effect re-runs on every URL change, which is exactly when patient context should re-sync.

This makes the **URL the single source of truth** for which patient is active — the app can be bookmarked at any patient-specific route and recover correctly.

---

### ❓ Q4.5 — How does role-based access control work? Walk through `AdminRoute`.

---

### ✅ IDEAL ANSWER

```jsx
function AdminRoute({ children }) {
  const token = hydrateAuthHeader();
  if (!token) return <Navigate to="/login" replace />;  // Not authenticated

  const profileRaw = localStorage.getItem('endobone_doctor_profile');
  try {
    const profile = JSON.parse(profileRaw || '{}');
    if (profile?.role === 'admin') {
      return children;                                   // Admin role → allow
    }
  } catch { /* JSON parse failed → fallthrough */ }

  return <Navigate to="/dashboard" replace />;           // Not admin → redirect
}
```

**Three layers of protection:**

| Layer | Where | What it checks |
|-------|-------|----------------|
| `ProtectedRoute` | Frontend | JWT token exists in localStorage |
| `AdminRoute` | Frontend | `profile.role === 'admin'` in localStorage |
| FastAPI backend | Server | JWT signature + role claim on every `/admin` endpoint |

**Critical security note:** Frontend RBAC is **UX convenience only, not security**. A determined user could manually set `role: "admin"` in localStorage and bypass the frontend guard. The real security gate is the FastAPI server rejecting unauthorized requests. Always validate on the server.

`<Navigate replace />` — the `replace` prop replaces the history entry instead of pushing a new one, so the Back button doesn't loop between the guarded route and the redirect target.

`hydrateAuthHeader()` reads the token AND sets it on `apiClient.defaults.headers.Authorization` in one call — ensuring both the route guard check and future API calls use the token.

---

---

## 🏆 FINAL JUDGE SUMMARY

| Topic | Key Strengths | Watch Out For |
|-------|--------------|---------------|
| **Component Hierarchy** | Outlet pattern, lazy loading, route guards, AppLoadingScreen | Be ready to name WHICH views are heavy and WHY lazy() helps them specifically |
| **State Management** | `biomarkerValueKey` memoization trick, offline fallback, `cancelledRef` | Know useMemo vs useCallback vs useRef differences clearly |
| **API & Error Handling** | Interceptors, error normalization, graceful degradation, Vite proxy | WebSocket absence — know the theoretical socket.io implementation pattern |
| **UI/UX** | Skeleton loaders with shimmer, responsive flex layout, global modal pattern | Be ready to explain `min-w-0`, `shrink-0`, and the 650ms overlay UX decision |

---

> 💡 **Study Tip:** For each answer, open the corresponding file and point to specific line numbers during the demo.
> Being able to say *"On line 56 of `PatientDataContext.jsx`, the `cancelledRef` prevents this exact race condition"* is what separates a **good presentation** from an **outstanding one**.
