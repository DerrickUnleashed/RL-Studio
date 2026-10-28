**Completion:** 13/71 tasks completed (18.3%)

# Backend Implementation TODO - Self-Healing RL Studio

**Branch:** derrick  
**Goal:** Every backend feature 100% implemented and verified against acceptance criteria  
**Status Convention:** `[ ]` Not implemented/unverified | `[x]` Fully implemented and verified | `[!]` Blocked

---

## 1. Backend Foundation, Config & Startup
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B001 | Application entrypoint (FastAPI/ASGI) for serving API | `backend/app/main.py`, `backend/api/app.py` | B002 | App boots, router wiring works, health endpoint exists | Unit + integration | [x] |
| B002 | Central configuration (env, paths, defaults, validation) | `backend/core/config.py` | - | All required env vars defined, validated, secrets not logged | Unit | [x] |
| B003 | Logging/observability setup (structured logging, correlation IDs) | `backend/utils/logging*`, middleware | B001 | Structured logs, correlation IDs propagated across modules | Unit | [ ] |
| B004 | Error handling middleware & typed errors | `backend/core/errors.py`, API middleware | B001 | Stable error shapes, no secret leakage, correct status codes | Unit/integration | [x] |
| B005 | CORS/security headers/middleware as appropriate | `backend/core/middleware.py` (existing CORS) | B001 | Basic security middleware configured safely | Integration | [x] |

## 2. Shared Schemas, Contracts & Events
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B006 | Canonical shared schemas (Pydantic) for projects/experiments/runs/events/requirements/incidents/checkpoints/recovery/eval | `shared/schemas/` | - | All cross-module contracts in shared/, no duplication, versioned | Contract tests | [ ] |
| B007 | Event schema + validation (run/episode/step/collision/checkpoint/metric) | `shared/events/`, `backend/monitoring/*` | B006 | Schema validation enforces required fields, timestamps UTC, ordering | Contract/unit | [ ] |
| B008 | Requirement/incident/recovery/eval contracts | `shared/contracts/` or schemas | B006 | Contracts match AGENTS.md §7, enums/states explicit | Contract tests | [ ] |

## 3. Database, Persistence & Migrations
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B009 | DB session management (engine, SessionLocal, dependency) | `backend/database/session.py`, `backend/database/connection.py` | B002 | Reusable sessions, context managed, testable | Unit | [x] |
| B010 | ORM models for projects/experiments/runs/events/incidents/checkpoints/recovery/evals/artifacts | `backend/database/models*` | B006,B009 | Models match schemas, FKs, indexes where needed | Unit/integration | [ ] |
| B011 | Migrations (Alembic or equivalent) with versioned schema | `backend/database/migrations/` | B010 | Up/down migrations exist, reproducible | Migration tests | [ ] |
| B012 | Repositories/services for persistence (not in route handlers) | `backend/*/repositories*`, `backend/*/services*` | B010 | CRUD + queries by IDs, transactions handled | Unit/integration | [ ] |
| B013 | Artifact registry fully integrated with real metadata/hashes | `backend/database/` (has ArtifactRegistry) | B010,B012 | Registry used by training/provenance, integrity tracked | Integration | [ ] |

## 4. Environments (Warehouse2D)
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B014 | Warehouse2DEnv Gymnasium env with validation | `backend/environments/warehouse_env.py` | B006 | Config validation per AGENTS.md, reachability, bounds, distinct start/goal | Unit (test_env_smoke exists) | [ ] |
| B015 | Environment config models/fingerprints | `backend/environments/config.py`, `fingerprints.py` | B006 | Fingerprints stable, exclude transients, deterministic | Unit | [ ] |
| B016 | Env registration/factory | `backend/environments/__init__.py` or factory | B014 | Clean API to create env by config/id | Unit | [ ] |

## 5. Training, PPO, Lifecycle, Checkpoints
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B017 | PPO trainer wrapper (SB3) with validated config | `backend/training/ppo.py`, `training/ppo.py` | B014,B006 | Validates hyperparams, uses correct policy, seeds set | Unit/smoke (test_ppo_smoke exists) | [ ] |
| B018 | Run lifecycle states/transitions (created→queued→starting→running→stop_requested→stopped, terminal) | `backend/training/*` lifecycle | B006,B012 | Illegal transitions rejected, idempotent stop, terminal immutable | Unit (test_lifecycle exists) | [ ] |
| B019 | Training callbacks emitting canonical events/metrics | `backend/training/callbacks.py` | B007,B018 | Events have IDs, timestamps, run/episode context | Integration (test_events exists) | [ ] |
| B020 | Checkpoint save/load with atomic writes + SHA-256 hash + metadata | `backend/training/*`, `backend/provenance/*` | B018,B013 | Atomic write (temp+rename), hash computed/stored, integrity verified | Unit (test_checkpoints exists) | [ ] |
| B021 | Training worker/scheduler (non-blocking HTTP) | `backend/workers/training_worker.py`, `backend/api/routers/runs.py` | B018,B001 | API schedules work; worker executes; status updates persisted | Integration | [x] |

