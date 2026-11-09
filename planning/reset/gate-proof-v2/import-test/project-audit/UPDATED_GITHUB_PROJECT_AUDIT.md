# Updated GitHub project audit

Audited on 2026-11-09, through the GitHub API with the owner's own `gh` login. For each repository I checked: the README; the file tree; contributors; the last 100 commits, with lines added per author; the test files; the deploy configuration; and whether any live URL answers. I read code where a claim needed checking. I ran no code and retrained no model.

**Sources:** github.com/Gokul-bit165 (82 repositories, including forks and private repositories), the upstream originals of the forks, `Gokul_V_ATS_Resume_Final.pdf` (2026-09-15, Downloads), and idrt.tamu.edu.

**How to read "share of added lines":** it counts lines added in commits made from each account, summed over the last 100 commits. It is evidence of who committed, not proof of who wrote. Bulk uploads, generated files and pair work all distort it. Where it matters, the owner should confirm their role.

## Status labels used

| Label | Meaning |
|---|---|
| **Production system** | Deployed, used by real people, maintained over time |
| **Working product** | Runs end to end on real inputs; not shown to be in sustained use |
| **Research prototype** | Built to test a method; evaluated on data; not a product |
| **Interface prototype** | The workflow and screens exist; the data behind them is simulated |
| **Team collaboration** | Several people committed; the owner's share is stated |

## The six candidates in the brief

| # | Candidate | Repository facts | Owner's share | Status | Verdict |
|---|---|---|---|---|---|
| 01 | **Loom AI** | Own repository, created 2026-08-26. 353 files, 32 commits. The README documents a 91-test backend suite (29 test files present; not run here). FastAPI, PostgreSQL with Alembic migrations, Next.js, pandas, and Claude at zero temperature. The live URL `loom-ai-dun.vercel.app` returns **404**. | 24 of 32 commits, 74% of added lines. Teammates: arjunhareeshs (22%), KishoreR2k7, aswath06. | Working product (team) | **Keep.** The strongest grounded-AI design: the LLM explains and never computes the metrics. |
| 02 | **TerraTrace ORBIT** | Own repository, created 2026-09-21. 19 files: vanilla JavaScript ES modules and CSS, plus a pitch deck. Every file of data says "**All data below is simulated for prototype demonstration purposes only.**" No model, no embeddings and no imagery processing are in the code. Built for Smart India Hackathon problem SIH26227 (MoD / DGIS). | 2 of 2 commits, 100% | **Interface prototype** | **Keep only as an interface prototype**, labelled that way. It must not be presented as working satellite AI. |
| 03 | **NENAI** | Own repository, created 2026-08-04. 234 files, 20 test files. Flutter with Riverpod, Drift and sqlite-vec, `flutter_gemma` running Gemma 3 1B (`.litertlm`, int4), and ONNX all-MiniLM-L6-v2 embeddings. No INTERNET permission. The code is substantial and real. | 1 of 9 commits, 17% of added lines (the initial commit). The other 8 commits and 83% of the lines are KishoreR2k7's. | Working product (team) | **Keep only if the owner confirms their role.** The history shows a teammate built most of what is in the repository. |
| 04 | **Full-Stack Assessment Platform** | Live at `fullstackpcdp.bitsathy.ac.in`, which answers 200 with the title "FullStack Test Portal". The repository lineage is `Frontend-Test-Portal`, then `frontend-test-portal-deployment`, then `Assessment` (2026-02). Express, MySQL, JWT and Google sign-in, helmet, rate limiting. Hybrid grading: Puppeteer renders the submission, Pixelmatch compares it against the reference image, JSDOM checks its structure, and Levenshtein matching tolerates typos. Student, faculty and admin roles. Attendance and violation tracking. Docker Compose and Docker Hub images. | `Assessment`: 68 of 80 commits, about 100% of added lines. Teammates MithileshSP and mspk5196 made smaller commits. | **Production system** (live) | **Keep.** It is **not LearnQuest**: a different stack, different repositories and a different purpose (see below). The "8+ months" and "1,000+ submissions" are the owner's own statements and cannot be seen in the repository. |
| 05 | **Texas disaster work** | Two different things, which must not be merged. (a) `Drone_Drainage_Infrastructure`: a **private fork** of `Ameen-Ahmed28/Drone_Drainage_Infrastructure`. Upstream and fork alike have exactly 2 commits, **both by harrish1709**, and **none by the owner**. (b) `tdis-ML`: the owner's own repository, 620 files. It is the **wildfire ignition system**: an XGBoost model ("BIT V2"), a FastAPI ignition API, a scoring job, PostgreSQL tables, Azure deploy scripts, and a `WildfireIgnitionTab` in the TDIS portal frontend. Its deploy script allows the origin `wonderful-moss-0963acc10.2.azurestaticapps.net`, which is the Azure app in the brief, and that app answers 200. | `tdis-ML`: 7 of 11 commits, 94% of added lines. Teammate: arjunhareeshs (6%). The repository's own docs say the authorship of the portal side "is not recorded in git". | (b) Working product, deployed; (a) team research, **not the owner's commits** | **Keep (b), as "Texas Wildfire Ignition Model".** Mention (a) only as related team work, without claiming it. |
| 06 | **MuleNet** | A **fork** of `Jhananishri-B/MuleNet`: 1 commit, by Jhananishri-B. It contains only data-generation scripts and parquet files. The data is **randomly generated** (`random.seed(42)`, 10,000 accounts, 900 mules sampled at random). It contains **no GNN, no PyTorch Geometric, no training and no evaluation code**. | 0 commits | Cannot be verified | **Do not feature.** The resume's 96.4% accuracy, 81.1% recall and 79.5% F1 have no artefact behind them in this repository. |

