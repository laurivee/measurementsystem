# PDR — Tap-Only Measurement Web App (Vercel + Supabase)

## 0) What changed

* Remove camera, QR/barcode, and offline/PWA.
* Phone-first **tap UI** with big buttons.
* Operators select unit and stage from short lists; *one-tap start / one-tap complete*.
* Keep the same event schema and analytics; simplify frontend and infra.

---

## 1) Scope & success

**In scope**

* Phone web app for operators to record **start/complete, blockers, rework, defects** by tapping.
* Minimal navigation: choose *Workstation → Unit → Stage card*.
* Supervisor live WIP & metrics.
* CSV export.

**Success**

* ≤ 3 taps to log a start or complete.
* Median write latency < 600 ms.
* ≥ 95% completeness of traces across stages.

---

## 2) Process → event map (unchanged)

Stages: `order_info`, `bead_prep`, `insert_beads`, `pack`, `ship`.

Events: `stage_start`, `stage_complete`, `rework_*`, `blocker`, `shipment_dispatch`, `annotation`.

---

## 3) Architecture (simplified)

**Frontend**

* Next.js (App Router) on Vercel.
* Tailwind + Radix UI. No service worker. No camera libs.

**Backend**

* Supabase (Postgres, Auth, RLS, Storage), Edge Functions:
  * `ingest_event` (single event)
  * `bulk_ingest` (optional)
  * `export_csv`

**Realtime**

* Supabase Realtime feeds WIP/throughput dashboards.

---

## 4) Data model (minor additions)

Add lightweight **work session** to remember the operator's current context and cut taps:

```sql
create table op_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  workstation_id uuid references workstations(id),
  stage stage_key,
  unit_id uuid,
  updated_at timestamptz default now()
);

create index on op_sessions (user_id);
```

Optional helper for **unit sequences** when units aren't preloaded:

```sql
create table unit_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade,
  label text not null,      -- e.g., "Bracelets 2025-W45"
  qty integer not null check (qty > 0),
  created_at timestamptz default now()
);

-- A function to "create next unit" for that batch (returns unit_id).
```

Core `events`/`orders`/`units` remain as previously specified.

---

## 5) Tap-first UX flows

### Operator journey

1. **Pick Workstation** (first launch only; stored in `op_sessions`).
2. **Today's Units** list (sticky search + quick filters):
   * "My current unit" pinned on top (if any).
   * "Next from order …" chips if using batches.
3. **Stage cards** for the selected unit (big buttons):
   * **Start** toggles to "In progress".
   * **Complete** opens a tiny sheet:
     * qty_good (default 1), qty_defect (default 0)
     * quick defect chips
     * **Save** (single tap)
4. **Blocker** button (always visible):
   * reason chips + quick duration (1, 5, 10 min) or timer.
5. **Rework** toggle on any stage complete sheet.
6. **Ship** (on packing/ship lanes): carrier select + tracking text → **Dispatch**.

**Micro-interactions**

* Long-press on Complete opens the full sheet; short tap uses defaults (1 good, 0 defect).
* Haptic vibration on success (mobile).
* Top-bar shows **context**: Workstation • Stage • Unit.

### Supervisor view

* **Live WIP** board (columns = stages; cards show count + median cycle time).
* **Top blockers** today.
* **FPY / Throughput / OT%** tiles.
* Date picker (today, 7d, 30d).

---

## 6) Navigation layout

* `/login`
* `/choose-workstation`
* `/units` — list w/ quick filters: *All*, *In progress*, *Mine*, *Waiting at <stage>*
* `/unit/:id` — **Stage cards screen**
* `/dashboard` — supervisor
* `/admin` — orders, units, batches, workstations

---

## 7) API contracts (frontend → edge)

`POST /functions/v1/ingest_event`

```json
{
  "org_id": "uuid",
  "unit_id": "uuid",
  "order_id": "uuid",
  "stage": "insert_beads",
  "type": "stage_start",
  "workstation_id": "uuid",
  "ts_device": "2025-11-09T13:22:31.000Z"
}
```

`type = "stage_complete"` payload additionally accepts:

```json
{ "qty_good": 1, "qty_defect": 0, "defect_code": "MISS_BEAD", "rework": false }
```

