// All AI prompts use TAX YEAR 2025 (the most recently completed tax year as of 2026 exam prep)
const TAX_YEAR = '2025';

export const MORNING_BRIEF_PROMPT = (topic: string, part: number, errorBridgeContext: string) => `
You are an expert IRS tax educator helping a student prepare for the IRS Special Enrollment Examination (SEE) Part ${part}.

Tax Year: **${TAX_YEAR}** — Use ${TAX_YEAR} figures, thresholds, and inflation-adjusted amounts throughout.

Today's topic contains the following subtopics (separated by newlines):
${topic}

IMPORTANT INSTRUCTIONS ON DEPTH AND DETAIL:
- Be THOROUGH and COMPREHENSIVE. Cover EVERY testable aspect of each subtopic.
- Each item's "rule" field should be a DETAILED explanation (2-4 sentences), not a one-line summary.
- Each item's "threshold" field should list ALL relevant ${TAX_YEAR} dollar amounts, percentages, phase-out ranges, and income limits — not just one number.
- Each item's "tip" field should explain the trap in enough detail that a student understands WHY it's tricky.
- Aim for at LEAST 4-6 items per section. If a subtopic has more testable areas, include them ALL.
- Do NOT summarize or abbreviate. The student relies on this brief as their primary study material.

Break the topic into granular, digestible sub-items grouped by subtopic. For example, "Filing Status & Dependents" should become two sections: one for Filing Status (with items for MFJ, MFS, HOH, QSS, Single) and one for Dependents (with items for Qualifying Child test, Qualifying Relative test). Keep each item focused on one key concept but explain it thoroughly.

${errorBridgeContext ? `Recent errors to address in the Error Bridge section:\n${errorBridgeContext}\n` : ''}

Return ONLY a valid JSON object (no markdown, no explanation outside JSON):
{
  "overview": "A 3-5 sentence paragraph explaining what this topic covers in plain English, why it matters in real-world tax practice, and what real-life situations trigger these rules.",
  "sections": [
    {
      "heading": "Subtopic heading (e.g., Filing Status)",
      "items": [
        {
          "label": "Specific item name (e.g., Head of Household)",
          "rule": ["Bullet point 1 — core rule or definition with ${TAX_YEAR} figure", "Bullet point 2 — additional rule detail or condition", "Bullet point 3 — further detail if needed"],
          "threshold": ["Bullet 1 — specific ${TAX_YEAR} dollar amount or limit", "Bullet 2 — phase-out range or income limit", "Bullet 3 — additional threshold if applicable"],
          "form": ["Form XXXX — purpose and key line number", "Schedule X — when required"],
          "tip": ["Bullet 1 — exam trap with explanation of WHY it tricks students and how to avoid it", "Bullet 2 — additional trap or memorization tip if applicable"]
        }
      ]
    }
  ],
  "connections": "3-5 sentences on how today's subtopics connect to other SEE exam domains — be specific about which other topics interact with today's material",
  "examTraps": "5-8 bullet points: '• [detailed trap description explaining the trap and the correct approach]'",
  "errorBridge": "${errorBridgeContext ? 'Detailed guidance to avoid repeating recent wrong answers — explain the correct rule for each error' : 'No recent errors. Cover 3-4 commonly tested nuances and edge cases that students frequently miss on this topic.'}"
}
`.trim();

