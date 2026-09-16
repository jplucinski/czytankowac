# CzyTankowac.pl MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Polish fuel-price recommendation site where a scheduled OpenAI agent researches the market, opens a GitHub pull request with a typed forecast, a second agent validates it, and GitHub automatically merges and deploys the site when review passes.

**Architecture:** Astro renders only repository data; there is no runtime backend or database. GitHub Actions is the scheduler and ephemeral compute layer. OpenAI Agents SDK runs a Research Agent and an independent Review Agent; GitHub PRs are the publication/audit boundary. The workflow chain is `schedule -> research -> branch/PR -> repository_dispatch -> review -> merge -> workflow_dispatch deploy`.

**Tech Stack:** Node.js 22, TypeScript, Astro, `@openai/agents`, Zod v4, Vitest, GitHub Actions, GitHub CLI, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-16-czytankowac-design.md`

## Global Constraints

- MVP covers Poland only and two fuels: `PB95` and `DIESEL`.
- Forecast horizon is exactly 7 days.
- Recommendation values are exactly `FILL_UP`, `NORMAL`, or `WAIT`.
- Direction values are exactly `UP`, `STABLE`, or `DOWN`.
- The web app is fully static; no API server, database, queue, worker, Lambda, or always-on agent.
- Agents run only inside GitHub Actions.
- Research output is schema-validated JSON before any PR is created.
- A forecast must include at least 3 source references and at least 2 distinct source hosts.
- Research and review are separate agent runs with separate instructions.
- Review must independently use web search; it must not approve solely from the Research Agent narrative.
- A failed deterministic validation or `REJECT` decision must never merge.
- The Research workflow never merges its own PR.
- Use `repository_dispatch` to start review and `workflow_dispatch` to start deploy; do not rely on workflow chaining from bot-generated `push` events.
- Default research cadence: once daily at `05:30 UTC`, plus manual `workflow_dispatch`.
- Keep model choice configurable through repository variables; do not hard-code a model name into domain logic.
- Store no OpenAI key in the repository. Use `OPENAI_API_KEY` as a GitHub Actions secret.

---

### Task 1: Project foundation and forecast contract

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/domain/forecast.ts`
- Create: `src/data/latest.json`
- Create: `src/data/history/.gitkeep`
- Create: `tests/domain/forecast.test.ts`

**Interfaces:**
- Produces: `ForecastSchema`, `Forecast`, `FuelForecast`, `Recommendation`, `Direction`.
- Later tasks consume `ForecastSchema.parse(...)` as the single validation boundary for generated data.

- [ ] **Step 1: Scaffold Astro + TypeScript + test dependencies**

Use npm and install `astro`, `typescript`, `@openai/agents`, `zod`, and `vitest`. Add scripts: `dev`, `build`, `test`, `test:run`, `research`, and `review`.

- [ ] **Step 2: Write the failing forecast-schema test**

```ts
import { describe, expect, it } from 'vitest';
import { ForecastSchema } from '../../src/domain/forecast';

describe('ForecastSchema', () => {
  it('accepts one PB95 and one DIESEL forecast', () => {
    const result = ForecastSchema.safeParse({
      asOf: '2026-09-16T05:30:00Z',
      market: 'PL',
      horizonDays: 7,
      fuels: [
        {
          fuel: 'PB95',
          direction: 'UP',
          recommendation: 'FILL_UP',
          confidence: 0.72,
          summary: 'Wholesale and currency signals point upward.',
        },
        {
          fuel: 'DIESEL',
          direction: 'STABLE',
          recommendation: 'NORMAL',
          confidence: 0.58,
          summary: 'Signals are mixed.',
        },
      ],
      sources: [
        { title: 'A', url: 'https://a.example/x', accessedAt: '2026-09-16T05:20:00Z' },
        { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-16T05:21:00Z' },
        { title: 'C', url: 'https://c.example/x', accessedAt: '2026-09-16T05:22:00Z' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects confidence outside 0..1', () => {
    const result = ForecastSchema.safeParse({
      asOf: '2026-09-16T05:30:00Z',
      market: 'PL',
      horizonDays: 7,
      fuels: [],
      sources: [],
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test and verify failure**

Run: `npm run test:run -- tests/domain/forecast.test.ts`

Expected: FAIL because `src/domain/forecast.ts` does not exist.

- [ ] **Step 4: Implement the schema**

Use Zod enums for fuel, direction, and recommendation; enforce `confidence` between 0 and 1, `horizonDays` equal to 7, exactly two fuel entries, and URL-shaped source values.

- [ ] **Step 5: Run tests and build**

Run: `npm run test:run && npm run build`

Expected: all tests PASS and Astro produces `dist/`.

- [ ] **Step 6: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json vitest.config.ts src tests
git commit -m "feat: define fuel forecast contract"
```

