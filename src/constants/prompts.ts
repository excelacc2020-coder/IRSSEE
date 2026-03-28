// All AI prompts use TAX YEAR 2025 (the most recently completed tax year as of 2026 exam prep)
const TAX_YEAR = '2025';

export const MORNING_BRIEF_PROMPT = (topic: string, part: number, errorBridgeContext: string) => `
You are an expert IRS tax educator helping a student prepare for the IRS Special Enrollment Examination (SEE) Part ${part}.

Tax Year: **${TAX_YEAR}** — Use ${TAX_YEAR} figures, thresholds, and inflation-adjusted amounts throughout.

Today's topic: **${topic}**

Generate a structured morning brief with exactly these six sections. Use clear, concise language appropriate for exam prep. Be specific with ${TAX_YEAR} numbers, thresholds, and rules — this is for an exam, not general reading.

${errorBridgeContext ? `Recent errors to address in the Error Bridge section:\n${errorBridgeContext}\n` : ''}

Return ONLY a valid JSON object in this exact format (no markdown, no explanation outside JSON):
{
  "coreConcept": "2-3 sentence explanation of the core concept and why it matters for the exam. Reference ${TAX_YEAR} law where applicable.",
  "keyRulesThresholds": "Bullet-point list of critical rules, dollar thresholds, percentages, and time limits for tax year ${TAX_YEAR}. Format each bullet as '• [rule]'",
  "formsCompliance": "Which IRS forms are involved, what they do, and key lines/fields to know for the exam. Note any ${TAX_YEAR} form changes.",
  "connections": "How this topic connects to other SEE exam topics and real-world ${TAX_YEAR} tax scenarios",
  "examTraps": "3-5 specific common exam traps, trick questions, and distractors students fall for on this topic. Include any ${TAX_YEAR} law changes that trip up candidates.",
  "errorBridge": "${errorBridgeContext ? 'Analysis of recent wrong answers and specific guidance to avoid repeating them' : 'No recent errors for this topic. Focus on the most commonly tested nuances.'}"
}
`.trim();

export const MIND_MAP_PROMPT = (topic: string, part: number) => `
You are an expert IRS tax educator preparing a student for the IRS SEE exam Part ${part}.

Tax Year: **${TAX_YEAR}** — All thresholds, limits, and figures must reflect tax year ${TAX_YEAR}.

Topic: **${topic}**

Create a decision flow diagram showing how a tax professional actually thinks through this topic when working with a client or filing a return. The flow should reflect the real logical sequence of decisions made in practice.

Also include reference tables for rules, exceptions, forms, calculations, and exam traps. Each list should have 3-5 specific, exam-relevant items with concrete ${TAX_YEAR} dollar amounts, percentages, and form numbers where applicable.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "decisionFlow": [
    {"node": "Step 1: [Step Name]", "question": "Key yes/no or threshold question to ask at this step", "action": "What to do / which rule applies / where to go next"},
    {"node": "Step 2: [Step Name]", "question": "...", "action": "..."},
    {"node": "Step 3: [Step Name]", "question": "...", "action": "..."},
    {"node": "Step 4: [Step Name]", "question": "...", "action": "..."},
    {"node": "Step 5: [Step Name]", "question": "...", "action": "..."}
  ],
  "rules": ["rule 1 with ${TAX_YEAR} amounts", "rule 2", "rule 3", "rule 4"],
  "exceptions": ["exception 1", "exception 2", "exception 3"],
  "forms": ["Form XXXX: purpose and key line", "Schedule X: when required"],
  "calculations": ["formula or ${TAX_YEAR} threshold", "phase-out range with ${TAX_YEAR} figures", "example computation"],
  "traps": ["exam trap 1", "common mistake 2", "distractor 3"]
}
`.trim();

