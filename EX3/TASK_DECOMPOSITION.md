# Exercise 1.3 — React Form Validation & Data Fetching

## Scope and execution rules

This is a **planning-only** work breakdown structure (WBS). It is based solely on the supplied requirements; no repository, source files, or existing documentation were inspected. File names and component contracts below are **proposed** and must be confirmed during implementation. Do not overwrite `PROJECT_RULES.md` or `AGENTS.md`. Keep existing Exercise 1.1/1.2 behavior intact when integrating. No application code is implemented by this document.

**In scope:** analysis of legacy effect-driven validation, synchronous multi-field validation with Context, accessible errors, submitted-data inspector, abortable forum fetching, three-channel switcher, Express CORS and POST validation, automated tests, DevTools evidence, and atomic commits. **Out of scope:** new UI frameworks, global state libraries, schema libraries unless already installed, authentication, persistence, retry frameworks, caching, and unrelated refactoring.

**Proposed ownership:** `SimpleForm.jsx` owns form values, touched/submitted state, validation results and submit handling; `InputField.jsx` reads context and updates its own named value; `ShowData.jsx` renders the last successfully submitted snapshot; `useForumMessages.js` owns request lifecycle for one channel; Express owns CORS and request validation. Exact paths and API shape are to be confirmed against the provided exercise materials at execution time.

## Phase 0 — Contract confirmation and baseline (planning gate)

### T13-00.01 — Confirm exercise contracts
- **Objective:** Establish exact component, API, and assessment contracts before coding.
- **Implementation details:** At execution time only, review the exercise instructions and relevant project files; record required fields, validation rules, server route/method, channel response shape, valid POST schema, port/origin, scripts, and existing tests. Resolve differences between this proposed WBS and actual starter code without expanding scope.
- **Dependencies:** None.
- **Acceptance criteria:** A short implementation note records verified contracts and any open assumptions; no source changes are made during this gate.

### T13-00.02 — Capture baseline and change boundaries
- **Objective:** Prevent regressions and unintended edits.
- **Implementation details:** At execution time, check working-tree status, available test/build/lint scripts and existing React/Express setup; note pre-existing failures. Identify precise files needed for Exercise 1.3; preserve unrelated routes, accessibility behavior and configurations.
- **Dependencies:** T13-00.01.
- **Acceptance criteria:** Baseline command results and change boundaries are documented; pre-existing modifications are not overwritten.

## Phase 1 — Legacy validation anti-pattern analysis

### T13-01.01 — Trace legacy InputField ↔ SimpleForm effects
- **Objective:** Explain the existing effect-driven validation data flow.
- **Implementation details:** At execution time, map input change → local state → `useEffect` → parent callback → parent state → child props/effect. Identify redundant derived state, effect dependency loops and any duplicate updates; distinguish observed defects from theoretical risks.
- **Dependencies:** T13-00.02.
- **Acceptance criteria:** A concise before/after data-flow description identifies each effect-based synchronization edge and why it is unnecessary for pure validation.

### T13-01.02 — Document failure modes and replacement rationale
- **Objective:** Justify a synchronous Context-driven design.
- **Implementation details:** Describe cascading render passes, temporarily out-of-sync validity, stale closures/updates, race conditions when asynchronous effects are involved, and infinite-loop risk when effect dependencies repeatedly change. Clarify that these are risks, not necessarily observed bugs. Specify render-time pure validation as replacement; reserve effects for external side effects.
- **Dependencies:** T13-01.01.
- **Acceptance criteria:** Each risk includes a concrete trigger and mitigation; no claim of an observed loop/race is made without reproduction.

## Phase 2 — Sprint 2: Complete Context-driven form (75–120 minutes)

**Timebox (target 110 minutes):** T13-02.01 (10 min), T13-02.02 (20 min), T13-02.03 (20 min), T13-02.04 (15 min), T13-03.01 (15 min), T13-03.02 (15 min), T13-03.03 (15 min). These tasks, their focused tests, and all three commits are **one Sprint 2**, not preparatory work plus a separate sprint. Assumes contracts and tooling were confirmed in Phase 0; adjust within 75–120 minutes without skipping required behavior or evidence.