---

### Task 2: Static recommendation page

**Files:**
- Create: `src/domain/forecast-view.ts`
- Create: `src/components/FuelCard.astro`
- Create: `src/components/SignalBadge.astro`
- Create: `src/pages/index.astro`
- Create: `tests/domain/forecast-view.test.ts`

**Interfaces:**
- Consumes: `Forecast`, `FuelForecast`.
- Produces: `toFuelCardViewModel(fuel: FuelForecast)` returning `{ headline, directionLabel, confidencePercent, summary }`.

- [ ] **Step 1: Write view-model tests**

Test the exact mappings `FILL_UP -> "Tankuj do pełna"`, `NORMAL -> "Tankuj normalnie"`, `WAIT -> "Jeśli możesz, poczekaj"`, plus confidence percentage rounding.

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- tests/domain/forecast-view.test.ts`

Expected: FAIL because the mapper does not exist.

- [ ] **Step 3: Implement the pure mapper and Astro components**

`index.astro` must parse `src/data/latest.json` with `ForecastSchema`, render one card per fuel, show the 7-day horizon, last update time, confidence, short explanation, and a source section.

- [ ] **Step 4: Verify**

Run: `npm run test:run && npm run build`

Expected: PASS; generated page is fully static and requires no client-side API call.

- [ ] **Step 5: Commit**

```bash
git add src/pages src/components src/domain/forecast-view.ts tests/domain/forecast-view.test.ts
git commit -m "feat: render static fuel recommendation page"
```

---

### Task 3: Research Agent harness

**Files:**
- Create: `agents/research/research-agent.ts`
- Create: `agents/research/run-research.ts`
- Create: `agents/shared/files.ts`
- Create: `agents/shared/prompts.ts`
- Create: `tests/agents/research-files.test.ts`

**Interfaces:**
- Produces: `runResearch(now: Date): Promise<Forecast>`.
- Produces: `persistForecast(forecast: Forecast): Promise<{ latestPath: string; historyPath: string }>`.
- Uses OpenAI Agents SDK hosted `webSearchTool()` and `ForecastSchema` as `outputType`.

- [ ] **Step 1: Write failing persistence tests**

Use a temporary directory and verify that persistence writes both `latest.json` and a date-keyed history file without mutating unrelated history.

- [ ] **Step 2: Implement deterministic persistence**

Write formatted JSON with a trailing newline. History filename format: `YYYY-MM-DD.json`.

- [ ] **Step 3: Create the Research Agent**

Agent instructions must require: Poland only; PB95 and DIESEL; 7-day direction; at least 3 sources from at least 2 hosts; separation of observed facts from prediction; conservative confidence; no claim that the forecast is certain. Configure `webSearchTool({ searchContextSize: 'medium' })` and `outputType: ForecastSchema`.

- [ ] **Step 4: Create the CLI runner**

`run-research.ts` calls the agent once, validates `result.finalOutput`, persists the result, logs a concise summary, and exits non-zero on missing output or validation failure.

- [ ] **Step 5: Verify locally**

Run unit tests without network. Then, with `OPENAI_API_KEY` set, run `npm run research` once and verify that only `src/data/latest.json` and one history file change.

- [ ] **Step 6: Commit**

```bash
git add agents tests/agents src/data
 git commit -m "feat: add fuel research agent"
