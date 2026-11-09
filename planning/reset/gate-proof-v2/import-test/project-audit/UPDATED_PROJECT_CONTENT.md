# Updated project content

Generated from `src/chronicle/projects.js` by `project-audit/make_content_md.mjs`. This is exactly what the folios show.

- **Visitors see** every field below except two.
- **"My contribution (draft)" and "For the owner"** are owner-only: they appear only with `&review=1`, until the owner writes their role.
- **Evidence:** every statement is backed in `PROJECT_EVIDENCE_REGISTER.md`.


## I. Loom AI

*Working product, team project.* Textile manufacturing intelligence: every number traced to the factory's own logs.

**Overview:** A decision-support and reporting system for plant managers and production superintendents in large-scale textile manufacturing.

**Problem:** Managers need answers from daily factory reports that they can trust. An assistant that invents or miscalculates a figure is worse than none.

**Architecture:**
- Factory reports (CSV) parsed into validated, immutable domain records
- Domain validators for production, breakdowns, revenue and machines
- PostgreSQL with database check constraints and Alembic migrations
- A deterministic pandas analytics engine behind FastAPI
- A Next.js management frontend with an evidence drawer

**AI and ML methods:**
- The language model (Claude, temperature 0) explains results and suggests conservative actions; it never computes a metric
- Intent classification routes a question to one of the defined analyses: production against target, breakdown Pareto, revenue by style

**Implementation:** FastAPI, PostgreSQL, Alembic, pandas and Pydantic on the backend; Next.js on the frontend.

**Engineering decisions:**
- Numbers come only from deterministic code, so every figure traces to a source row
- Data is validated before it is stored, and again by the database's own constraints

**Evaluation and evidence:**
- The repository documents a 91-test backend suite (29 test files)

**My contribution (draft, owner only):** Draft from git: 74% of committed lines (24 of 32 commits), with three teammates. Built most of the backend and frontend.

**Limitations:**
- Version 1 answers three defined management questions
- No public demo is online at the moment

