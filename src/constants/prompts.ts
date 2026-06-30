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
          "form": ["Bullet 1 MUST detail: The IRS required sources through which a tax preparer shall confirm the amount to be included while preparing tax returns/filing", "Bullet 2 MUST detail: The supplemental forms/schedules where the amounts and information are to be recorded and attached while filing tax returns", "Bullet 3 — any additional form details"],
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

export const MIND_MAP_PROMPT = (topic: string, part: number, morningBrief: string) => `
You are an EA exam tutor preparing a student for the IRS SEE exam Part ${part}. The student provides a "Morning Brief" containing their study notes on a tax topic. Your job is to analyze the rules in those notes and produce structured visual outputs that make the rules stick.

Tax Year: **${TAX_YEAR}** — All thresholds, limits, and figures must reflect tax year ${TAX_YEAR}.

TOPIC: ${topic}

MORNING BRIEF (the student's study notes — analyze ONLY what is here):
${morningBrief}

━━━ STEP 1: RULE ANATOMY SCAN ━━━
Read every rule in the Morning Brief and classify each into exactly one of three types:
- GATE RULE: a yes/no eligibility check. Binary; determines whether the taxpayer proceeds or is disqualified (e.g., "under age 17 at year end," "must have valid SSN," "must not be claimed by another person").
- MATH CHAIN RULE: a calculation where one number feeds the next step. No branching, only arithmetic (e.g., "$50 reduction per $1,000 over threshold," "15% of earned income above $2,500," "lesser of X, Y, or Z").
- PARALLEL RULE: a rule that exists in two or more related topics with different values on the same dimension (e.g., CTC age cutoff is 17 but dependency age is 19; CTC requires SSN but ODC accepts ITIN).
Do not skip any rule from the Morning Brief. If a rule could be two types, pick its primary function. Attach the exact numbers to each rule.

Then decide the OUTPUT PLAN. A topic may need all three, two, or one:
- Include "Decision Tree" only if gate rules exist.
- Include "Calculation Flow" only if math chain rules exist.
- Include "Comparison Grid" only if parallel rules exist (or the Brief references related topics like ODC/EITC to compare).

━━━ STEP 2: DECISION TREES (only if gate rules exist) ━━━
Produce a SEPARATE decision tree for each distinct credit, filing status, or eligibility TEST in the brief — do not chain unrelated processes into one tree. For example, "Filing Status & Dependents" yields separate trees for Head of Household, Qualifying Child, and Qualifying Relative. Give each tree a short title naming what it resolves.
Within each tree: each gate is one yes/no question in a short phrase (under 8 words). "Yes" = PASS, flow to the next gate. "No" = FAIL, exit to a consequence ("Does not qualify," "Check [alternative]," or "Apply tiebreakers"). Order gates as a preparer checks them (fastest disqualifier first). Show tiebreaker rules as a sub-branch from the relevant gate. The success outcome states the credit/deduction amount.
CRITICAL: every gate rule listed in the Rule Anatomy Scan must appear as a gate in exactly one of these trees. Do not drop any gate rule.

━━━ STEP 3: CALCULATION FLOWS (only if math chain rules exist) ━━━
Produce a SEPARATE calculation flow for each distinct amount being computed (e.g., the refundable portion vs. the phase-out reduction are separate flows). Give each a short title. Within each flow, each step shows one arithmetic operation with the exact formula and all threshold numbers; the output of step N feeds step N+1. Where math branches on a condition, attach a decision with both paths. Include every cap, floor, percentage, and dollar limit at the step where it applies. The final result names where it gets reported (form/line if in the Brief).
CRITICAL: every math-chain rule from the Rule Anatomy Scan must appear in one of these flows.

━━━ STEP 4: COMPARISON GRID (only if parallel rules exist) ━━━
Rows are shared dimensions (age test, income limit, refundability, credit amount, SSN/ITIN, relationship test, forms, phase-out, etc.). Columns are the related credits/rules. Each cell is the specific value for that credit on that dimension. If a dimension is identical across all columns, still include it with value "Same". Prioritize rows where values diverge — those are the exam traps.

RULES FOR ALL OUTPUTS:
- Never invent rules not in the Morning Brief; never skip a rule that IS in it.
- Every number from the Morning Brief must appear in at least one output.
- If the Brief references related topics (e.g., ODC, EITC), include them as Comparison Grid columns.
- Keep all labels short and scannable.

Return ONLY a valid JSON object (no markdown, no prose outside JSON). Omit decisionTrees / calculationFlows / comparisonGrid entirely if that output type is not in the Output Plan. "decisionTrees" and "calculationFlows" are ARRAYS — include one entry per distinct process/calculation.
{
  "scan": {
    "gateRules": [{"rule": "short rule label", "numbers": "exact numbers/threshold, or empty string"}],
    "mathChainRules": [{"rule": "short rule label", "numbers": "exact numbers"}],
    "parallelRules": [{"rule": "short rule label", "numbers": "the differing values"}],
    "outputPlan": ["Decision Tree", "Calculation Flow", "Comparison Grid"]
  },
  "decisionTrees": [
    {
      "title": "What this tree resolves (e.g., Head of Household)",
      "start": "What is being tested",
      "gates": [
        {"question": "Short yes/no question (< 8 words)", "failOutcome": "What happens on No"}
      ],
      "success": "Success outcome with dollar amount",
      "tiebreakers": [
        {"fromGate": 3, "rules": ["First tiebreaker", "Second tiebreaker", "Third tiebreaker"]}
      ]
    }
  ],
  "calculationFlows": [
    {
      "title": "What this flow computes (e.g., Refundable portion)",
      "steps": [
        {"label": "What you calculate", "formula": "exact formula with all numbers", "result": "what this produces", "decision": {"condition": "condition with threshold", "yes": "path if true", "no": "path if false"}}
      ],
      "final": "End result + form/line reference"
    }
  ],
  "comparisonGrid": {
    "columns": ["Credit/Rule A", "Credit/Rule B", "Credit/Rule C"],
    "rows": [
      {"dimension": "Age test", "values": ["value for A", "value for B", "value for C"]}
    ]
  }
}
The "decision" field on a calculation step is optional — include it only on steps where the math actually branches. The "tiebreakers" field is optional — include it only if tiebreaker rules exist.
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

export const STORY_PROMPT = (topic: string, part: number) => `
You are a tax tutor preparing a student for the US Enrolled Agent (EA) exam (SEE Part ${part}). The student learns best through vivid, realistic client stories that embed every rule, threshold, and edge case into the narrative.