**Commit boundaries:** commit `feat: form context` once T13-02.02 has passing focused provider tests; commit `feat: input field validation` once T13-02.03, T13-02.04 and T13-03.01 have passing focused field/form tests; commit `feat: inspector output` once T13-03.02 has passing inspector tests. Each commit includes only its related code and tests; no duplicate commits.

### T13-02.01 — Define validation and Context contracts
- **Objective:** Establish a single source of truth for multiple form fields.
- **Implementation details:** Define field names and pure validators based on confirmed requirements; `values`, `errors`, `touched`, `submitted/attempted`, `setFieldValue`, `setFieldTouched`, and `handleSubmit`. Derive errors synchronously from current values during render (or pure memoization if justified); do not mirror derived validity in state. Decide when errors become visible (blur or attempted submit).
- **Dependencies:** T13-01.02.
- **Acceptance criteria:** Contract covers every confirmed required field and cross-field rules only if specified; multiple fields share one Context, each update targets its own key, and `isValid` is derived from the current errors (e.g., no errors), not separately stored; validation is deterministic and has no network/effect dependencies.

### T13-02.02 — Implement SimpleForm Context provider
- **Objective:** Share canonical form state without prop-drilling or effect chains.
- **Implementation details:** Use `createContext()` and `useContext()`; keep editable values and interaction state in the form owner; provide stable field update behavior; compute validity from current values; block invalid submit and capture an immutable submission snapshot on valid submit. Avoid effects that synchronize child validity into parent state.
- **Dependencies:** T13-02.01.
- **Acceptance criteria:** At least two `InputField` instances consume the same provider; editing one field changes only that field’s value (other field values are preserved); validity is derived from current validation errors, not separately synchronized state; valid/invalid submission uses the same current values; no redundant `useEffect` validation chain or child-to-parent validity feedback loop remains.

### T13-02.03 — Implement accessible InputField contract
- **Objective:** Make each field context-driven and accessible.
- **Implementation details:** `InputField.jsx` receives field identity/label and reads value, touched status and error from Context; use `useId()` for unique input/help/error IDs; connect `<label htmlFor>`, `id`, `aria-invalid` and conditional `aria-describedby`. Ensure described-by references exist in the DOM; preserve keyboard and native input behavior. Do not call `useId` conditionally.
- **Dependencies:** T13-02.02.
- **Acceptance criteria:** All fields have unique IDs and labels; invalid fields expose `aria-invalid=true` and announce their matching visible errors; valid fields do not reference missing error elements.

### T13-02.04 — Verify synchronous multi-field interactions
- **Objective:** Confirm form correctness before inspector integration.
- **Implementation details:** Test independent edits, empty/invalid/valid values, multiple simultaneous errors, blur and submit visibility rules, correction of errors, and one-submit behavior. Check that no effect-driven feedback cycle occurs.
- **Dependencies:** T13-02.03.
- **Acceptance criteria:** Focused tests pass; each field's error reflects its current value without a post-render synchronization step; failures are recorded rather than hidden.

**Sprint 2 continuation — integration, inspector, verification and commit completion (still Phase 2).**

### T13-03.01 — Integrate SimpleForm and InputField
- **Objective:** Deliver the required multi-field form as one coherent interface.
- **Implementation details:** Wire confirmed fields and validators to the provider; present field-level messages and an accessible submit control; keep exactly the intended submit behavior and avoid unnecessary re-renders/effects. Reserve 15 minutes for wiring and integration; foundational provider/field work and tests are already budgeted in T13-02.*.
- **Dependencies:** T13-02.04.
- **Acceptance criteria:** All required fields work together; invalid submission is blocked; accessible error presentation is consistent.
- **Commit checkpoint:** Verify that `feat: form context` was made after T13-02.02, then create `feat: input field validation` after this integration and its focused tests pass. Do not duplicate the first commit.