export const MIND_MAP_PROMPT = (topic: string, part: number) => `
You are an expert IRS tax educator preparing a student for the IRS SEE exam Part ${part}.

Tax Year: **${TAX_YEAR}** — All thresholds, limits, and figures must reflect tax year ${TAX_YEAR}.

Topic: **${topic}**

IMPORTANT INSTRUCTIONS ON DEPTH AND DETAIL:
- Be THOROUGH and COMPREHENSIVE. This mind map should cover ALL testable aspects of the topic.
- The decision flow should have 6-8 steps showing the complete logical chain a tax professional follows.
- Each step's "action" field should be 2-3 sentences explaining what to do and which specific rules apply.
- Rules, exceptions, forms, calculations, and traps lists should each have 5-8 items, not just 3-4.
- Include SPECIFIC ${TAX_YEAR} dollar amounts, percentages, form numbers, and line references wherever applicable.
- Do NOT summarize or abbreviate. Cover every angle that could appear on the exam.

Create a decision flow diagram showing how a tax professional actually thinks through this topic when working with a client or filing a return. The flow should reflect the real logical sequence of decisions made in practice, covering ALL branches and edge cases.

Also include comprehensive reference tables for rules, exceptions, forms, calculations, and exam traps. Each list should have specific, exam-relevant items with concrete ${TAX_YEAR} dollar amounts, percentages, and form numbers.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "decisionFlow": [
    {"node": "Step 1: [Step Name]", "question": "Key yes/no or threshold question to ask at this step", "action": "Detailed explanation of what to do, which rule applies, and where to go next (2-3 sentences)"},
    {"node": "Step 2: [Step Name]", "question": "...", "action": "..."},
    {"node": "Step 3: [Step Name]", "question": "...", "action": "..."},
    {"node": "Step 4: [Step Name]", "question": "...", "action": "..."},
    {"node": "Step 5: [Step Name]", "question": "...", "action": "..."},
    {"node": "Step 6: [Step Name]", "question": "...", "action": "..."}
  ],
  "rules": ["Detailed rule 1 with ${TAX_YEAR} amounts and explanation of how it works", "rule 2", "rule 3", "rule 4", "rule 5"],
  "exceptions": ["Detailed exception 1 explaining when the general rule does NOT apply and what happens instead", "exception 2", "exception 3", "exception 4"],
  "forms": ["Form XXXX: detailed purpose, when required, and key line numbers", "Schedule X: when required and what triggers it", "Form YYYY: purpose"],
  "calculations": ["Complete formula with ${TAX_YEAR} threshold and step-by-step example", "Phase-out range with ${TAX_YEAR} figures and calculation method", "Example computation showing all steps"],
  "traps": ["Detailed exam trap 1 — explain what the trap looks like and the correct approach", "trap 2", "trap 3", "trap 4", "trap 5"]
}
`.trim();

