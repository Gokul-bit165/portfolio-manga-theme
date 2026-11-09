# Project evidence register

Every fact the portfolio states about a project, with where it was verified. Claims with no verifiable source are listed separately, and are **not shown** to visitors.

## Loom AI
| Claim | Source | Verified |
|---|---|---|
| Ingests factory reports through parsers into validated, immutable domain records | README §1; `app/ingestion/`, `app/models/` in the tree | Yes |
| Domain validators for production, breakdown, revenue and machines | README §1 (`app/validation/`) | Yes |
| PostgreSQL with check constraints, and Alembic migrations 0001 and 0002 | README §2–3; `test_db_constraints.py` | Yes |
| Deterministic pandas analytics answer three management questions: production against target, breakdown Pareto, revenue by style | README (Q1, Q5, Q21) | Yes |
| The LLM (Claude, temperature 0) only explains and recommends; it never computes metrics; every number traces to source logs | README "Key Axiom" | Stated by the README; not tested here |
| A 91-test backend suite | README Step 4; 29 test files | The test files exist; **not run** |
| A live demo | `loom-ai-dun.vercel.app` | **Returns 404**, so it is not shown |

## TerraTrace ORBIT
| Claim | Source | Verified |
|---|---|---|
| Interface prototype for SIH26227, "Semantic Retrieval and Multi-Temporal Change Analysis of Satellite Imagery", MoD / DGIS | README | Yes |
| Workflow from question to discovery, change trajectory, evidence, review and decision; swipe, opacity and side-by-side comparison; analyst decisions are logged | README; `js/change-studio.js`, `discovery.js` | Yes, as interface |
| Retrieval, change detection and false-alarm suppression | — | **No.** The data is simulated (`demo-data.js`, `change-data.js`, `discovery-data.js`). Shown as **design intent only**. |
| Air-gapped deployment | README | A design goal, **not demonstrated** |

## NENAI
| Claim | Source | Verified |
|---|---|---|
| Flutter app, clean architecture with MVVM, Riverpod | README; `lib/` tree | Yes |
| On-device Gemma 3 1B, int4, through `flutter_gemma` | README; `lib/ai/litert/flutter_gemma_intelligence_engine.dart` | Yes |
| ONNX all-MiniLM-L6-v2 embeddings, 384 dimensions | README; `lib/ai/onnx/onnx_embedding_engine.dart`; the model is committed in `assets/models/` | Yes |
| Local SQLite (Drift) with sqlite-vec vector search | README; `lib/data/local/vector/vector_store.dart` | Yes |
| No network: the INTERNET permission is omitted | README | Stated; the manifest is not inspected |
| Background processing through WorkManager and isolates | `lib/background/` | Yes |
| Memory agents: query understanding, context resolution, recall, a memory graph | `lib/ai/agents/`, `lib/ai/memory/` | Yes, the files exist |
| Benchmarks of 40–80 ms per embedding and 1.5–3.5 s per summary | README | **Not shown**: the device and method are not given |

## Full-Stack Assessment Platform
| Claim | Source | Verified |
|---|---|---|
| Live institutional deployment | `fullstackpcdp.bitsathy.ac.in` answers 200, titled "FullStack Test Portal" | Yes |
| In operation for 8+ months, with 1,000+ submissions | Resume | **The owner's statement**, shown attributed to the owner |
| Hybrid grading: Puppeteer render, Pixelmatch visual diff, JSDOM structure, Levenshtein fuzzy text | `README_EVALUATION.md`; `backend/package.json` | Yes |
| Student, faculty and admin roles; faculty rubric evaluation; attendance and violation tracking | `README_PAGES_AND_FLOW.md`; commit messages | Yes |
| JWT, Google sign-in, helmet, rate limiting, bcrypt | `backend/package.json` | Yes, as dependencies |
| Docker Compose, Docker Hub images, MySQL | `DEPLOYMENT.md` | Yes |

## Texas Wildfire Ignition Model
| Claim | Source | Verified |
|---|---|---|
| XGBoost with 36 features and isotonic calibration | Training report; results JSON | Yes |
| 2,201,289 rows; temporal split 2018–20, 2021, 2022–26 | Results JSON | Yes |
| Test AUROC 0.803, AUC-PR 0.716, F1 0.622, against a base rate of 0.306 | Results JSON (`metrics_raw.test`) | Yes |
| FastAPI ignition API; scoring job every 5 minutes; PostgreSQL hex cells | `tdis-ignition-api/`; docs | Yes, as structure |
| Deployed on Azure; the app serves the wildfire-ignition tab | Deploy scripts list the origin; the app answers 200 | Yes |
| Damage-assessment pipeline | `tdis-damage-*` | Exists, on **synthetic** data |
| Drone drainage segmentation (SAM, Mask2Former, SegFormer, U-Net) | A fork with commits by harrish1709 only | **Not the owner's.** Not claimed. |

## HAC-FEW
| Claim | Source | Verified |
|---|---|---|
| A Supervisor agent plans and decomposes work, coordinating HR, Finance and IT agents | README | Yes, the README and tree agree |
| LangGraph orchestration; FastAPI platform API; React and TypeScript console | README; tree | Yes |
| Approvals, a hash-chained audit trail, a policy engine | README; `docs/API_CONTRACTS.md` | Stated; not run |
| 12 backend test files | Tree | Yes, as files |
| The "100% benchmark" and "20/20" badges | README | **Not shown**: the README warns that some figures are written into the code |

## Not shown anywhere
- The MuleNet metrics: 96.4% accuracy, 81.1% recall, 79.5% F1.
- Loom AI's live link (404). LearnQuest's live link (404).
- Any IDRT or Texas A&M logo, and any claim of affiliation.
