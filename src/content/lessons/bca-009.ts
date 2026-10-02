import type { Lesson } from "./types";

const sdlcModels: Lesson = {
  intro: "The Software Development Life Cycle (SDLC) defines the structured sequence of stages from initial feasibility to system retirement. Classical university questions compare the Waterfall, Prototyping, Incremental, and Agile methodologies across requirement stability, risk management, and customer involvement. You will learn the phase gates, trade-offs, and selection criteria.",
  sections: [
    {
      h: "Classical Waterfall vs Iterative & Agile",
      p: [
        "Waterfall Model (Linear-Sequential): Requirements -> Design -> Implementation -> Testing -> Deployment -> Maintenance. Rigid phase containment: work proceeds downstream only after preceding phase deliverables are frozen and signed off. Strengths: High predictability and clear documentation. Weakness: Poor tolerance for changing requirements and late risk discovery (testing is deferred to the end).",
        "Prototyping Model: Builds a mock-up / working subset of the system for user evaluation to clarify ambiguous requirements before full-scale architecture and coding begin.",
        "Spiral Model (Boehm): Risk-driven iterative model organized in 4 quadrants per cycle: (1) Determine objectives and constraints, (2) Identify and resolve risks (via prototyping), (3) Develop and verify the next-level product, (4) Plan the next phase. Essential for high-risk, mission-critical projects.",
        "Agile & Scrum: Divides development into short time-boxed iterations (sprints, typically 2–4 weeks) delivering potentially shippable software increments. Embraces change, continuous stakeholder feedback, and test-driven development."
      ],
      formula: [
        "Waterfall: Linear | High requirement certainty | Late testing | High risk of late surprises",
        "Prototyping: Iterative UI/UX | High customer interaction | Clarifies ambiguous requirements",
        "Spiral: 4 Quadrants (Objectives -> Risk Analysis -> Engineering -> Review) | Risk-driven",
        "Agile/Scrum: Sprint backlog -> Daily standup -> 2-4 wk sprint -> Shippable increment"
      ]
    },
    {
      h: "CMMI Process Maturity Levels",
      p: [
        "Level 1 (Initial): Ad-hoc, chaotic, success depends on individual heroics.",
        "Level 2 (Managed): Projects are planned, performed, measured, and controlled at the project level.",
        "Level 3 (Defined): Organization-wide standard processes, tailored for individual projects.",
        "Level 4 (Quantitatively Managed): Process and product quality are measured with statistical metrics.",
        "Level 5 (Optimizing): Continuous process improvement through innovative technological changes."
      ]
    }
  ],
  examples: [
    {
      q: "Which SDLC model is best suited for a banking transaction core with strictly regulated, unchanging specifications versus an innovative startup mobile app?",
      steps: [
        "Banking core: Requirements are well-understood, regulatory compliance is mandatory, and changes are rare. Waterfall or V-Model provides formal verification and strict phase traceability.",
        "Startup mobile app: Requirements are volatile, fast time-to-market is vital, and customer feedback dictates features. Agile/Scrum allows continuous evolution and quick pivots."
      ],
      ans: "Banking core: Waterfall / V-Model. Startup app: Agile (Scrum/Kanban)."
    },
    {
      q: "Explain why the Spiral Model is known as a 'Risk-Driven' process model.",
      steps: [
        "Each spiral loop explicitly includes Quadrant 2 dedicated to Risk Analysis.",
        "If a technical, financial, or architectural risk cannot be resolved (e.g. via prototyping or simulation), the project can be terminated before expensive implementation begins.",
        "The radius of the spiral represents cumulative cost; the angular dimension represents progress through the quadrants."
      ],
      ans: "It incorporates an explicit risk assessment and prototyping quadrant in every single iteration before code development."
    }
  ],
  mistakes: [
    "Recommending Waterfall for projects with highly unstable or exploratory requirements.",
    "Omitting the Risk Analysis quadrant when sketching the 4-quadrant Spiral Model diagram.",
    "Confusing CMMI Level 2 (Project-level managed) with Level 3 (Organization-wide defined)."
  ],
  check: [
    { q: "In which SDLC model is risk analysis explicitly conducted in every cycle?", o: ["Waterfall Model", "Spiral Model", "RAD Model", "Incremental Model"], a: 1, why: "The Spiral Model is an iterative, risk-driven process model." },
    { q: "What is the primary drawback of the traditional Waterfall Model?", o: ["Lack of documentation", "Inability to accommodate changing requirements", "No testing phase", "Excessive customer involvement"], a: 1, why: "Waterfall locks requirements early and cannot easily handle changing requirements." },
    { q: "CMMI Level 5 is called", o: ["Defined", "Quantitatively Managed", "Optimizing", "Managed"], a: 2, why: "Level 5 is the Optimizing maturity level focused on continuous improvement." },
    { q: "In Scrum methodology, a typical Sprint duration is", o: ["1 year", "2 to 4 weeks", "6 months", "1 day"], a: 1, why: "Scrum sprints are short timeboxes, typically 2 to 4 weeks long." }
  ],
  lab: { id: "cicd", label: "Open the CI/CD Pipeline & Delivery Lab" }
};