## 6. Monitoring, Metrics & Events
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B022 | Episode/rollout metrics (raw + rolling aggregates) separated from eval | `backend/monitoring/models/episode.py`, `backend/monitoring/service.py` | B007,B019 | Explicit window/denom/missing-data rules, training vs eval separated | Unit | [x] |
| B023 | Event store/publisher (durable, not only in-memory) | `backend/monitoring/events*` or persistence | B007,B012 | Events persisted, queryable by run/episode/timestep | Integration | [ ] |
| B024 | Real-time updates channel (WS/SSE) with versioned schema + reconnect/resync | `backend/api/*` live channel | B023,B001 | Versioned messages, snapshot on reconnect, no lost critical events | Integration | [ ] |

## 7. Fault Injection
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B025 | Allow-listed faults (reward scaling, obs corruption, invalid termination) with params | `backend/fault_injection/*` (existing) | B014,B006 | Only allow-listed, validated params, trigger boundaries exact | Unit (test_faults exists) | [x] |
| B026 | Fault schedule/applied state isolated per run, no cross-run leakage | `backend/fault_injection/*` (existing) | B025,B018 | Applied only in targeted run/env, state cleaned up | Integration | [x] |

## 8. Verification, Incidents & Deterministic Checks
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B027 | Developer-confirmed requirements model + storage | `backend/verification/models.py`, persistence | B006,B012 | Requirements have source/confirmation/tolerance/scope/version | Unit | [ ] |
| B028 | Deterministic check tools (reward/metric/episode/event/config) | `backend/verification/tools/*` | B027,B023 | Evidence-based comparison, no guessing expected values | Unit (tools exist) | [ ] |
| B029 | Verification engine/agent enforcing "LLM cannot upgrade FAIL" | `backend/verification/agent/*` | B028 | Deterministic authority enforced, aggregation correct | Unit | [ ] |
| B030 | Incident creation/classification/deduplication from violations | `backend/verification/*` incidents | B029,B023 | Incidents reference real event IDs, env version, requirement IDs | Integration | [ ] |
| B031 | Evidence packaging for diagnosis | `backend/verification/*` evidence | B030,B023 | Frozen evidence with stable IDs/timestamps/context | Unit/integration | [ ] |

## 9. Diagnosis / Meta AI (Advisory)
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B032 | Replaceable Meta AI provider interface | `backend/diagnosis/*`, `backend/verification/llm/*` | B031,B006 | Interface abstract, swappable impls, no hardcoded provider lock-in | Unit | [ ] |
| B033 | Prompting restricted to evidence, no secrets | `backend/verification/llm/prompts.py` | B032,B031 | Prompts use only evidence package, strip sensitive data | Unit | [ ] |
| B034 | Structured output validation + guardrails | `backend/verification/llm/response_parser.py`, `llm_guardrails.py` | B032 | Schema-validated JSON, timeouts/retries/backoff/jitter, refusal handling | Unit | [ ] |
| B035 | Confidence labeling & hypothesis/fact separation | `backend/verification/llm/*` | B034 | No uncalibrated confidence unless provided+labelled; facts vs hypotheses distinguished | Unit | [ ] |
| B036 | UI/provider-unavailable path handled explicitly | API + service | B032 | Clear "provider unavailable/unconfigured" response, no fabricated diagnosis | Integration | [ ] |

## 10. Provenance, Artifacts, Lineage
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B037 | Artifact lineage tracking (runs/events/checkpoints/env versions) | `backend/provenance/*`, `backend/database/` | B013,B023,B020 | Full associations stored, queryable lineage graph | Integration | [ ] |
| B038 | Artifact exposure analysis (exposed/potentially affected/unknown) | `backend/provenance/*` | B037,B030 | Based on records; unknown if lineage incomplete (not assumed unaffected) | Unit/integration | [ ] |
| B039 | Provenance API/router integrated | `backend/api/routers/provenance.py` exists | B037,B038,B001 | Endpoints return real lineage/exposure data | Integration | [ ] |

## 11. Recovery (Validated, Safe)
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B040 | Recovery plan model + compatibility checks (env/config/alg/metadata/hash) | `backend/recovery/*`, `backend/provenance/*` | B020,B037,B006 | All checks required; unknown lineage blocks or marked unknown with reason | Unit | [ ] |
| B041 | Checkpoint restore with integrity validation before execution | `backend/recovery/*` | B040,B020 | Verify hash/existence/compat before restore; fail closed on mismatch | Integration | [ ] |
| B042 | PPO-specific recovery: discard incompatible on-policy experience, collect fresh experience | `backend/recovery/*`, `backend/training/*` | B041,B017 | Fresh experience collected after correction as appropriate | Integration | [ ] |
| B043 | Recovery execution recording (plan vs executed, logs, failures) | `backend/recovery/models.py`, persistence | B041,B012 | Full audit trail, both plan and outcome recorded | Integration | [ ] |
| B044 | Recovery API/router integrated | `backend/api/routers/recovery.py` exists | B040-B043,B001 | Endpoints validate before execution, return blocked/failed reasons explicitly | Integration | [ ] |