### T13-03.02 — Implement ShowData submitted JSON inspector
- **Objective:** Display submitted data only after successful validation.
- **Implementation details:** Add `ShowData.jsx` to render a readable JSON representation of the last successful submission, preferably using semantic `<pre><code>`; do not render passwords/secrets if present. Separate live editing state from submitted snapshot so later edits do not silently change inspector output. Reserve 15 minutes, including focused inspector tests.
- **Dependencies:** T13-03.01.
- **Acceptance criteria:** No inspector before first success; invalid submit leaves previous successful snapshot unchanged; valid submit displays correct field names and values as valid JSON.
- **Commit checkpoint:** `feat: inspector output` after inspector tests pass.

### T13-03.03 — Sprint 2 review and evidence
- **Objective:** Verify the three required atomic commits and form UX.
- **Implementation details:** Run focused unit/component tests, lint/typecheck/build as available; record test results, screenshot invalid field errors and valid JSON output; review `git diff` and commit history. Reserve 15 minutes for final checks, evidence and commit-history verification; all Sprint 2 tasks together target 110 minutes.
- **Dependencies:** T13-03.02.
- **Acceptance criteria:** Three distinct commits exist in required order, each with narrow scope; form checks pass or exceptions are documented; evidence is saved.

## Phase 3 — Fetch hook and Express hygiene

### T13-04.01 — Specify forum API and channel behavior
- **Objective:** Establish consistent client/server contracts.
- **Implementation details:** Confirm GET endpoint, channel parameter, JSON response/error shapes and accepted channel names: `nasa`, `esports-tribunal`, `notNasa`. Specify how unknown channels and HTTP failures are reported **only as required by the confirmed contract**; identify the POST endpoint and payload rules from exercise requirements rather than inventing them.
- **Dependencies:** T13-00.01.
- **Acceptance criteria:** Request/response and validation contracts are documented, including known status expectations (if specified) and the three exact channel identifiers; no fabricated endpoint, schema or status-code contract.

### T13-04.02 — Extract useForumMessages.js
- **Objective:** Isolate asynchronous request lifecycle from UI.
- **Implementation details:** Create hook accepting selected channel; use `useState` for `loading`, `data`, `error`, and `useEffect` only for external fetch lifecycle. Create a fresh `AbortController` per effect/request; pass `signal` to `fetch`; abort in cleanup on channel change/unmount. Clear or isolate stale channel data at request start; guard against late state updates (including responses that resolve near cancellation); ignore abort as a user-facing error.
- **Dependencies:** T13-04.01.
- **Acceptance criteria:** Rapid changes never display an old channel's response as the new channel; cleanup aborts obsolete requests; current request has correct loading/success/error state; no state update after unmount.

### T13-04.03 — Configure Express CORS and request validation
- **Objective:** Permit intended frontend requests and reject malformed POST data.
- **Implementation details:** Use Express `cors()` middleware where required and configure the permitted browser origins/methods/headers based on the confirmed setup. **CORS is a browser-enforced cross-origin access policy, not authentication, authorization, input validation, or a barrier against non-browser clients.** Independently validate POST bodies server-side against the **confirmed** exercise contract; reject malformed JSON and invalid payloads with appropriate 4xx responses. Do not invent required fields, types, length limits, or business rules; do not trust frontend validation.
- **Dependencies:** T13-04.01.
- **Acceptance criteria:** Permitted browser-origin requests/preflight receive the expected CORS headers; disallowed origins do not receive authorization-granting CORS headers (this does **not** mean the server blocks every direct HTTP request). Independently, valid POST bodies pass and contract-invalid/malformed bodies receive deterministic 4xx responses without server crashes, including when sent outside a browser.

### T13-04.04 — Hook/server focused verification
- **Objective:** Prove lifecycle and boundary correctness before UI integration.
- **Implementation details:** Test abort cleanup, stale response suppression, HTTP/network failure, empty/valid data, CORS preflight, accepted and rejected POST bodies; mock delayed responses deterministically where useful and run a real-server integration check.
- **Dependencies:** T13-04.02, T13-04.03.
- **Acceptance criteria:** Automated checks cover both frontend and backend failure paths; abort is distinguished from real errors; results are recorded.

