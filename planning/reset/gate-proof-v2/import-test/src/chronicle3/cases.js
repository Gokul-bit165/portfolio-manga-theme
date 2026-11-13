// Chronicle V3 case studies: structured data, one entry per standard. The renderer (case.js) chooses the modules; nothing here is markup.
// Every statement is backed in project-audit/PROJECT_EVIDENCE_REGISTER.md; every image is listed in assets/chronicle3/evidence/SOURCE.json.
// `owner: true` marks what only the owner sees (?review=1): missing evidence, unconfirmed figures, questions.
//
// A case is a short book of leaves. Each leaf has one stage (the large visual side) and a few text blocks.
// Stage kinds: cover | flow | gallery | figures | records | stack.   Flow shapes: thread | fork | chain | radial.

const EV = "./assets/chronicle3/evidence";
const img = (pid, file, caption, source) => ({ src: `${EV}/${pid}/${file}.webp`, thumb: `${EV}/${pid}/${file}.t.webp`, caption, source });

export const CASES = {
  loom: {
    theme: "weave", motif: "Industrial intelligence, woven from the factory's own records",
    cover: img("loom", "01_executive_overview", "The executive overview of the running dashboard", "Loom-AI repository, docs/presentation_slides/screenshots"),
    leaves: [
      { id: "overview", label: "Overview", glyph: "eye", stage: { kind: "cover" },
        blocks: [{ k: "lede", from: "overview" }, { k: "pair", a: ["The problem", "problem"], b: ["The answer", "Numbers come only from deterministic code. The language model explains them; it never computes one."] },
          { k: "facts", items: [["3", "management questions answered in version 1"], ["29", "backend test files in the repository"], ["0", "figures computed by the language model"]] }] },
      { id: "how", label: "How it works", glyph: "gear", stage: { kind: "flow", shape: "thread", title: "One report, from the mill floor to an answer", token: "A daily report",
          nodes: [
            ["Parse", "Factory reports (CSV) are parsed into immutable domain records.", "app/ingestion"],
            ["Validate", "Domain validators check production, breakdowns, revenue and machines before anything is stored.", "app/validation"],
            ["Store", "PostgreSQL holds the records; its own check constraints refuse bad rows a second time. Alembic migrations 0001 and 0002.", "PostgreSQL, Alembic"],
            ["Analyse", "A deterministic pandas engine answers the defined questions: production against target, breakdown Pareto, revenue by style.", "pandas, FastAPI"],
            ["Explain", "Claude, at temperature 0, explains the result and suggests conservative actions. It receives numbers; it does not make them.", "LLM, grounded"]] },
        blocks: [{ k: "text", h: "Why it is built this way", body: "A manager acts on these figures. An assistant that invents or miscalculates one is worse than none, so every number on screen traces back to a source row." },
          { k: "list", h: "Engineering decisions", from: "decisions" }] },
      { id: "evidence", label: "Screens", glyph: "frame", stage: { kind: "gallery", pid: "loom" },
        blocks: [{ k: "text", h: "The running dashboard", body: "Ten screens of the management frontend, committed by the team with the project's presentation." },
          { k: "owner", body: "These screens show a mill's name and revenue figures. Confirm they are demo data, or that the mill agrees to their being public, before this goes live." }] },
      { id: "context", label: "Context & recognition", glyph: "seal", stage: { kind: "records", records: [
          { type: "team", title: "Team project", body: "Built by a team of four. The repository is public.", mark: "Team" },
          { type: "limit", title: "No public demo", body: "The earlier demo address no longer answers, so none is linked here.", mark: "Note" }] },
        blocks: [{ k: "list", h: "Limits", from: "limitations" },
          { k: "owner", body: "Was Loom AI built for a hackathon, a company or a course? Tell me the event and the result and I will add the record here. Nothing is shown until then." }] },
      { id: "stack", label: "Stack & links", glyph: "link", stage: { kind: "stack", groups: [["Backend", ["FastAPI", "pandas", "Pydantic"]], ["Data", ["PostgreSQL", "Alembic"]], ["Frontend", ["Next.js"]], ["Language model", ["Claude, temperature 0"]]] },
        blocks: [{ k: "links" }, { k: "contribution" }] },
    ],
  },

  assessment: {
    theme: "exam", motif: "An examination hall that marks by what it sees and by what is built",
    cover: null,
    leaves: [
      { id: "overview", label: "Overview", glyph: "eye", stage: { kind: "cover" },
        blocks: [{ k: "lede", from: "overview" }, { k: "pair", a: ["The problem", "problem"], b: ["The answer", "Two independent examiners: one looks at the rendered page, one reads its structure. Their marks are normalised into one score, and faculty review it."] },
          { k: "facts", items: [["2", "independent grading pipelines"], ["3", "portals: student, faculty and admin"], ["Live", "at the institution's own address"]] }] },
      { id: "how", label: "How it marks", glyph: "scales", stage: { kind: "flow", shape: "fork", title: "One submission, two examiners, one mark", token: "A student's page",
          nodes: [
            ["Submission", "A student submits HTML, CSS and JavaScript for a set task.", "React, Vite"],
            ["Render", "Puppeteer renders the submission in headless Chrome, exactly as a user would see it.", "Puppeteer", "a"],
            ["Compare pixels", "Pixelmatch compares the render with the reference image, with a sensitivity threshold so anti-aliasing and imperceptible shifts are ignored.", "Pixelmatch, PNGJS", "a"],
            ["Build the tree", "JSDOM builds the document tree in memory, with no browser, so elements, attributes and hierarchy can be queried.", "JSDOM", "b"],
            ["Check structure", "Required elements and attributes are checked. Levenshtein distance accepts text with a small typo, at a penalty.", "Levenshtein", "b"],
            ["One score", "Both results are normalised and combined into a percentage.", "Node, Express"],
            ["Faculty review", "Faculty apply the rubric and confirm the mark. Attendance and violations are tracked beside it.", "MySQL"]] },
        blocks: [{ k: "text", h: "Why two examiners", body: "A page can look right and be built wrongly, or be built correctly and differ by a pixel. Exact-match checks fail on harmless differences; either examiner alone is unfair." },
          { k: "list", h: "Engineering decisions", from: "decisions" }] },
      { id: "evidence", label: "Screens", glyph: "frame", stage: { kind: "gallery", pid: "assessment" },
        blocks: [{ k: "text", h: "The live platform", body: "The platform runs behind the institution's sign-in, so its screens are not public." },
          { k: "need", items: ["Student view: an assessment in progress", "Faculty view: rubric evaluation of a submission", "Admin view: attendance or violations", "A visual-diff result, if the platform shows one"], body: "Screens of the real platform, with student names hidden. The repository holds none, and I will not use invented ones." }] },
      { id: "context", label: "Context & recognition", glyph: "seal", stage: { kind: "records", records: [
          { type: "deploy", title: "In production", body: "Deployed for Bannari Amman Institute of Technology. The address answered on 9 November 2026.", mark: "Live", href: "demo" },
          { type: "team", title: "Team project", body: "Built by a team.", mark: "Team" },
          { type: "owner", title: "8+ months, 1,000+ submissions", body: "Your own figures, from your resume. Hidden from visitors until you confirm them, or point me to a record that shows them.", mark: "Unconfirmed" }] },
        blocks: [{ k: "text", h: "What is not shown", body: "Usage figures are not published here: they are not public data." }] },
      { id: "stack", label: "Stack & links", glyph: "link", stage: { kind: "stack", groups: [["Frontend", ["React", "Vite"]], ["API", ["Node", "Express", "JWT", "Google sign-in", "helmet", "rate limiting"]], ["Grading", ["Puppeteer", "Pixelmatch", "JSDOM", "Levenshtein"]], ["Data & deployment", ["MySQL", "Docker Compose", "Docker Hub images"]]] },
        blocks: [{ k: "links" }, { k: "contribution" }] },
    ],
  },

  texas: {
    theme: "watch", motif: "A watchtower over dry country: where a fire is likely to start",
    cover: img("texas", "01_roc_curve", "ROC curve on the test split", "tdis-ML, TDIS_Ignition_BIT_V2/results/figures"),
    leaves: [
      { id: "overview", label: "Overview", glyph: "eye", stage: { kind: "figures", lead: true },
        blocks: [{ k: "lede", from: "overview" }, { k: "pair", a: ["The problem", "problem"], b: ["The answer", "A gradient-boosted model over terrain, vegetation, calendar and weather, calibrated so its output reads as a probability, and tested only on years it never saw."] }] },
      { id: "how", label: "How it works", glyph: "gear", stage: { kind: "flow", shape: "chain", title: "From the land and the weather to a calibrated risk", token: "One place, one day",
          nodes: [
            ["36 features", "Static terrain and fuels (12), calendar (6), forecast weather (5), interactions and population (5), and gridMET weather with seasonal imputation (8). Latitude and longitude were removed.", "2,201,289 rows"],
            ["Split by time", "Train on 2018 to 2020, validate on 2021, test on 2022 to July 2026. The model is never tested on a year it trained on.", "671,455 / 268,332 / 1,261,502"],
            ["XGBoost", "A three-stage hyperparameter search over 34 trials: tree structure, learning rate and subsample, then regularisation.", "XGBoost"],
            ["Calibrate", "Isotonic calibration, fitted on the validation year only. Brier score on test falls from 0.158 to 0.149.", "Isotonic"],
            ["Serve", "A FastAPI service scores hexagonal cells in PostgreSQL on a schedule; the deployed app shows them on its wildfire tab.", "FastAPI, PostgreSQL, Azure"]],
          split: [["Train", "2018–2020", 671455], ["Validate", "2021", 268332], ["Test", "2022–2026", 1261502]] },
        blocks: [{ k: "text", h: "Why split by time", body: "Fire seasons differ from year to year. A random split would let the model see the future; a temporal split shows how it does on years that had not happened yet." },
          { k: "list", h: "Feature families", items: ["Terrain and fuels: elevation, slope, aspect, burn probability, canopy, distance to roads and powerlines", "Calendar: month and weekday as cycles, weekends, holidays", "Weather: temperature, vapour-pressure deficit, wind, soil moisture, drought", "Fuel moisture and energy release from gridMET"] }] },
      { id: "evidence", label: "Evaluation", glyph: "chart", stage: { kind: "gallery", pid: "texas" },
        blocks: [{ k: "text", h: "Nine figures from the training run", body: "Each was generated by the project's own script on the real test split of 1,261,502 rows. They are shown as the repository holds them." },
          { k: "list", h: "Reading them honestly", items: ["Ranking is good, not excellent: AUROC 0.803 against a base rate of 0.306", "Training AUROC is 0.931: a gap of 0.128 to test, which the report itself calls larger than earlier models", "Removing latitude and longitude cost a little accuracy (0.806 to 0.803) for a model that generalises by conditions, not by address"] }] },
      { id: "context", label: "Context & recognition", glyph: "seal", stage: { kind: "records", records: [
          { type: "deploy", title: "Deployed", body: "The application answers on Azure and serves the wildfire-ignition tab.", mark: "Live", href: "demo" },
          { type: "team", title: "Team project", body: "The training report is written by a team. This case covers the wildfire-ignition model only.", mark: "Team" },
          { type: "owner", title: "Research context", body: "May the Texas programme be named, and how should your part in it be described? Nothing about any institute is shown to visitors, and no logo is used.", mark: "Unconfirmed" }] },
        blocks: [{ k: "list", h: "Limits", from: "limitations" },
          { k: "owner", body: "The drone drainage repository is a separate fork with none of your commits. It is not mentioned anywhere in this case." }] },
      { id: "stack", label: "Stack & links", glyph: "link", stage: { kind: "stack", groups: [["Model", ["XGBoost", "isotonic calibration"]], ["Data", ["gridMET", "HRRR forecast", "terrain and fuel layers"]], ["Service", ["FastAPI", "PostgreSQL hex cells", "scheduled scoring"]], ["Deployment", ["Azure"]]] },
        blocks: [{ k: "links" }, { k: "contribution" }] },
    ],
    // From TDIS_Ignition_BIT_V2/results/training_results_bit_v2_36feat.json (metrics_raw.test, feature_importance_gain).
    metrics: [["AUROC", 0.803, "ranking quality, 0.5 is chance"], ["AUC-PR", 0.716, "against a base rate of 0.306"], ["F1", 0.622, "at the best-F1 threshold"]],
    sample: "Test split: 1,261,502 rows from 2022 to July 2026",
    importance: [["ecoregion", 14.7], ["elevation", 8.5], ["vapour-pressure deficit", 7.4], ["burn probability", 5.6], ["distance to roads", 4.4], ["distance to powerlines", 4.3], ["minimum humidity", 4.3], ["month (cycle)", 3.3]],
  },

  terratrace: {
    theme: "chart", motif: "A cartographer's desk for satellite change",
    cover: img("terratrace", "changes", "The temporal change studio. Simulated data.", "TerraTrace repository, captured locally 2026-11-13"),
    banner: "Interface prototype. All imagery and results are simulated; no model runs.",
    leaves: [
      { id: "overview", label: "Overview", glyph: "eye", stage: { kind: "cover" },
        blocks: [{ k: "lede", from: "overview" }, { k: "pair", a: ["The problem", "problem"], b: ["The design", "The system builds the chain of evidence; the analyst confirms, doubts or rejects each change, and the decision is logged."] }] },
      { id: "how", label: "The workflow", glyph: "gear", stage: { kind: "flow", shape: "thread", title: "From a question to a logged decision", token: "An analyst's question",
          nodes: [["Question", "The analyst asks by meaning, place and time, or drops a reference image.", "Mission"], ["Discovery", "Ranked candidate sites, each with the reasons it was found. Simulated in this prototype.", "Discover"],
            ["Change over time", "One site across acquisitions: timeline, before and after, change map.", "Change studio"], ["Evidence", "The scenes, dates and measurements behind a claimed change.", "Evidence"], ["Decision", "Confirm, mark uncertain or reject. The decision is logged with its evidence.", "Review"]] },
        blocks: [{ k: "text", h: "What is real here", body: "The interface, its workflow and its interaction design. Retrieval, change detection and false-alarm suppression are represented by simulated data." }, { k: "list", h: "Design decisions", from: "decisions" }] },
      { id: "evidence", label: "Screens", glyph: "frame", stage: { kind: "gallery", pid: "terratrace" },
        blocks: [{ k: "text", h: "The working interface", body: "Captured from the repository's own code, served locally. Every number and image in these screens is simulated." }] },
      { id: "context", label: "Context & recognition", glyph: "seal", stage: { kind: "records", records: [
          { type: "brief", title: "Problem statement SIH26227", body: "Smart India Hackathon: semantic retrieval and multi-temporal change analysis of satellite imagery. Ministry of Defence, DGIS.", mark: "Brief" },
          { type: "owner", title: "Outcome", body: "Was this submitted, and how far did it go? The README says SIH 2024 while the problem number reads 26227: tell me the year. No result is shown until you confirm one.", mark: "Unconfirmed" }] },
        blocks: [{ k: "list", h: "Limits", from: "limitations" }] },
      { id: "stack", label: "Stack & links", glyph: "link", stage: { kind: "stack", groups: [["Interface", ["Vanilla JavaScript ES modules", "CSS"]], ["Delivery", ["Static files"]]] }, blocks: [{ k: "links" }, { k: "contribution" }] },
    ],
  },

  nenai: {
    theme: "archive", motif: "A memory archive that never leaves the device",
    cover: null,
    leaves: [
      { id: "overview", label: "Overview", glyph: "eye", stage: { kind: "cover" }, blocks: [{ k: "lede", from: "overview" }, { k: "pair", a: ["The problem", "problem"], b: ["The answer", "Everything runs on the phone: the language model, the embeddings, the database and the search."] }] },
      { id: "how", label: "How it works", glyph: "gear", stage: { kind: "flow", shape: "chain", title: "A memory, kept and found again without a network", token: "Something worth remembering",
          nodes: [["Capture", "A note or conversation is saved in the Flutter app.", "Flutter, Riverpod"], ["Embed", "all-MiniLM-L6-v2 runs through ONNX on the device and turns the text into 384 numbers.", "ONNX"],
            ["Store", "SQLite through Drift holds the memory; sqlite-vec holds its vector for search.", "SQLite, sqlite-vec"], ["Recall", "Agents understand the question, resolve context and retrieve the nearest memories.", "Memory agents"], ["Answer", "Gemma 3 1B, quantised to int4, writes the answer on the device.", "Gemma 3, flutter_gemma"]] },
        blocks: [{ k: "list", h: "Architecture", from: "architecture" }] },
      { id: "evidence", label: "Screens", glyph: "frame", stage: { kind: "gallery", pid: "nenai" },
        blocks: [{ k: "need", items: ["Three to five screens of the app on a phone", "A short screen recording of a memory being saved and recalled offline, if you have one"], body: "The repository holds no screenshots or recording, and I cannot run the app here." }] },
      { id: "context", label: "Context & recognition", glyph: "seal", stage: { kind: "records", records: [{ type: "team", title: "Team project", body: "Built by a team. The repository is public.", mark: "Team" },
          { type: "owner", title: "Your role", body: "A teammate made most of the commits. Tell me what you built, in your own words, and whether it was made for an event.", mark: "Unconfirmed" }] }, blocks: [{ k: "list", h: "Limits", from: "limitations" }] },
      { id: "stack", label: "Stack & links", glyph: "link", stage: { kind: "stack", groups: [["App", ["Flutter", "Riverpod", "MVVM"]], ["On-device AI", ["Gemma 3 1B int4", "ONNX all-MiniLM-L6-v2"]], ["Data", ["SQLite (Drift)", "sqlite-vec"]], ["Background", ["WorkManager", "isolates"]]] }, blocks: [{ k: "links" }, { k: "contribution" }] },
    ],
  },

  "hac-few": {
    theme: "table", motif: "A command table: one supervisor, three specialists, every order recorded",
    cover: img("hac-few", "Architecture", "The team's proposed architecture", "HAC-FEW repository, Images/Architecture.png"),
    leaves: [
      { id: "overview", label: "Overview", glyph: "eye", stage: { kind: "cover" }, blocks: [{ k: "lede", from: "overview" }, { k: "pair", a: ["The problem", "problem"], b: ["The answer", "A supervisor plans and delegates; specialist agents act; approvals, policy and an audit trail keep people in command."] }] },
      { id: "how", label: "How it works", glyph: "gear", stage: { kind: "flow", shape: "radial", title: "One request round the table", token: "An employee's request",
          nodes: [["Supervisor", "Understands the request, breaks it into tasks and routes each to a specialist. Orchestrated with LangGraph.", "LangGraph"],
            ["HR agent", "Leave, onboarding, policy questions.", "Specialist"], ["Finance agent", "Invoices, expenses, budgets.", "Specialist"], ["IT agent", "Access, accounts, support.", "Specialist"],
            ["Policy & approval", "A policy engine decides what may run alone; the rest waits for a person's approval.", "Policy engine"], ["Audit trail", "Every step is recorded in a hash-chained trail.", "FastAPI"]] },
        blocks: [{ k: "list", h: "Architecture", from: "architecture" }] },
      { id: "evidence", label: "Diagrams", glyph: "frame", stage: { kind: "gallery", pid: "hac-few" },
        blocks: [{ k: "text", h: "From the repository", body: "Two diagrams drawn by the team. The repository's benchmark badges are not shown: its own README warns that some of those figures are written into the code." },
          { k: "need", items: ["Screens of the React console: a request, an approval, the audit trail"], body: "The repository holds diagrams but no screens of the console." }] },
      { id: "context", label: "Context & recognition", glyph: "seal", stage: { kind: "records", records: [{ type: "team", title: "Team and course project", body: "Built by a team; the repository belongs to a teammate.", mark: "Team" }] }, blocks: [{ k: "list", h: "Limits", from: "limitations" }] },
      { id: "stack", label: "Stack & links", glyph: "link", stage: { kind: "stack", groups: [["Agents", ["LangGraph", "Supervisor and three specialists"]], ["Platform", ["FastAPI", "policy engine", "hash-chained audit"]], ["Console", ["React", "TypeScript"]]] }, blocks: [{ k: "links" }, { k: "contribution" }] },
    ],
  },
};