## 12. Evaluation (Post-Recovery)
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B045 | Evaluation framework against baselines in healthy env | `backend/evaluation/*` | B042,B014,B022 | Compares original/faulty/recovered; training/eval metrics separated | Unit/integration | [ ] |
| B046 | Evaluation config (seeds, episode count, metrics) with reporting | `backend/evaluation/*` | B045,B006 | Mean/variability, denominators explicit, uncertainty when computed | Integration | [ ] |
| B047 | Evaluation results persistence + "success only if meets acceptance" rule | `backend/evaluation/*`, persistence | B046,B012 | Inconclusive if mixed/weak; never auto-success without criteria met | Integration | [ ] |
| B048 | Evaluation API/router integrated | `backend/api/routers/evaluation.py` exists | B045-B047,B001 | Returns real metrics, baselines, status | Integration | [ ] |

## 13. API Layer, Orchestration & Integration
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B049 | API app composition (include all routers, deps, middleware) | `backend/api/__init__.py` + app/main | B001-B048 | All routers mounted, dependencies wired, OpenAPI works | Integration | [ ] |
| B050 | Projects/experiments/runs CRUD APIs | `backend/api/routers/runs.py` | B012,B018,B001 | Orchestrate services, validate, enforce state transitions | Integration | [x] |
| B051 | Start/stop training APIs (idempotent, non-blocking) | `backend/api/routers/runs.py` | B021,B018,B050 | Schedule via worker, return run status, safe retries | Integration | [x] |
| B052 | Intent/requirements + verification/incidents APIs | Extend `backend/api/__init__.py` or new routers | B027-B031,B001 | Real evidence flow, incidents reference real IDs | Integration | [ ] |
| B053 | Diagnosis APIs (evidence package + structured result) | `backend/api/routers/diagnosis.py`, `backend/diagnosis/api.py` | B032-B036,B052 | Returns real diagnosis or explicit unavailable | Integration | [x] |
| B054 | Full vertical slice API wiring (config→run→fault→detect→diagnose→recover→evaluate) | All APIs | B049-B053 | End-to-end callable via API with real data flow | E2E | [ ] |

## 14. Security, Validation, Reliability
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B055 | Input validation at boundaries (Pydantic), request size limits | API + services | B006,B001 | All external inputs validated, bounds enforced | Unit/integration | [ ] |
| B056 | Path traversal protection, safe file paths | All file ops | B020,B041 | Paths validated/resolved safely | Unit | [ ] |
| B057 | Secrets management (.env.example present, no secrets committed) | Config | B002 | .env.example exists with placeholders, .gitignore correct | Audit | [ ] |
| B058 | Timeouts/retries/backoff for external calls (Meta AI) | Diagnosis/LLM | B034 | Bounded retries with jitter, no infinite retry | Unit | [ ] |
| B059 | No arbitrary code execution/shell/unsafe pickle | Review all modules | - | No eval/exec/subprocess with untrusted input; pickle only if safe/justified | Audit | [ ] |
| B060 | Correlation IDs across logs/events | Middleware + logging | B003,B007 | Traceable across run/incident/recovery/eval | Integration | [ ] |

## 15. Tests, Quality, Docs
| ID | Task | Modules/Files | Dependencies | Acceptance Criteria | Tests Required | Status |
|---|------|---------------|--------------|---------------------|----------------|--------|
| B061 | Unit tests for all critical logic (env, training, verification, recovery) | `backend/tests/` + module tests | All impl | Coverage of success+failure/edge cases | Run all unit | [ ] |
| B062 | Integration tests (event flow, persistence, API) | `tests/integration/` or backend tests | B049,B012,B023 | Cross-module flows tested | Run integration | [ ] |
| B063 | Fault injection tests for each fault type | `backend/tests/test_faults.py` + more | B025,B026 | Each fault tested with real behavior | Run | [ ] |
| B064 | Negative tests (bad payloads, missing evidence, incompatible ckpt, bad recovery) | Tests | B055,B040,B041 | Proper errors, fail closed | Run | [ ] |
| B065 | Canonical E2E: warehouse reward-scaling scenario end-to-end | `tests/end_to_end/` or new test | B054 | Full demo flow works with real data, no hardcoded outcomes | Run E2E | [ ] |
| B066 | Lint/typecheck (ruff/mypy) clean or issues documented | Config exists | - | Run and fix or report | Static checks | [ ] |
| B067 | API docs/OpenAPI accurate | FastAPI app | B049 | Endpoints documented with schemas | Manual/auto | [ ] |
| B068 | README/env examples updated if needed | README, .env.example | - | Accurate setup instructions | Review | [ ] |

---

## Audit Notes
- Current branch: derrick (switched from main per git rules)
- Existing: env/training/monitoring/fault_injection/verification/diagnosis/provenance/recovery/evaluation partially present; DB has ArtifactRegistry; API has verification + 3 routers (evaluation/provenance/recovery); tests present in backend/tests/
- Missing likely: FastAPI app entrypoint/main, full DB models/migrations/session, API app composition mounting all routers, worker/scheduler, durable event store integration, full recovery/eval wiring, projects/runs CRUD, diagnosis API wiring, E2E tests
