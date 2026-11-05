/**
 * All site copy. Facts come only from context/MY_PROFILE.md and context/PROJECTS.md.
 * Anything the owner has not stated stays verified: false and does not render.
 */
import { publishable, type Claim } from "./claims";

export const GITHUB_URL = "https://github.com/Gokul-bit165";

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  built: boolean;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: "prologue", number: 0, title: "Prologue", subtitle: "The Beginning", built: true },
  { id: "identity", number: 1, title: "Identity", subtitle: "The Person Behind the Code", built: true },
  { id: "philosophy", number: 2, title: "Philosophy", subtitle: "How I Think and Build", built: false },
  { id: "works", number: 3, title: "Selected Works", subtitle: "Featured Projects", built: false },
  { id: "engineering", number: 4, title: "Engineering", subtitle: "Skills and Technical Depth", built: false },
  { id: "recognition", number: 5, title: "Recognition", subtitle: "Achievements and Leadership", built: false },
  { id: "journey", number: 6, title: "Journey", subtitle: "Education and Development", built: false },
  { id: "beyond", number: 7, title: "Beyond Code", subtitle: "Personality and Interests", built: false },
  { id: "epilogue", number: 8, title: "Epilogue", subtitle: "Contact and Collaboration", built: false },
];

export const prologue = {
  title: "The Journey of an Engineer",
  supporting: "A story told through ink, imagination and engineering.",
} as const;

export interface IdentityFact {
  label: string;
  detail: string;
  href?: string;
}

const factClaims: readonly Claim<IdentityFact>[] = [
  { verified: true, value: { label: "Study", detail: "CSE — Artificial Intelligence and Data Science" } },
  { verified: true, value: { label: "Institute", detail: "Bannari Amman Institute of Technology, Tamil Nadu, India" } },
  { verified: true, value: { label: "Expected graduation", detail: "September 2028" } },
  { verified: true, value: { label: "GitHub", detail: "Gokul-bit165", href: GITHUB_URL } },
  {
    verified: false,
    needs: "Exact degree title and whether to show current year or CGPA (MY_PROFILE.md)",
    value: { label: "Degree", detail: "" },
  },
];

const interestClaims: readonly Claim<string>[] = [
  { verified: true, value: "Agentic AI and multi-agent systems" },
  { verified: true, value: "Generative AI and LLM applications" },
  { verified: true, value: "Machine learning and computer vision" },
  { verified: true, value: "Full-stack development" },
  { verified: true, value: "Backend architecture and scalable systems" },
  { verified: true, value: "3D visualization and interactive experiences" },
  { verified: true, value: "AI-powered industrial applications" },
];

export const identity = {
  name: "Gokul",
  role: "An engineering undergraduate building across agentic AI, full-stack systems and interactive 3D.",
  introduction:
    "I study Computer Science and Engineering, in Artificial Intelligence and Data Science, at Bannari Amman Institute of Technology in Tamil Nadu, India. I expect to graduate in September 2028.",
  facts: publishable(factClaims),
  interestsHeading: "What I am drawn to",
  interests: publishable(interestClaims),
  philosophy: {
    heading: "Engineering philosophy",
    statement: "I build with AI as a working partner.",
    detail:
      "Claude Code is my primary development partner. I also use AI for artwork, 3D scenes, motion assets and creative automation.",
  },
} as const;