## Phase 4 — Sprint 3: Full-stack live channel switcher

### T13-05.01 — Implement accessible three-channel switcher
- **Objective:** Let users select and view live forum messages.
- **Implementation details:** Render `nasa`, `esports-tribunal`, `notNasa` controls with native buttons or an accessible select; keep selected channel in React state and pass it to `useForumMessages`. Expose active selection, loading, success/empty and error views with appropriate accessible status announcements. Do not duplicate fetching in the component.
- **Dependencies:** T13-04.04.
- **Acceptance criteria:** All three channels are selectable by keyboard and pointer; content corresponds to current channel; each lifecycle state is visible and accessible.

### T13-05.02 — Verify cancellation under Slow 3G
- **Objective:** Demonstrate actual in-flight cancellation and no stale UI.
- **Implementation details:** Start frontend and Express server; open Chrome DevTools → Network, enable Slow 3G and Preserve log; switch channels rapidly while requests are pending. Inspect aborted/canceled requests and final channel content. Distinguish browser abort evidence from server-side processing (which may already have started); repeat with controlled delayed responses if throttling alone is inconclusive.
- **Dependencies:** T13-05.01.
- **Acceptance criteria:** Evidence shows at least one obsolete client request canceled, no stale response overwriting latest selection, and correct final selected channel; inconclusive DevTools behavior is documented accurately.

### T13-05.03 — Capture full-stack error logs
- **Objective:** Preserve reproducible failure evidence.
- **Implementation details:** Trigger reproducible network/server errors and invalid POST cases permitted by the existing setup; capture browser Console/Network details and Express terminal logs with timestamps, actual request identifiers/routes/statuses where available, and reproduction steps. Redact tokens, personal data and sensitive payloads; do not intentionally leave debug-only failure code enabled.
- **Dependencies:** T13-05.01, T13-04.03.
- **Acceptance criteria:** Saved evidence links each reproduced error to client behavior and server response/log; logs are readable, redacted and distinguish expected validation errors from unexpected failures.

## Phase 5 — Testing layers and regression checks

### T13-06.01 — Unit and component tests for form
- **Objective:** Verify pure validation and user-observable form behavior separately.
- **Implementation details:** **Unit:** exercise confirmed pure validators and error/validity derivation using representative valid, invalid and boundary values; do not invent validation rules. **Component:** render multiple `InputField` instances under one provider; type into one field and assert other field values are unchanged, current errors/validity update synchronously, labels and `useId()` IDs are unique, `aria-invalid`/`aria-describedby` target existing messages, invalid submit is blocked, valid submit produces the correct `ShowData` JSON snapshot, and later invalid edits do not mutate the previous successful snapshot. Sprint 2 runs a focused subset; this task expands regression coverage afterward.
- **Dependencies:** T13-03.03.
- **Acceptance criteria:** Unit tests prove deterministic validation and derived validity; component tests prove independent field edits, accessibility wiring, invalid/valid submissions and inspector snapshots through observable interactions. Record PASS/FAIL/SKIP and gaps.

### T13-06.02 — Hook and Express integration tests
- **Objective:** Verify asynchronous races and actual HTTP server boundaries.
- **Implementation details:** **Hook/component tests:** simulate delayed and out-of-order responses for `nasa`, `esports-tribunal`, `notNasa`; assert loading/success/empty/error states, abort cleanup, no stale response overwrite and no ordinary error shown for cancellation. **Integration:** exercise actual Express middleware and HTTP handling, including permitted/disallowed browser Origin headers, OPTIONS/preflight if applicable, contract-valid POST and contract-invalid/malformed POST from an HTTP client. Check CORS response headers separately from backend validation outcomes; never interpret missing CORS headers as proof a request was blocked server-side.
- **Dependencies:** T13-05.03, T13-04.04.
- **Acceptance criteria:** Deterministic races never show obsolete channel data; abort behavior and genuine errors are distinguishable; real HTTP tests verify CORS headers and independent 4xx validation responses. Actual outcomes and limitations are recorded.