Tax Year: **${TAX_YEAR}** — Every threshold, dollar amount, percentage, age limit, and income limit must use ${TAX_YEAR} figures.

Your task: For the topic below, create a single continuous story that covers every testable aspect of that topic.

Topic: **${topic}**

Story rules:
- Use realistic American client names and authentic US tax situations (W-2 jobs, 1099 income, divorces, dependents, retirement accounts, small businesses, etc.) so the scenarios mirror what actually appears on the US EA exam. Make the characters relatable and memorable.
- Structure the story as a client walking into a tax preparer's office. The preparer works through the situation step by step, discovering complications, running calculations out loud, and hitting edge cases along the way.
- Every threshold number, dollar amount, percentage, age limit, and income limit must appear naturally inside the story through actual calculations the preparer performs. Never list rules in bullet points. The math should happen inside the conversation between preparer and client.
- Build in at least 2-3 twists. Examples: a second person shows up claiming the same benefit, the client's situation changes mid-story revealing a different rule, or the client has a family member who almost qualifies but fails one test. These twists teach the edge cases.
- Include a "what if" alternate version of the same client somewhere in the story. Change one variable (income level, filing status, number of dependents) and rework the math so the student sees how the same rules produce different outcomes.
- Every tiebreaker rule, exception, and disqualification must surface through a character failing or nearly failing a test. Don't explain rules abstractly. Show a character hitting the wall.
- Divide the story into 3-5 short titled sections, each covering ONE sub-aspect of the topic (for example: an eligibility test, a phase-out, a refundable portion, an exception). Put each section's title on its own line wrapped in Markdown bold, e.g. **The Phase-Out Wall**. Within each section write flowing narrative prose — no bullet points, no numbered lists, no tables. The sections together must still read as ONE continuous story with the same characters carried through.
- Give the story a short, memorable name (5-8 words max) that captures the central conflict or twist. This name acts as a mental bookmark that pulls back the entire story when recalled.

End with a section whose title line is **Test Yourself**, containing exactly 3 multiple-choice questions (4 options each, labeled A-D), followed by a worked solution after each showing the exact calculation steps.
CRITICAL rules for these questions:
- They must be BRAND-NEW "if-then" scenarios that change one or more variables from the story (a different income, age, filing status, number of dependents, or timing) and ask what happens under the new facts.
- They must NOT re-ask, restate, or reuse any question, number, or outcome the preparer already worked out in the narrative. If the story already computed an answer, do not ask it again — invent a new variation that forces the student to re-apply the rule to different numbers.
- Phrase each as an if-then variation, e.g. "If [character]'s AGI had been $X instead of $Y, then the credit would be ______?"

Format:
- Story name on the very first line in bold (use Markdown: **Story Name**)
- Then the 3-5 titled sections in flowing prose, each introduced by its own bold title line
- Finally the **Test Yourself** section with the 3 new if-then MCQs and their worked solutions

What NOT to do:
- Do not summarize rules before or after the story
- Do not use bullet points or numbered lists inside the narrative prose (section title lines are allowed and required)
- Do not skip any calculable number by saying "the credit reduces" without showing exact math
- Do not create characters who qualify cleanly with no complications. Every character should test at least one boundary.
- Do not make the Test Yourself questions duplicates of anything already solved in the story — they must use new variable values.

Return ONLY the story as Markdown text. No JSON, no preamble, no closing commentary.
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