```

---

### Task 4: Deterministic validator and independent Review Agent

**Files:**
- Create: `agents/review/review-schema.ts`
- Create: `agents/review/validate-forecast.ts`
- Create: `agents/review/review-agent.ts`
- Create: `agents/review/run-review.ts`
- Create: `tests/agents/validate-forecast.test.ts`

**Interfaces:**
- Produces: `validateForecast(forecast: Forecast, now: Date): ValidationIssue[]`.
- Produces: `runReview(forecast: Forecast): Promise<ReviewResult>`.
- `ReviewResult` is `{ decision: 'PASS' | 'REJECT'; issues: string[]; summary: string }`.

- [ ] **Step 1: Write validator tests**

Cover: missing fuel, duplicate fuel, fewer than 3 sources, fewer than 2 source hosts, invalid confidence, wrong horizon, and an `asOf` timestamp older than 36 hours.

- [ ] **Step 2: Implement validator**

The validator is pure TypeScript and returns explicit issue codes/messages. Any issue blocks the LLM review and causes exit code 1.

- [ ] **Step 3: Define ReviewSchema and Review Agent**

Give the reviewer its own `webSearchTool()`. Its instructions must independently check whether current public evidence supports the direction and recommendation, identify unsupported claims, and return `REJECT` when evidence is contradictory or materially insufficient.

- [ ] **Step 4: Implement `run-review.ts`**

Load `src/data/latest.json`, parse it with `ForecastSchema`, run deterministic validation, then run the Review Agent. Print a machine-readable JSON result to stdout. Exit `0` only for `PASS`; exit `1` for deterministic failure or `REJECT`.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run`

Then run one live review against a generated forecast and inspect the OpenAI trace.

```bash
git add agents/review tests/agents/validate-forecast.test.ts
git commit -m "feat: add independent forecast review gate"
```

---

### Task 5: Scheduled Research workflow that creates a PR

**Files:**
- Create: `.github/workflows/research.yml`
- Create: `scripts/open-forecast-pr.sh`

**Interfaces:**
- Produces branch: `forecast/YYYY-MM-DD`.
- Produces PR title: `Forecast YYYY-MM-DD`.
- Dispatches event: `forecast-review-requested` with `pr_number`, `branch`, and `head_sha`.

- [ ] **Step 1: Add workflow triggers and least-privilege permissions**

Use `schedule` with `30 5 * * *` and `workflow_dispatch`. Give the job `contents: write` and `pull-requests: write`.

- [ ] **Step 2: Add concurrency**

Use a single `research-forecast` concurrency group with `cancel-in-progress: false` so two manual/scheduled runs cannot race to publish competing forecasts.

- [ ] **Step 3: Implement the research job**

Checkout `main`, install Node 22 dependencies with `npm ci`, run tests, run `npm run research`, create/update `forecast/YYYY-MM-DD`, commit generated data, and push.

- [ ] **Step 4: Make PR creation idempotent**

`scripts/open-forecast-pr.sh` must reuse an open PR whose head branch already matches the daily forecast branch; otherwise it creates one with `gh pr create`. It prints the PR number for the next step.

- [ ] **Step 5: Dispatch review explicitly**

After PR creation, call GitHub's repository-dispatch endpoint with event type `forecast-review-requested`. Include the PR number, branch, and head SHA in `client_payload`.

- [ ] **Step 6: Verify**