export const MCQ_PROMPT = (topic: string, part: number, errorContext: string) => `
You are an expert IRS SEE exam question writer for Part ${part}.

Tax Year: **${TAX_YEAR}** — All dollar amounts, thresholds, and phase-outs must use ${TAX_YEAR} figures.

Topic: **${topic}**

Create ONE realistic, complex client scenario (150-200 words) set in tax year ${TAX_YEAR}, involving a real person or business with multiple financial events, edge cases, and potential exam traps related to this topic. Give the client a name and specific dollar amounts using ${TAX_YEAR} values.

Then write exactly 6 multiple-choice questions that ALL reference this specific scenario. Questions should probe different aspects and require reading the scenario carefully. Use a mix of question types across the 6 questions:
- At least 2 questions that calculate or determine a specific dollar amount using ${TAX_YEAR} figures
- At least 1 "All of the following EXCEPT" question
- At least 1 question about a trap or exception hidden in the scenario
- Questions should be answerable from the scenario details provided

Rules for all questions:
- All 4 options must be plausible and specific (real ${TAX_YEAR} dollar amounts, real rules)
- Include specific ${TAX_YEAR} thresholds, percentages, form numbers where relevant
- Wrong options should represent common mistakes, not obviously wrong answers
${errorContext ? `- Address these known weak areas: ${errorContext}` : ''}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "scenario": "Full scenario text, 150-200 words, describing the client situation with specific ${TAX_YEAR} numbers...",
  "questions": [
    {
      "id": 1,
      "type": "direct|incomplete|except|scenario",
      "question": "Based on the scenario, what is... / Which of the following... / [question referencing the scenario]",
      "options": {
        "A": "option text",
        "B": "option text",
        "C": "option text",
        "D": "option text"
      },
      "correct": "A|B|C|D",
      "explanation": "Why the correct answer is right and why each wrong answer is wrong, with reference to the ${TAX_YEAR} rules and scenario facts"
    }
  ]
}
`.trim();

export const ERROR_CATEGORIZATION_PROMPT = (question: string, userAnswer: string, correctAnswer: string, explanation: string) => `
Categorize this wrong MCQ answer into exactly one error category.

Question: ${question}
Student answered: ${userAnswer}
Correct answer: ${correctAnswer}
Explanation: ${explanation}

Categories:
- rule_gap: Student didn't know or misapplied the IRC rule, threshold, or definition
- calculation_error: Student knew the rule but computed or applied numbers incorrectly
- exception_missed: Student knew the general rule but missed a specific exception or special case
- trap_fallen: Student fell for a common exam distractor, trick phrasing, or misleading scenario

Return ONLY a JSON object (no markdown):
{"category": "rule_gap|calculation_error|exception_missed|trap_fallen", "reasoning": "one sentence explanation"}
`.trim();

export const ANKI_CARDS_PROMPT = (topic: string, wrongQuestions: string[], studyNotes: string) => `
You are creating Anki flashcards for IRS SEE exam prep.

Tax Year: **${TAX_YEAR}** — All dollar amounts, limits, and thresholds must reflect ${TAX_YEAR} figures.

Topic: **${topic}**
${wrongQuestions.length > 0 ? `\nQuestions the student got wrong:\n${wrongQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}
${studyNotes ? `\nStudent's study notes:\n${studyNotes}` : ''}

Generate 5-10 Anki flashcards targeting:
1. ${TAX_YEAR} rules, thresholds, and percentages the student struggled with
2. Exception patterns
3. Key form numbers and their purposes
4. Common exam traps from this topic

Each card should be a precise, testable fact — not a broad concept. Always include the tax year in the question when referencing a specific amount.

Return ONLY a valid JSON array (no markdown):
[
  {
    "question": "Short, specific question (e.g., 'What is the ${TAX_YEAR} standard deduction for MFJ?')",
    "answer": "Precise answer with ${TAX_YEAR} figures and any relevant details (e.g., '$30,000. Increases by $1,600 per spouse age 65+ or blind.')"
  }
]
`.trim();

export const EVENING_SUMMARY_PROMPT = (topic: string, quizScore: number, totalQuestions: number, wrongTopics: string[]) => `
You are summarizing a student's study day for IRS SEE exam prep (tax year ${TAX_YEAR}).

Topic studied: **${topic}**
Quiz performance: ${quizScore}/${totalQuestions} correct
${wrongTopics.length > 0 ? `Areas of weakness: ${wrongTopics.join(', ')}` : 'No wrong answers today.'}

Write a brief, encouraging end-of-day summary (3-4 sentences) that:
1. Acknowledges what was mastered
2. Identifies the most important gap to address
3. Sets focus for tomorrow's review

Return ONLY plain text, no JSON, no markdown headers.
`.trim();
