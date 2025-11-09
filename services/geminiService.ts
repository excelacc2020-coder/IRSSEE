import { GoogleGenAI, Type } from "@google/genai";
import type { Lesson, LessonProgress, EvaluationResult, MockQuestion } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const scenarioSchema = {
    type: Type.OBJECT,
    properties: {
        scenario: {
            type: Type.STRING,
            description: 'The detailed, practical tax scenario containing the client case and facts.'
        },
        question: {
            type: Type.STRING,
            description: 'A precise and complex question for the student to answer based on the scenario.'
        }
    },
    required: ['scenario', 'question'],
};

export async function generateScenario(lesson: Lesson, passedLessons: LessonProgress[], previousScenario: string | null = null, isTwist: boolean = false): Promise<{ scenario: string; question: string }> {
    const passedTopics = passedLessons.length > 0 ? passedLessons.map(l => l.topic).join(', ') : 'None yet';

    let prompt = `You are an expert curriculum designer for the US IRS Special Enrollment Examination (SEE).
Your task is to create a concise, practical, real-world tax scenario for a tax professional to solve, along with a specific question.

**Today's Topic:** ${lesson.topic} - ${lesson.description}
**Relevant IRS Part:** ${lesson.part}
**Topics Previously Mastered by Student:** ${passedTopics}

**Instructions:**
1.  Create a single, detailed, practical tax scenario framed as a real-world client case.
2.  The scenario must directly test the student's knowledge of today's topic.
3.  Where appropriate, subtly incorporate elements from the "Topics Previously Mastered" to ensure knowledge retention. The complexity of the scenario and question should increase as more topics are mastered.
4.  The scenario should be rich with details but presented concisely.
5.  Based on the scenario, formulate a single, precise, and complex question for the student to answer. The question should require a detailed analysis, not just a simple yes/no or numerical answer.
6.  **DO NOT** provide any hints or solutions in your response.
`;

    if (isTwist && previousScenario) {
        prompt += `
**This is a "Twist" Scenario:**
The student has already solved a previous scenario on this topic. Your task is to modify the previous scenario by changing a few key facts to test their understanding from a different angle.
-   **Previous Scenario:** "${previousScenario}"
-   **Your Task:** Create a new scenario and a new question that is a logical variation of the previous one. Do not simply repeat it. Introduce a new element or change a critical number or condition.
`;
    }

    prompt += "\nRespond ONLY with a valid JSON object that adheres to the defined schema.";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            temperature: 1.0,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
            responseSchema: scenarioSchema,
        }
    });

    const responseText = response.text;
    if (!responseText) {
        console.error("AI response for generateScenario was empty. Full response:", response);
         if (response.candidates && response.candidates.length > 0) {
            console.error("Candidate finish reason:", response.candidates[0].finishReason);
        }
        throw new Error("Failed to generate scenario: The AI returned an empty response, possibly due to content filters.");
    }
    
    try {
        const jsonString = responseText.trim().replace(/^```json\s*|```$/g, '');
        const parsedJson = JSON.parse(jsonString);
        if (parsedJson.scenario && typeof parsedJson.scenario === 'string' && parsedJson.question && typeof parsedJson.question === 'string') {
            return { scenario: parsedJson.scenario, question: parsedJson.question };
        } else {
            console.error("Generated JSON for scenario is missing or has the wrong type for 'scenario' or 'question' keys.", parsedJson);
            throw new Error("Failed to generate scenario: AI response was malformed.");
        }
    } catch (e) {
        console.error("Failed to parse JSON from AI for scenario generation.", responseText, e);
        throw new Error("Failed to generate scenario: The AI returned an invalid JSON response.");
    }
}