const srsEngineering: Lesson = {
  intro: "A Software Requirements Specification (SRS) is the formal contract between users, clients, and developers. Questions require you to identify the characteristics of a good SRS (IEEE 830 standard), distinguish Functional from Non-Functional Requirements, and write clean requirement statements. You will master IEEE 830 organization and requirement metrics.",
  sections: [
    {
      h: "Functional vs Non-Functional Requirements",
      p: [
        "Functional Requirements (FRs): Define specific system behavior, inputs, transformations, and outputs (e.g., 'The system shall authenticate users via OAuth2 within 500 ms', 'The system shall calculate compound interest using formula A').",
        "Non-Functional Requirements (NFRs): Specify quality constraints and operational standards (URPS: Usability, Reliability, Performance, Security, Maintainability, Portability, Scalability)."
      ],
      formula: [
        "FR: What the system DOES (services, behaviors, calculations)",
        "NFR: How well the system performs (latency < 200 ms, 99.99% uptime, AES-256 encryption)",
        "IEEE 830 SRS Structure: 1. Introduction, 2. Overall Description, 3. Specific Requirements"
      ]
    },
    {
      h: "Characteristics of a Good SRS (IEEE 830)",
      p: [
        "1. Correct: Every stated requirement represents something demanded by the real customer.",
        "2. Unambiguous: Every requirement has only one interpretation by developers and clients.",
        "3. Complete: Covers all significant requirements, responses to invalid inputs, and error modes.",
        "4. Consistent: No conflicting statements (e.g., one section saying response time < 1s and another saying 5s).",
        "5. Ranked for Importance/Stability: Requirements prioritized (e.g. MoSCoW: Must have, Should have, Could have, Won't have).",
        "6. Verifiable / Testable: Quantifiable so a test case can prove pass/fail.",
        "7. Modifiable: Well-indexed and structured so updates do not break integrity.",
        "8. Traceable: Each requirement can be traced backward to business need and forward to design/test cases."
      ]
    }
  ],
  examples: [
    {
      q: "Criticize and rewrite the requirement: 'The website must be extremely user-friendly and load pages very quickly.'",
      steps: [
        "Critique: 'Extremely user-friendly' and 'very quickly' are subjective, ambiguous, and not verifiable.",
        "Rewrite into verifiable metrics: (1) 'The home page First Contentful Paint (FCP) shall occur within 1.2 seconds over a 4G connection', (2) 'A novice user shall complete a checkout transaction in under 3 minutes with zero assistance in 90% of usability trials.'"
      ],
      ans: "Replace vague adjectives with quantifiable, testable thresholds (e.g., load time < 1.2s, task completion rate > 90%)."
    }
  ],
  mistakes: [
    "Writing non-verifiable requirements using words like 'fast', 'user-friendly', 'optimal', 'robust'.",
    "Confusing design constraints (e.g. 'Use MySQL 8.0') with behavioral functional requirements.",
    "Omitting exception handling and error response specifications in the SRS."
  ],
  check: [
    { q: "Which of the following is a non-functional requirement?", o: ["User login via OTP", "The system shall process 10,000 transactions per second", "Generate monthly PDF invoice", "Email password reset link"], a: 1, why: "Throughput (transactions per second) is a performance/non-functional requirement." },
    { q: "The IEEE standard recommended for Software Requirements Specifications is", o: ["IEEE 802.11", "IEEE 830", "IEEE 754", "IEEE 1012"], a: 1, why: "IEEE 830 is the standard for SRS documentation." },
    { q: "A requirement is 'Verifiable' if and only if", o: ["It is written in English", "There exists a finite cost-effective process to check if the software meets it", "It has no numbers", "The customer signed it"], a: 1, why: "Verifiable means a test or inspection can objectively prove compliance." }
  ]
};

export const L_BCA009: Record<string, Lesson> = {
  "BCA-009:1:7": sdlcModels,
  "BCA-009:2:3": srsEngineering,
};