export const MCQ_PROMPT = (topic: string, part: number, errorContext: string, coveredTopics: string[]) => `
You are an expert IRS SEE exam question writer for Part ${part}.

Tax Year: **${TAX_YEAR}** — All dollar amounts, thresholds, and phase-outs must use ${TAX_YEAR} figures.

Topic: **${topic}**

${coveredTopics.length > 0 ? `IMPORTANT — Topics the student has studied so far (ONLY test knowledge from these):
${coveredTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Do NOT test knowledge from topics the student has not yet covered. All questions, scenario facts, and answer options must be answerable using ONLY the topics listed above. If the current topic references concepts from future topics, test only the aspects covered so far.` : ''}

Create ONE realistic, complex client scenario (200-300 words) set in tax year ${TAX_YEAR}, involving a real person or business with multiple financial events, edge cases, and potential exam traps related to this topic. Give the client a name, occupation, family details, and specific dollar amounts using ${TAX_YEAR} values. Include enough detail to support 6 questions testing different aspects of the topic.

Then write exactly 6 multiple-choice questions that ALL reference this specific scenario. Use a mix of question types:
- At least 2 calculation questions (determine a specific dollar amount using ${TAX_YEAR} figures)
- At least 1 "All of the following EXCEPT" question
- At least 1 question about a trap or exception hidden in the scenario

IMPORTANT INSTRUCTIONS ON DEPTH AND DETAIL:
- Each question should be substantive and test real understanding, not surface-level recall.
- The "explanation" field must be COMPREHENSIVE (4-8 sentences): show the complete reasoning, cite the specific IRC section or rule, explain the correct calculation step-by-step, and explain why EACH wrong option is wrong and what specific mistake it represents.
- Wrong options must be genuinely plausible — they should represent real mistakes students make (wrong rate, missed exception, included wrong item, etc.), not obviously wrong answers.
- Cover different aspects of the topic across the 6 questions — don't test the same concept twice.

Rules for ALL questions:
- All 4 options must be plausible and specific (real ${TAX_YEAR} dollar amounts, real rules)
- Wrong options represent common mistakes, not obviously wrong answers
- CRITICAL: Exactly ONE of the four options (A/B/C/D) must be correct
- Ensure the scenario contains all facts needed to answer every question
${errorContext ? `- Address these known weak areas: ${errorContext}` : ''}

MANDATORY WORKFLOW — follow this exact order for EVERY question, no exceptions:
  STEP 1 — COMPUTE FIRST: Calculate the correct answer BEFORE writing any answer options.
           Show every arithmetic step in the "calc" field.
           Example for net profit: "94000+6800=100800; 3200+1800+3600+450+2200=11250; 100800-11250=89550".
           Example for SE tax: "55900*0.9235=51624.65; 51624.65*0.153=7898.57 rounds to 7899".
           For non-calculation questions write "calc": "N/A".
  STEP 2 — BUILD OPTIONS: Write options A, B, C, D so that EXACTLY ONE option equals the Step 1 result.
           The other three are plausible wrong answers (missed a deduction, wrong rate, used gross instead of net, etc.).
  STEP 3 — SET CORRECT: Set "correct" to the letter whose option text matches the Step 1 result.
  STEP 4 — FINAL CHECK: Re-read the option you marked correct. Confirm the dollar amount matches Step 1 exactly.
           If it does not match, fix the option text to match Step 1 — NEVER change the answer to fit a wrong option.

Return ONLY a valid JSON object (no markdown, no explanation outside JSON):
{
  "scenario": "Full scenario text, 200-300 words with specific ${TAX_YEAR} numbers, multiple financial events, and enough detail for all 6 questions...",
  "questions": [
    {
      "id": 1,
      "type": "direct|incomplete|except|scenario",
      "calc": "Arithmetic scratchpad — show every step before writing options. E.g. '94000+6800=100800; 3200+1800+3600+450+2200=11250; 100800-11250=89550'. Write N/A for non-calculation questions.",
      "question": "Question text referencing the scenario",
      "options": {
        "A": "option text",
        "B": "option text",
        "C": "option text",
        "D": "option text"
      },
      "correct": "A|B|C|D",
      "explanation": "COMPREHENSIVE explanation (4-8 sentences): state the applicable rule/IRC section, show the complete correct calculation step-by-step, then explain why each wrong option is wrong and what specific mistake each represents"
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

export const MOCK_EXAM_PROMPT = (completedTopics: { day: number; topic: string; part: number }[], questionCount: number) => `
You are an expert IRS SEE exam question writer.

Tax Year: **${TAX_YEAR}** — All dollar amounts, thresholds, and phase-outs must use ${TAX_YEAR} figures.

The student has completed the following topics:
${completedTopics.map(t => `Day ${t.day} (Part ${t.part}): ${t.topic}`).join('\n')}

Generate exactly ${questionCount} standalone multiple-choice questions simulating a real IRS SEE exam.
Each question stands alone — no shared scenario. Embed a brief 2-4 sentence client situation in the question when needed.
Draw questions evenly across all completed topics. Use all four question types:
- direct: "What is the maximum..."
- incomplete: "The deduction for X is ________."
- except: "All of the following are required EXCEPT:"
- scenario: A 2-4 sentence client fact pattern in the question itself

IMPORTANT INSTRUCTIONS ON DEPTH AND DETAIL:
- Each question should test a distinct, substantive concept — not surface-level recall.
- Scenario-type questions should include specific client details, dollar amounts, and realistic situations.
- The "explanation" field must be COMPREHENSIVE (4-8 sentences): cite the applicable rule/IRC section, show the complete reasoning or calculation, and explain why EACH wrong option is wrong and what specific mistake it represents.
- Cover as many different subtopics as possible across the ${questionCount} questions.

Rules for ALL questions:
- All 4 options must be plausible with real ${TAX_YEAR} figures and rules
- Exactly ONE option must be correct
- Wrong options represent common mistakes or traps, not obviously wrong answers
- Include specific ${TAX_YEAR} thresholds, form numbers, and percentages where relevant
- Do NOT repeat topics — spread questions across all completed topics

MANDATORY WORKFLOW — follow this order for EVERY question, no exceptions:
  STEP 1 — COMPUTE FIRST: Before writing any answer options, calculate the correct answer.
           Show every arithmetic step in the "calc" field (e.g. "55900*0.9235=51624.65; 51624.65*0.153=7898.57≈7899").
           For non-calculation questions write "calc": "N/A".
  STEP 2 — BUILD OPTIONS: Write options A, B, C, D. One option MUST be the exact number from Step 1.
           The other three options are plausible wrong answers (wrong rate, missed deduction, etc.).
  STEP 3 — SET CORRECT: Set "correct" to whichever letter holds the Step 1 result.
  STEP 4 — FINAL CHECK: Re-read the option you marked correct and confirm it matches Step 1 exactly.
           If it does not match, fix that option's text — never change the answer to fit a wrong option.

Return ONLY a valid JSON object (no markdown, no explanation outside JSON):
{
  "questions": [
    {
      "id": 1,
      "type": "direct|incomplete|except|scenario",
      "calc": "Show every arithmetic step before the options. E.g. '55900*0.9235=51624.65; 51624.65*0.153=7898.57≈7899'. Write N/A for non-calculation questions.",
      "question": "Question text...",
      "options": {
        "A": "option text",
        "B": "option text",
        "C": "option text",
        "D": "option text"
      },
      "correct": "A|B|C|D",
      "explanation": "COMPREHENSIVE explanation (4-8 sentences): state the applicable rule/IRC section, show the complete correct reasoning or calculation, then explain why each wrong option is wrong and what specific mistake each represents"
    }
  ]
}
`.trim();

export const ANKI_CARDS_PROMPT = (topic: string, wrongQuestions: string[], studyNotes: string) => `
You are creating Anki flashcards for IRS SEE exam prep.

Tax Year: **${TAX_YEAR}** — All dollar amounts, limits, and thresholds must reflect ${TAX_YEAR} figures.

Topic: **${topic}**
${wrongQuestions.length > 0 ? `\nQuestions the student got wrong:\n${wrongQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}
${studyNotes ? `\nStudent's study notes:\n${studyNotes}` : ''}

Generate 8-12 Anki flashcards targeting:
1. ${TAX_YEAR} rules, thresholds, and percentages the student struggled with
2. Exception patterns — when does the general rule NOT apply?
3. Key form numbers, their purposes, and when they are required
4. Common exam traps from this topic and how to avoid them
5. Phase-out ranges and income limits with specific ${TAX_YEAR} amounts
6. Calculation formulas and step-by-step methods

IMPORTANT: Each card's ANSWER should be DETAILED (2-4 sentences), not just a single number or phrase. Include the rule, the specific ${TAX_YEAR} amount, any relevant exceptions, and a brief explanation of WHY. The goal is that reading the answer teaches the student the concept, not just reminds them of a fact.

Each card should be a precise, testable fact — not a broad concept. Always include the tax year in the question when referencing a specific amount.

Return ONLY a valid JSON array (no markdown):
[
  {
    "question": "Short, specific question (e.g., 'What is the ${TAX_YEAR} standard deduction for MFJ?')",
    "answer": "Detailed answer with ${TAX_YEAR} figures, the applicable rule, exceptions, and any exam tips (e.g., '$30,000. This increases by $1,600 per spouse age 65+ or blind ($1,300 if not married). Note: If either spouse can be claimed as a dependent, the standard deduction may be limited.')"
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