export async function getIrsReferences(lesson: Lesson): Promise<{title: string; uri: string}[]> {
    const query = `Find official IRS publications, forms, and articles for the tax topic: "${lesson.topic} - ${lesson.description}". Prioritize .gov websites.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            return chunks
              .filter(chunk => chunk.web)
              .map(chunk => ({ title: chunk.web.title, uri: chunk.web.uri }))
              .filter(ref => ref.uri && ref.title);
        }
        return [];
    } catch (error) {
        console.error("Error fetching IRS references:", error);
        return [];
    }
}


const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        totalScore: { type: Type.INTEGER },
        scores: {
            type: Type.OBJECT,
            properties: {
                rules: { type: Type.INTEGER },
                calculations: { type: Type.INTEGER },
                compliance: { type: Type.INTEGER },
                alternatives: { type: Type.INTEGER },
                planning: { type: Type.INTEGER },
                clarity: { type: Type.INTEGER },
            },
        },
        feedback: {
            type: Type.OBJECT,
            properties: {
                good: { type: Type.ARRAY, items: { type: Type.STRING } },
                corrections: { type: Type.ARRAY, items: { type: Type.STRING } },
                takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        knowledgePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        detailedExplanation: { 
            type: Type.STRING,
            description: 'A detailed explanation of the correct answer and reasoning, provided ONLY if the total score is below 90. Otherwise, this should be an empty string.'
        },
    },
    required: ['totalScore', 'scores', 'feedback', 'knowledgePoints', 'detailedExplanation']
};


export async function evaluateAnswer(scenario: string, answer: string, passedLessons: LessonProgress[]): Promise<EvaluationResult> {
    const passedTopics = passedLessons.length > 0 ? passedLessons.map(l => l.topic).join(', ') : 'None';

    const prompt = `You are an expert tax law instructor and grader for the US IRS Special Enrollment Examination (SEE). Your task is to evaluate a user's answer to a given tax scenario with a focus on providing clear, actionable feedback for improvement.

**Context:**
- **Scenario:** "${scenario}"
- **User's Answer:** "${answer}"
- **Previously Mastered Topics:** ${passedTopics}

**Grading Rubric:**
You MUST evaluate the user's answer based on the following rubric and provide a score for each category. The total score must be the sum of the category scores, out of 100.
1.  **Applicable Rules & Authority (30 points):** Correctly identify and apply relevant IRC sections, regulations, and IRS guidance.
2.  **Calculations (30 points):** Accurate calculations with clear work shown.
3.  **Compliance & Documentation (15 points):** Mention correct forms, schedules, deadlines, and record-keeping.
4.  **Alternatives & Elections (10 points):** Consider and explain valid alternatives or elections.
5.  **Planning Strategies & Pitfalls (10 points):** Identify tax planning opportunities or common errors.
6.  **Clarity/Structure (5 points):** Well-organized, clear, and professional answer.

**Your Task:**
1.  Analyze the user's answer against the scenario and the rubric.
2.  Provide brief, high-yield, bullet-point feedback.
    - "What you did well": 2-3 bullet points.
    - "Corrections": Be very specific. For each point, state what was wrong in the user's answer and briefly explain the correct approach. For example: "You incorrectly calculated the home office deduction; the correct method is...".
    - "Key takeaways": 2-3 high-level summary points.
3.  If the total score is **less than 90**:
    a.  Provide a "summarized set of knowledge points" as short, high-yield bullets on the core concepts the user missed.
    b.  Provide a **\`detailedExplanation\`**. This explanation should clearly outline the complete, correct answer to the scenario's question. It should walk through the applicable rules, calculations, and compliance steps methodically, explaining *why* this is the correct approach. This is the "model answer" the student should study.
4.  If the total score is **90 or above**:
    a.  The \`knowledgePoints\` array MUST be empty.
    b.  The \`detailedExplanation\` string MUST be empty.
5.  Respond ONLY with a valid JSON object that adheres to the defined schema.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: evaluationSchema,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 32768 }
        },
    });

    const responseText = response.text;
    if (!responseText) {
        console.error("AI response for evaluateAnswer was empty.", { response });
        throw new Error("Failed to evaluate answer: The AI returned an empty response.");
    }
    const jsonString = responseText.trim();
    return JSON.parse(jsonString) as EvaluationResult;
}

const mockExamSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: {
                type: Type.OBJECT,
                properties: {
                    A: { type: Type.STRING },
                    B: { type: Type.STRING },
                    C: { type: Type.STRING },
                    D: { type: Type.STRING },
                },
                required: ['A', 'B', 'C', 'D'],
            },
            correctAnswer: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
            topic: { type: Type.STRING, description: "The specific topic from the lesson plan this question covers." },
        },
        required: ['question', 'options', 'correctAnswer', 'topic'],
    },
};


export async function generateMockExamQuestions(passedLessons: LessonProgress[]): Promise<MockQuestion[]> {
    const passedTopics = passedLessons.map(l => `- ${l.topic}: ${l.description}`).join('\n');
    const questionCount = Math.max(5, Math.min(15, Math.floor(passedLessons.length / 2)));

    const prompt = `You are an expert curriculum designer for the US IRS Special Enrollment Examination (SEE).
Your task is to create a mock exam consisting of ${questionCount} multiple-choice questions.

**Topics Mastered by Student:**
${passedTopics}

**Instructions:**
1.  Generate exactly ${questionCount} distinct multiple-choice questions.
2.  The questions must be based on a random, representative sample of the "Topics Mastered by Student" provided above.
3.  Each question must have four options: A, B, C, and D.
4.  For each question, clearly indicate the correct answer ('A', 'B', 'C', or 'D').
5.  The difficulty should be appropriate for a final review exam.
6.  For each question, specify the topic it relates to from the provided list.
7.  Respond ONLY with a valid JSON object that adheres to the defined schema (an array of question objects).
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: mockExamSchema,
            temperature: 0.8,
        },
    });

    const responseText = response.text;
    if (!responseText) {
        console.error("AI response for generateMockExamQuestions was empty.", { response });
        throw new Error("Failed to generate mock exam: The AI returned an empty response.");
    }
    const jsonString = responseText.trim();
    try {
        const parsed = JSON.parse(jsonString);
        return parsed as MockQuestion[];
    } catch (e) {
        console.error("Failed to parse JSON from AI for mock exam generation.", responseText, e);
        throw new Error("Failed to generate mock exam: The AI returned an invalid JSON response.");
    }
}