### What is verifiably true of the Texas wildfire model

From `TDIS_Ignition_BIT_V2/results/training_results_bit_v2_36feat.json` and the training report dated 2026-10-05:

- **Model:** XGBoost with 36 features, then isotonic calibration.
- **Features:** 12 static (terrain, fuels, distance to roads and powerlines), 6 calendar, and the rest from HRRR weather.
- **Data:** 2,201,289 rows, split by time: train 2018-07 to 2020-12, validate 2021, test 2022 to 2026-07.
- **Test results:** AUROC **0.803**, AUC-PR **0.716**, F1 **0.622** (precision 0.610, recall 0.633), against a base rate of **0.306**, a lift of 2.35.
- **Report's own caveat:** removing latitude and longitude "cost a small amount of accuracy" (AUROC 0.806 to 0.803) and "only partially fixed the overfitting gap".
- **Retraining:** the training data is gitignored, so the model cannot be retrained from the repository alone.
- **Synthetic data:** the damage-assessment loader in the same repository runs on **synthetic** inputs (`synthetic_houston.parquet`, `synth_damage.py`).

### TDIS and IDRT

idrt.tamu.edu states: "The cornerstone project for the Institute is the Texas Disaster Information System (TDIS)". IDRT is the Institute for a Disaster Resilient Texas, at Texas A&M University. The same page also says the project "is currently in the planning phase".

The `tdis-ML` repository contains a TDIS portal frontend, which logs in through Keycloak and calls a data API that is "not in this repo". The portal is therefore an existing TDIS system, and the ignition ML plugs into it. **Nothing found shows a formal affiliation or endorsement**, and neither the repository nor the brief gives evidence of one. The portfolio must not imply either, and must not use IDRT's or Texas A&M's names in logos or marks.

### Full-Stack Assessment Platform and LearnQuest are different systems

| | Assessment Platform (production) | LearnQuest |
|---|---|---|
| Repositories | `Frontend-Test-Portal`, `frontend-test-portal-deployment`, `Assessment` | `LearnQuest-Team4` (own; 63 of 69 commits), and `LearnQuest` (a fork of `Jhananishri-B/AI_FOR_BHARATH`) |
| Stack | Node/Express, MySQL, React/Vite, Puppeteer, JSDOM, Pixelmatch | React, FastAPI, MongoDB, ChromaDB, Judge0, YOLO, MediaPipe, Llama 3 (resume and README) |
| Purpose | Frontend (HTML/CSS/JS) assessments with automatic visual and structural grading, faculty evaluation and attendance | AI tutoring, adaptive practice, certification and proctoring |
| Live | `fullstackpcdp.bitsathy.ac.in` (200) | `learn-quest-team4-web-frontend.vercel.app` (**404**) |

## Other repositories inspected

| Repository | Facts | Owner's share | Use |
|---|---|---|---|
| **HAC-FEW** (owned by `Varun072006`; the owner has a fork) | Hierarchical multi-agent framework: a Supervisor agent coordinates HR, Finance and IT agents. LangGraph; an authenticated FastAPI platform API; a React and TypeScript console; approvals; a hash-chained audit trail; a policy engine; 12 test files. The README itself warns that some comparison figures "are written into the code, not produced by running a competing system". | Upstream: 4 of 17 commits but **97% of added lines** (the platform, the console and the core automation) | **Recommended replacement for MuleNet** (agentic AI). Show none of the badge figures. |
| **NPC-TraceGaurd** | Correlates phishing-email evidence with login evidence into one graded, explainable incident. Written for "TCS PS 1.3". FastAPI, React and n8n. Evaluated on real RBA login data; its text model is trained on **synthetic** template text. 50 test files. | 9 of 14 commits, 95% of lines | Strong secondary choice. The name suggests Team NPC's TCS entry, but that is **unconfirmed**. |
| **LearnQuest-Team4** | Full AI learning and proctoring platform (see above) | 63 of 69 commits | Secondary or archive |
| **SmartStudy RAG** (`SmartStudy-RAG-…`, `smartstudy-backend/-frontend`) | Local RAG tutor: FastAPI, React, ChromaDB, MiniLM, Ollama | 6 of 6 commits | Archive |
| **inaippuai** (private) | Flutter contact-intelligence app; README 13.9 KB | 71 of 88 commits | Secondary (as the brief asks). It is private, so there is no public link. |
| **CAD_detection_3d_heart** | Live at `cad-detection-3d-heart.vercel.app` | 18 of 19 commits | Archive (removed from the featured lineup by the brief) |
| **Textile-Ashok** | A fork of `prapanchan07-droid/Textile-`; 0 commits by the owner | 0 | Do not use |
| **buy-or-wait-agent** | HackerRank Orchestrate agent | 7 of 40 commits (shlokashah 31) | Do not feature |
| **AIRA**, **RESCUE_BOT** | 2 to 3 commits each; small | 100% | Archive (outdated, as the brief says) |

## Differences between the resume and the portfolio's current facts

| Topic | Resume (2026-09-15) | `context/MY_PROFILE.md` |
|---|---|---|
| Hackathons | Winner, MobilityX 2.0; 2nd runner-up, HackXelerate'26; Winner, SheHacks'25 | Winner, TCS Technology Day 2026 AI Hackathon (Team NPC); finalist, HackXelerate '25 |
| Degree | B.Tech, Artificial Intelligence and Data Science, CGPA 7.77 | "Exact degree title" marked as needing confirmation |

These two sources do not match. The Recognition chapter was not changed in this pass; the owner should say which facts are current.