`POST /functions/v1/blocker`

```json
{ "unit_id": "uuid", "stage": "pack", "blocker_code": "MATERIAL_SHORTAGE", "blocker_minutes": 5 }
```

`POST /functions/v1/create_next_unit` (optional if using batches)

```json
{ "batch_id": "uuid" }
```

---

## 8) UI components (to scaffold)

* `WorkstationPicker`
* `UnitList` (virtualized, search, filter chips)
* `StageCard` (Start/Complete states)
* `CompleteSheet` (qty pads + defect chips)
* `BlockerButton`
* `TopBarContext`
* `WipBoard`
* `MetricTile` (FPY/Throughput/OT%)

---

## 9) Validation & rules (server)

* Enforce legal transitions (optional): can only complete a stage **after** start; handoff implied by completing stage N then starting stage N+1.
* Clamp negatives; default quantities.
* Idempotency key: hash of `(unit_id, stage, type, ts_device truncated to sec)` to prevent dup taps.
* Auto-attach `org_id` from JWT membership; never trust client's org.

---

## 10) Analytics (unchanged essentials)

* **Cycle time**: `complete.ts - start.ts` per stage, p50/p90.
* **Lead time**: `ship - order_info`.
* **WIP**: starts without completes.
* **FPY** and **Rework rate** by stage.
* **OT%** vs `orders.promised_ship_date`.

(Use the SQL from the earlier PDR.)

---

## 11) Non-functional

* **Auth**: Supabase email or SSO; roles: operator/supervisor/admin via `org_members`.
* **RLS**: same org-scoped policies as before.
* **Perf**: indexes on `(org_id, stage, ts_server)` & `(org_id, unit_id)`.
* **Reliability**: no offline; show toast when network fails and keep a **retry last action** button.

---

## 12) Minimal seed & demo

* Seed 3 stages, 2 workstations, 1 order with 20 units (or 1 batch of 20).
* Demo user: operator@demo / supervisor@demo.
* Preload **defect codes**: `MISS_BEAD`, `THREAD_BREAK`, `COLOR_MISMATCH`.

---

## 13) Implementation checklist (for the AI agent)

**Day 1–2**

* [ ] Create Supabase project; apply schema (events, orders, units, op_sessions, org_members).
* [ ] Implement `ingest_event` function with zod validation & idempotency.
* [ ] Next.js app scaffold; Supabase client; Auth.

**Day 3–4**

* [ ] `/choose-workstation` + persist to `op_sessions`.
* [ ] `/units` list with filters and sticky "current unit".
* [ ] `/unit/:id` stage cards with **Start** and **Complete** (default 1/0) + **Blocker** sheet.

**Day 5**

* [ ] `/dashboard` WIP board (Realtime), FPY/Throughput tiles.
* [ ] CSV export endpoint + button.

**Polish**

* [ ] Defect quick chips; rework toggle.
* [ ] "Create next unit" from batch (optional).
* [ ] E2E test: start/complete across all stages for 5 units → metrics match SQL.

---

## 14) Risks & mitigations

* **Wrong unit selection**: pin "current unit", confirm switch with 1-tap toast undo; filter to **Waiting at this workstation** by default.
* **Tap misfires**: large hit targets (min 48px), haptics + success toast, disable double-submit.
* **No IDs preloaded**: enable quick *Create next unit* from a batch to keep flow moving.

---

## 15) Example tap flows (copy into QA scripts)

**Flow A — happy path**

1. Choose Workstation "Insert".
2. Units → pick `Unit #1042`.
3. Tap **Start Insert**.
4. Tap **Complete** (short tap) → logs 1 good.
5. Units → pick `Unit #1043` (auto suggested "Next").

**Flow B — defect + blocker**

1. Tap **Start Pack**.
2. **Blocker** → `MATERIAL_SHORTAGE` → 5 min.
3. **Complete** (long-press) → qty_good 0, qty_defect 1, `COLOR_MISMATCH` → Save.

---

This version is intentionally boring—in a good way. Pure taps. No scanning. No PWA. It still yields clean event streams for cycle/lead time, FPY, bottlenecks, and on-time shipping. When you're ready, I can translate this into SQL migrations and a Next.js scaffold so your agent can ship the first clickable slice.