Run `workflow_dispatch` once in a test repository. Expected result: one branch, one PR, no merge, and a repository-dispatch event emitted.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/research.yml scripts/open-forecast-pr.sh
git commit -m "ci: create forecast pull requests from scheduled research"
```

---

### Task 6: Review workflow, merge gate, and deploy trigger

**Files:**
- Create: `.github/workflows/review.yml`
- Create: `scripts/comment-review.sh`

**Interfaces:**
- Consumes repository dispatch payload `pr_number`, `branch`, `head_sha`.
- Produces PR comment with the review result.
- On PASS: squash-merges the exact reviewed PR and starts `deploy.yml` using `workflow_dispatch`.
- On REJECT: leaves the PR open and exits non-zero.

- [ ] **Step 1: Configure review trigger and permissions**

Trigger only on `repository_dispatch` type `forecast-review-requested`. Grant `contents: write`, `pull-requests: write`, and `actions: write`.

- [ ] **Step 2: Protect against stale review payloads**

Before review, query the PR head SHA and compare it with `client_payload.head_sha`. Abort if they differ. This prevents merging commits the reviewer did not evaluate.

- [ ] **Step 3: Run deterministic CI and Review Agent**

Checkout the dispatched branch, run `npm ci`, `npm run test:run`, `npm run build`, then `npm run review`. Capture the JSON review result.

- [ ] **Step 4: Comment the result on the PR**

For both PASS and REJECT, post a concise comment containing the decision, summary, and issues. Do not use a formal GitHub PR approval as the security boundary.

- [ ] **Step 5: Merge only the reviewed SHA**

Re-check the current head SHA immediately before merge. If unchanged and decision is PASS, run `gh pr merge "$PR_NUMBER" --squash --delete-branch`.

- [ ] **Step 6: Explicitly start deploy**

After a successful merge, run `gh workflow run deploy.yml --ref main`. This is required because bot-authenticated repository mutations should not be relied on to trigger a new `push` workflow.

- [ ] **Step 7: Verify**

Test both paths: a valid forecast must merge and dispatch deploy; a deliberately invalid forecast must remain open with a rejection comment.

- [ ] **Step 8: Commit**

```bash
git add .github/workflows/review.yml scripts/comment-review.sh
git commit -m "ci: review merge and publish validated forecasts"
```

---

### Task 7: GitHub Pages deployment and end-to-end acceptance

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `docs/runbook.md`

**Interfaces:**
- Deploy trigger: `workflow_dispatch`; also allow `push` to `main` for human-originated changes.
- Build artifact: Astro `dist/`.
- Deployment environment: `github-pages`.

- [ ] **Step 1: Implement Pages workflow**

Checkout `main`, use Node 22, `npm ci`, `npm run test:run`, `npm run build`, configure Pages, upload `dist/`, and deploy it. Give only `contents: read`, `pages: write`, and `id-token: write` permissions required by the build/deploy jobs.

- [ ] **Step 2: Configure repository settings**

In GitHub repository settings: enable GitHub Actions as the Pages source; add `OPENAI_API_KEY` as an Actions secret; enable the repository setting that permits GitHub Actions to create pull requests; keep default workflow permissions restricted and grant writes only in the individual workflow files.

- [ ] **Step 3: Add variables**

Create repository variables `OPENAI_RESEARCH_MODEL` and `OPENAI_REVIEW_MODEL`. Agent constructors read these values when present, otherwise use the SDK default model configuration.

- [ ] **Step 4: Document operational recovery**

`docs/runbook.md` must explain: manually running research, rerunning review, closing a rejected PR, reverting a bad forecast, manually running deploy, rotating `OPENAI_API_KEY`, and disabling the research schedule.

- [ ] **Step 5: Run full acceptance test**

Execute the manual Research workflow. Verify the sequence: data changes -> PR -> Review workflow -> PASS comment -> squash merge -> Deploy workflow -> updated static page.

- [ ] **Step 6: Test rejection**

Create a test PR with fewer than 3 sources. Dispatch review manually. Expected: deterministic validator rejects, PR remains open, deploy is not started.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/deploy.yml docs/runbook.md
git commit -m "ci: deploy validated forecasts to GitHub Pages"
```

---

## Definition of Done

- Static Astro page shows PB95 and DIESEL recommendations from schema-validated repository JSON.
- One scheduled Research Agent run per day can create or update exactly one forecast PR.
- Research PRs are never merged directly by the Research workflow.
- Review uses deterministic checks plus an independent web-search-enabled agent.
- Review rejection leaves the PR open and never deploys.
- Review PASS merges only the exact reviewed SHA.
- Successful merge explicitly triggers GitHub Pages deployment.
- No backend, database, long-running process, PAT, or GitHub App is required for MVP.
- OpenAI API key exists only as a GitHub Actions secret.
- Tests and Astro build pass locally and in Actions.

## Deferred Until After MVP

Regional forecasts, station-level prices, user accounts, notifications, a database, vector search, historical accuracy dashboards, automatic model evaluation, GitHub App authentication, multiple daily runs, and extra deterministic market-data APIs are intentionally excluded until the basic forecast/review loop proves useful.