### T13-06.03 — Manual browser and quality verification
- **Objective:** Demonstrate full-stack behavior in a browser and check regressions.
- **Implementation details:** **Manual browser:** keyboard-test the form and all three channel controls; verify error correction, submission and JSON output; use Chrome DevTools Slow 3G with Preserve log to capture an obsolete canceled request and correct final channel; save reproducible, redacted browser/Express error logs. **Quality:** run existing test, lint, typecheck and production build commands when available; check existing Exercise 1.1/1.2 routes only if this exercise shares the app. Record actual PASS/FAIL/SKIP, environment and limitations; do not claim DevTools evidence from simulated tests alone.
- **Dependencies:** T13-06.01, T13-06.02, T13-05.02.
- **Acceptance criteria:** Manual evidence shows form invalid/valid states, inspector JSON, all three channels, Slow 3G cancellation and error handling; commands/results and any regression or missing evidence are documented.

## Phase 6 — Git review and delivery

### T13-07.01 — Audit atomic commit history
- **Objective:** Ensure meaningful, reviewable Git history.
- **Implementation details:** Verify Sprint 2 has the exact required sequence: (1) `feat: form context`, (2) `feat: input field validation`, (3) `feat: inspector output`. Keep hook, Express and switcher changes in separate later commits such as `feat: abortable forum hook`, `fix: express cors and payload validation`, `feat: live channel switcher`, and `test: exercise 1.3 verification`. Commit tests with the relevant feature when practical; avoid mixing unrelated changes. Do not push unless separately authorized.
- **Dependencies:** T13-03.03, T13-06.03.
- **Acceptance criteria:** Each commit is independently explainable; required three messages and order are present; no unrelated or sensitive files included.

### T13-07.02 — Prepare final handover
- **Objective:** Supply complete grading/review evidence.
- **Implementation details:** Summarize implemented tasks, contract decisions, commit hashes, test commands/results, screenshots and redacted logs, known limitations and any incomplete acceptance criteria. Include a compact mapping from requirements to task IDs/evidence. Do not claim checks ran if not executed.
- **Dependencies:** T13-07.01.
- **Acceptance criteria:** Reviewer can locate code changes, three Sprint 2 commits, Slow 3G cancellation evidence, CORS/POST tests, inspector output and full-stack error logs.

## Execution order and critical dependencies

`T13-00.01 → T13-00.02 → T13-01.01 → T13-01.02 → [Sprint 2: T13-02.01 → T13-02.02 → T13-02.03 → T13-02.04 → T13-03.01 → T13-03.02 → T13-03.03]`

Backend/fetch track can begin after contract confirmation: `T13-04.01 → (T13-04.02 + T13-04.03) → T13-04.04 → T13-05.01 → (T13-05.02 + T13-05.03)`.

Finish with `T13-06.01 + T13-06.02 → T13-06.03 → T13-07.01 → T13-07.02`. Parallel work is optional; preserve dependency gates and three required Sprint 2 commit boundaries.

## Evidence checklist and final deliverables

- **Form:** invalid multi-field screenshot; corrected/valid submission screenshot; ShowData JSON screenshot; focused form test output.
- **Fetching:** three-channel UI screenshots; Chrome Network Slow 3G showing canceled obsolete request and final selected channel; rapid-switch test output.
- **Backend:** CORS preflight/response evidence; valid/invalid/malformed POST status evidence; redacted browser and Express error logs.
- **Quality/Git:** actual test/build/lint/typecheck report, any accessibility check results, regression notes, three required Sprint 2 commit hashes, subsequent scoped commits, and final requirement-to-evidence mapping.

**Planning assumptions:** The entire Phase 2 (all T13-02.* and T13-03.* tasks, focused tests and three atomic commits) fits the 75–120 minute Sprint 2 timebox and assumes the starter project and validation rules are already supplied. Sprint 3 and integration testing require separate time; do not invent exact API routes, field schemas, test results, or commit hashes before inspecting the actual exercise during execution.
