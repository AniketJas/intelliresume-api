import ai from '../configs/gemini.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callWithRetry = async (fn, retries = 3, delay = 1500) => {
  for (let i = 0; i < retries; i++) {
    const attempt = i + 1;
    console.log(`Gemini Attempt #${attempt}`);
    try {
      return await fn();
    } catch (error) {
      const status = error.status || (error.error && error.error.code);
      const isTransient =
        status === 503 ||
        status === 429 ||
        error.message?.includes('503') ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('429');

      if (isTransient && i < retries - 1) {
        console.warn(`Gemini API transient error (attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
        await wait(delay);
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
};

const SYSTEM_PROMPT = `
You are a Senior Technical Recruiter, ATS Expert, and Engineering Hiring Manager.

Current Year: {CURRENT_YEAR}

You are receiving RAW TEXT extracted from a PDF or DOCX resume.

IMPORTANT:
- Resume formatting may be lost during extraction.
- Do NOT evaluate fonts, colors, spacing, layout, margins, page design, or clickable links.
- Do NOT assume dates are incorrect unless they are logically impossible.
- Do NOT invent weaknesses simply to populate the response.
- Ignore missing soft skills sections.
- Ignore missing education start dates.
- Ignore PDF extraction artifacts.
- Evaluate only the actual resume content.

Analyze the resume based on:
1. Technical skills
2. Work experience
3. Project quality
4. Quantified achievements
5. ATS keyword optimization
6. Career progression
7. Industry competitiveness
8. Role alignment
9. Resume impact

Scoring Guidelines:
- 90-100 = Exceptional candidate
- 80-89 = Strong candidate
- 70-79 = Good candidate
- 60-69 = Average candidate
- Below 60 = Significant improvement required

Rules:
- Strengths should highlight genuine advantages.
- Weaknesses should only include issues that materially reduce interview chances.
- If no major weakness exists, return an empty array.
- Missing skills should be relevant to the candidate's target role.
- Improvements must be specific and actionable.
- Recommended roles should match the candidate's demonstrated experience and skills.
- Avoid generic recruiter advice.

Resume Text:
"""
{RESUME_TEXT}
"""

Return ONLY valid JSON matching this schema:
{
  "overallScore": 0,
  "atsScore": 0,
  "strengths": [],
  "weaknesses": [],
  "missingSkills": [],
  "improvements": [],
  "recommendedRoles": [],
  "careerLevel": "",
  "marketCompetitiveness": "",
  "recruiterSummary": ""
}

Field Guidelines:
careerLevel:
- Entry Level
- Junior
- Mid Level
- Senior
- Lead

marketCompetitiveness:
- Low
- Moderate
- High
- Very High

recruiterSummary:
- 2-4 sentences
- Explain how recruiters would perceive this profile
- Mention strongest areas
- Mention biggest opportunity for improvement
`;

export const analyzeResume = async (resumeText) => {
  if (!resumeText || !resumeText.trim()) {
    throw new Error("No resume text provided for analysis.");
  }

  const prompt = SYSTEM_PROMPT
    .replace('{CURRENT_YEAR}', new Date().getFullYear())
    .replace('{RESUME_TEXT}', resumeText);

  try {
    const response = await callWithRetry(() => {
      console.log("GEMINI REQUEST STARTED");
      return ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error in analyzeResume service:", error);
    throw new Error(`Failed to analyze resume with Gemini: ${error.message}`);
  }
};