**Links:** [GitHub](https://github.com/Gokul-bit165/Loom-AI)

**For the owner:** Confirm your role in your own words. The Vercel demo returns 404: redeploy it or leave it out.


## II. TerraTrace ORBIT

*Interface prototype, data simulated.* An evidence-first workstation design for satellite change analysis.

**Overview:** An interface prototype for Smart India Hackathon problem SIH26227 (Ministry of Defence, DGIS): semantic retrieval and multi-temporal change analysis of satellite imagery.

**Problem:** Analysts searching satellite archives usually have to know where and when to look. The problem asks for search by meaning, and for change analysis across time.

**Architecture:**
- A browser workstation in plain ES modules: mission presets, discovery and a change studio
- A workflow from question to discovery, change trajectory, evidence, review and decision
- Before-and-after comparison by swipe, opacity or side by side

**AI and ML methods:**
- Designed for semantic and image-similarity retrieval, change classification and false-alarm suppression. In this prototype these are represented by simulated data; no model runs.

**Implementation:** Vanilla JavaScript ES modules and CSS, served as static files.

**Engineering decisions:**
- The analyst confirms, marks uncertain or rejects each change, and the decision is logged with its evidence: the system builds the evidence chain instead of answering for the analyst

**Evaluation and evidence:**
- The working interface and its pitch deck. All imagery and results in it are simulated, and are marked so.

**My contribution (draft, owner only):** Draft from git: 100% of commits. Designed and built the interface prototype.

**Limitations:**
- No retrieval or change-detection model is implemented
- Air-gapped deployment is a design goal, not demonstrated

**Links:** [GitHub](https://github.com/Gokul-bit165/TerraTrace)

**For the owner:** Confirm the team, and the hackathon outcome if there was one.


## III. NENAI

*Working product, team project.* A personal memory that stays on the phone: an offline language model and local vector search.

**Overview:** A privacy-first, fully offline Flutter app that turns notes into a personal memory you can ask questions of.

**Problem:** Notes are easy to write and hard to find again by meaning, and sending them to a cloud model gives up privacy.

**Architecture:**
- A Flutter app in clean architecture, with MVVM and Riverpod
- Local SQLite (Drift) with the sqlite-vec extension for vector search
- Background note processing through WorkManager and isolates
- Memory agents: query understanding, context resolution, recall, and a memory graph

**AI and ML methods:**
- Gemma 3 1B (int4) runs on the device for summaries and keywords
- all-MiniLM-L6-v2 embeddings (384 dimensions) through ONNX Runtime
- Hybrid and temporal retrieval over the note store

**Implementation:** Flutter and Dart; flutter_gemma for the language model, flutter_onnxruntime for embeddings, Drift and sqlite-vec for storage.

**Engineering decisions:**
- The app does not request internet permission: notes, embeddings and summaries never leave the device
- Model engines sit behind interfaces, so another on-device model can replace them without touching the app's logic
- Without the language model, note-taking and keyword search still work

**Evaluation and evidence:**
- 20 test files, covering the memory engine, retrieval and the agents

**My contribution (draft, owner only):** Draft from git: the initial commit, 17% of committed lines; a teammate made the other eight commits. Started the project.

**Limitations:**
- The 1B model (about 529 MB) is not bundled and must be placed on the device
- No published benchmarks

**Links:** [GitHub](https://github.com/Gokul-bit165/nenAI)

**For the owner:** Git shows a teammate committed most of the code. Describe your role, or consider moving NENAI to the secondary shelf.


## IV. Full-Stack Assessment Platform

*Production system, live.* A live institutional platform that grades web assessments by how they render and how they are built.

**Overview:** A deployed online assessment platform at Bannari Amman Institute of Technology for frontend (HTML, CSS and JavaScript) assessments, with automatic grading, faculty review and attendance.

**Problem:** Grading many students' web submissions by hand is slow and inconsistent, and exact-match checks fail on harmless differences.

**Architecture:**
- A React and Vite frontend with student, faculty and admin portals
- A Node and Express API over MySQL
- A hybrid evaluation engine: a visual pipeline and a structural pipeline, normalised into one score
- Docker Compose deployment, with published images

**AI and ML methods:**
- Visual: Puppeteer renders the submission in headless Chrome and Pixelmatch compares it with the reference image, ignoring anti-aliasing
- Structural: JSDOM builds the document tree for checks of elements, attributes and accessibility
- Levenshtein distance accepts text with minor typos

**Implementation:** Express, MySQL, JWT and Google sign-in, helmet, rate limiting, Puppeteer, JSDOM and Pixelmatch; React and Vite; Docker.

**Engineering decisions:**
- Two independent pipelines, so a page that looks right but is built wrong, or the reverse, is scored fairly
- Faculty can grade with a rubric on top of the automatic score
- Attendance and violation tracking for supervised sessions

**Evaluation and evidence:**
- Live at fullstackpcdp.bitsathy.ac.in
- In use for more than 8 months, with over 1,000 assessment submissions (Gokul's own figures)

**My contribution (draft, owner only):** Draft from git: about 100% of committed lines in Assessment. Built, deployed and maintains the platform.

**Limitations:**
- The usage figures are the owner's own, not public data

**Links:** [GitHub](https://github.com/Gokul-bit165/Assessment), [Live system](http://fullstackpcdp.bitsathy.ac.in/)

**For the owner:** Confirm the repository may be linked publicly, and that the usage figures are current.


## V. Texas Wildfire Ignition Model

*Working product, deployed, team project.* Daily wildfire ignition likelihood across Texas, from terrain, fuels and weather.

**Overview:** A machine-learning model that scores wildfire ignition likelihood across Texas, served through an API to the wildfire tab of a disaster-information portal (TDIS).

**Problem:** Responders need to know where ignition is likely before fires start, across a state of very varied terrain and fuels.

**Architecture:**
- A dataset builder joining static layers (terrain, fuels, distance to roads and powerlines), calendar features and HRRR weather
- An XGBoost model with isotonic calibration
- A FastAPI ignition API and a scoring job that runs every five minutes, writing to PostgreSQL hex cells
- The portal's wildfire ignition tab, deployed on Azure

**AI and ML methods:**
- Gradient-boosted trees (XGBoost) on 36 features
- A three-stage hyperparameter search with regularisation (34 trials)
- Isotonic calibration on the validation year
- A time-based split: train 2018 to 2020, validate 2021, test 2022 to 2026

**Implementation:** Python (pandas, XGBoost, scikit-learn), FastAPI, PostgreSQL and Docker; Azure Container Apps and Static Web Apps.

**Engineering decisions:**
- Split by time, not at random, so the test years are truly unseen
- Latitude and longitude were removed in version 2, to check that the model was not memorising places
- Calibrated probabilities, so a score reads as a likelihood

**Evaluation and evidence:**
- 2,201,289 rows
- Test years 2022 to 2026: AUROC 0.803, AUC-PR 0.716, F1 0.622, against a 30.6% base rate
- Deployed in the wildfire-ignition tab

**My contribution (draft, owner only):** Draft from git: 94% of committed lines, with one teammate. The repository and the ignition system; the portal side's authorship is not recorded.

**Limitations:**
- Removing location features only partly closed the gap between training and test scores (the training report's own finding)
- The training data is not in the repository, so the model cannot be retrained from it alone
- The damage-assessment add-on in the same repository runs on synthetic data

**Links:** [GitHub](https://github.com/Gokul-bit165/tdis-ML), [Live system](https://wonderful-moss-0963acc10.2.azurestaticapps.net/?tab=wildfire-ignition)

**For the owner:** Say exactly what you built (model, API, integration) and in what context. TDIS is IDRT's project (Texas A&M): say whether and how you may name it. No logo is used. The drone drainage repository is a teammate's fork with none of your commits, so it is not claimed.


## VI. HAC-FEW

*Team project.* A governed team of AI agents: a supervisor plans, specialists act, people approve.

**Overview:** A hierarchical agent coordination framework for complex enterprise workflows: a supervisor agent plans and coordinates HR, finance and IT agents.

**Problem:** Enterprise workflows cross departments and need approvals, and autonomous agents must be governed, observable and stoppable.

**Architecture:**
- A supervisor agent that decomposes a request and schedules independent tasks in parallel
- Domain agents for HR, finance and IT
- An authenticated FastAPI platform API that persists workflows, runs, events and approvals
- A React and TypeScript console

**AI and ML methods:**
- LangGraph orchestration
- A policy engine that checks each action before it runs
- Input sanitisation against prompt injection
- A knowledge graph for retrieval (GraphRAG)

**Implementation:** Python, FastAPI and LangGraph; React and TypeScript.

**Engineering decisions:**
- Protected operations wait for a person's approval, by role
- A hash-chained audit trail of every run

**Evaluation and evidence:**
- 12 backend test files (approvals, authorisation, restart recovery)

**My contribution (draft, owner only):** Draft from git: 4 of 17 commits, but 97% of committed lines in the upstream repository. The platform API, the console and the core automation.

**Limitations:**
- A course mini-project. Some comparison figures in its README are written into the code rather than measured, so none are shown here.

**Links:** [GitHub](https://github.com/Varun072006/HAC-FEW)

**For the owner:** This replaces MuleNet, whose repository has no model or evaluation (see the audit). Confirm, or send MuleNet's real training and evaluation.
