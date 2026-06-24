import Groq from "groq-sdk"
import { NextResponse } from "next/server"
import { appendFile, mkdir } from "node:fs/promises"
import path from "node:path"
import {
  GenerateResumePayload,
  GeneratedResume,
  ResumeTokenUsage,
  generateResumeFromJob,
  payloadToProfile,
} from "@/lib/resume-generator"

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-20b",
] as const

const MAX_OUTPUT_TOKENS = 1400
const SYSTEM_PROMPT = "You write truthful ATS resumes and return valid JSON only."

type GroqCompletionUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

type ResumeTokenUsageLogEntry = ResumeTokenUsage & {
  timestamp: string
  targetRole: string
  jobDescriptionChars: number
}

type ResumeGenerationRunLogEntry = {
  timestamp: string
  source: "groq"
  provider: "groq"
  model: string
  apiKeyIndex: number
  targetRole: string
  jobDescriptionChars: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  input: {
    systemPrompt: string
    userPrompt: string
  }
  output: {
    rawContent: string
    parsedJson: Partial<GeneratedResume>
  }
}

function buildLocalFallback(payload: GenerateResumePayload): GeneratedResume {
  return generateResumeFromJob({
    profile: payloadToProfile(payload),
    jobDescription: payload.jobDescription,
    template: payload.template || "modern",
    tone: payload.tone || "professional",
    experienceLevel: payload.experienceLevel || "mid",
    length: payload.length || "medium",
  })
}

function truncateText(value: string, maxLength = 6000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}\n[Job description truncated for token limits]` : value
}

function buildPrompt(payload: GenerateResumePayload, fallback: GeneratedResume) {
  return `
Create a concise, one-page ATS resume tailored to the job.

Rules:
- Use only truthful candidate data. Do not invent companies, degrees, dates, metrics, certifications, or work experience.
- If the job starts with PROFILE_ONLY_RESUME_REQUEST, make a strong general resume from the profile.
- Rewrite bullets professionally, select 2-3 relevant projects, and add ATS keywords naturally.
- Return 3-4 bullets for the main experience and each selected project when supported by profile data.
- For software, AI, LLM, web, startup, API, or automation roles, emphasize supported software/product/automation work.
- Return changeHighlights explaining the main edits made compared with the candidate profile/job input.
- Use plain ATS formatting only. No tables, columns, icons, markdown fences, or extra commentary.
- Return valid JSON only.

Return this exact JSON shape:
{
  "resume": "Full final resume as ATS-friendly plain text with sections",
  "atsScore": 0,
  "matchSummary": "Short explanation of how well the resume matches the job",
  "matchedKeywords": ["keyword"],
  "missingKeywords": ["keyword"],
  "changeHighlights": ["Specific change made to tailor the resume"],
  "suggestions": ["suggestion"],
  "selectedAchievements": ["achievement"],
  "tailoredSkills": ["skill"],
  "selectedExperience": [
    {
      "id": "existing experience id",
      "company": "existing company",
      "position": "existing position",
      "location": "existing location",
      "startDate": "existing start date",
      "endDate": "existing end date",
      "description": ["rewritten truthful bullet point"]
    }
  ],
  "selectedProjects": [
    {
      "id": "existing project id if available",
      "name": "project name",
      "description": "project description",
      "technologies": ["technology"],
      "link": "project link",
      "highlights": ["tailored truthful project bullet"]
    }
  ],
  "improvedSummary": "Improved professional summary"
}

Candidate data:
${JSON.stringify({
  personalInfo: payload.personalInfo,
  professionalSummary: payload.professionalSummary,
  education: payload.education,
  workExperience: payload.workExperience,
  projects: payload.projects,
  skills: payload.skills,
  achievements: payload.achievements,
  certifications: payload.certifications,
  pastResumeDetails: payload.pastResumeDetails || "",
})}

Target role:
${payload.targetRole || fallback.jobTitle}

Job description:
${truncateText(payload.jobDescription)}
`
}

function extractJsonObject(content: string) {
  const trimmed = content.trim()
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed

  const firstBrace = trimmed.indexOf("{")
  const lastBrace = trimmed.lastIndexOf("}")
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return "{}"
}

function parseGroqJson(content: string) {
  try {
    return JSON.parse(extractJsonObject(content)) as Partial<GeneratedResume>
  } catch {
    return {}
  }
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback
}

function normalizeProjects(value: Partial<GeneratedResume>["selectedProjects"], fallback: GeneratedResume) {
  const selected = Array.isArray(value) && value.length ? value : fallback.selectedProjects
  const merged = [...selected]

  for (const project of fallback.selectedProjects) {
    const alreadyAdded = merged.some((item) => item.id === project.id || item.name === project.name)
    if (!alreadyAdded) merged.push(project)
    if (merged.length >= 3) break
  }

  return merged.slice(0, 3).map((project) => {
    const fallbackProject = fallback.selectedProjects.find((item) => item.id === project.id || item.name === project.name)
    const highlights = Array.isArray(project.highlights) && project.highlights.length ? project.highlights : fallbackProject?.highlights || []

    return {
      ...fallbackProject,
      ...project,
      technologies: Array.isArray(project.technologies) && project.technologies.length ? project.technologies : fallbackProject?.technologies || [],
      highlights: Array.from(new Set([...highlights, ...(fallbackProject?.highlights || [])])).slice(0, 4),
    }
  })
}

function normalizeGroqResume(value: Partial<GeneratedResume>, fallback: GeneratedResume, modelUsed: string): GeneratedResume {
  const selectedAchievements = normalizeStringArray(value.selectedAchievements, fallback.selectedAchievements)

  return {
    ...fallback,
    resume: typeof value.resume === "string" && value.resume.trim() ? value.resume : fallback.resume,
    atsScore: typeof value.atsScore === "number" ? Math.max(0, Math.min(100, value.atsScore)) : fallback.atsScore,
    matchSummary: typeof value.matchSummary === "string" && value.matchSummary.trim() ? value.matchSummary : fallback.matchSummary,
    matchedKeywords: normalizeStringArray(value.matchedKeywords, fallback.matchedKeywords),
    missingKeywords: normalizeStringArray(value.missingKeywords, fallback.missingKeywords),
    changeHighlights: normalizeStringArray(value.changeHighlights, fallback.changeHighlights),
    suggestions: normalizeStringArray(value.suggestions, fallback.suggestions),
    selectedAchievements: Array.from(new Set([...selectedAchievements, ...fallback.selectedAchievements])).slice(0, 5),
    tailoredSkills: normalizeStringArray(value.tailoredSkills, fallback.tailoredSkills),
    selectedExperience: Array.isArray(value.selectedExperience) && value.selectedExperience.length ? value.selectedExperience : fallback.selectedExperience,
    selectedProjects: normalizeProjects(value.selectedProjects, fallback),
    improvedSummary: typeof value.improvedSummary === "string" && value.improvedSummary.trim() ? value.improvedSummary : fallback.improvedSummary,
    summary: typeof value.improvedSummary === "string" && value.improvedSummary.trim() ? value.improvedSummary : fallback.summary,
    keywordsAdded: normalizeStringArray(value.matchedKeywords, fallback.keywordsAdded),
    modelUsed,
    generatedAt: new Date().toISOString(),
  }
}

function getGroqErrorDetails(error: unknown) {
  const maybeError = error as {
    status?: number
    code?: string
    error?: { code?: string }
    message?: string
  }

  return {
    status: maybeError.status,
    code: maybeError.code || maybeError.error?.code,
    message: maybeError.message || "Groq request failed",
  }
}

function isRateLimitError(error: unknown) {
  const details = getGroqErrorDetails(error)
  return details.status === 429 || details.code === "rate_limit_exceeded"
}

function getGroqApiKeys() {
  const keys = [
    process.env.GROQ_API_KEY,
    ...(process.env.GROQ_API_KEYS || "").split(","),
    process.env.GROQ_API_KEY_2,
  ]
    .map((key) => key?.trim())
    .filter((key): key is string => Boolean(key && key !== "your_groq_api_key_here"))

  return Array.from(new Set(keys))
}

function getTokenUsage(completion: { usage?: GroqCompletionUsage }, model: string, apiKeyIndex: number): ResumeTokenUsage | undefined {
  const usage = completion.usage
  if (!usage) return undefined

  return {
    provider: "groq",
    model,
    apiKeyIndex,
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || 0,
  }
}

async function appendJsonLine(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8")
}

async function saveGenerationRunLog({
  tokenUsage,
  payload,
  fallback,
  systemPrompt,
  userPrompt,
  rawContent,
  parsedJson,
}: {
  tokenUsage: ResumeTokenUsage | undefined
  payload: GenerateResumePayload
  fallback: GeneratedResume
  systemPrompt: string
  userPrompt: string
  rawContent: string
  parsedJson: Partial<GeneratedResume>
}) {
  if (!tokenUsage) {
    console.info("[resume-generation] token usage unavailable")
    return
  }

  console.info("[resume-generation] token usage", tokenUsage)
  const timestamp = new Date().toISOString()
  const targetRole = payload.targetRole || fallback.jobTitle
  const jobDescriptionChars = payload.jobDescription.length
  const tokenLogEntry: ResumeTokenUsageLogEntry = {
    ...tokenUsage,
    timestamp,
    targetRole,
    jobDescriptionChars,
  }
  const runLogEntry: ResumeGenerationRunLogEntry = {
    timestamp,
    source: "groq",
    provider: "groq",
    model: tokenUsage.model,
    apiKeyIndex: tokenUsage.apiKeyIndex,
    targetRole,
    jobDescriptionChars,
    inputTokens: tokenUsage.promptTokens,
    outputTokens: tokenUsage.completionTokens,
    totalTokens: tokenUsage.totalTokens,
    input: {
      systemPrompt,
      userPrompt,
    },
    output: {
      rawContent,
      parsedJson,
    },
  }

  try {
    await appendJsonLine(path.join(process.cwd(), "logs", "resume-token-usage.jsonl"), tokenLogEntry)
    await appendJsonLine(path.join(process.cwd(), "logs", "resume-generation-runs.jsonl"), runLogEntry)
  } catch (error) {
    console.warn("[resume-generation] failed to save generation log", error)
  }
}

export async function POST(request: Request) {
  let payload: GenerateResumePayload

  try {
    payload = (await request.json()) as GenerateResumePayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 })
  }

  if (!payload.jobDescription?.trim()) {
    return NextResponse.json({ error: "jobDescription is required" }, { status: 400 })
  }

  const fallback = buildLocalFallback(payload)

  const apiKeys = getGroqApiKeys()
  const groqEnabled = process.env.GROQ_API_ENABLED !== "false"

  if (!groqEnabled) {
    return NextResponse.json({
      resume: fallback,
      source: "local",
      warning: "Groq API is disabled. Used local generator fallback.",
    })
  }

  if (!apiKeys.length) {
    return NextResponse.json({
      resume: fallback,
      source: "local",
      warning: "GROQ_API_KEY is not configured. Used local generator fallback.",
    })
  }

  try {
    let lastRateLimitMessage = ""

    for (const [apiKeyIndex, apiKey] of apiKeys.entries()) {
      const groq = new Groq({ apiKey })

      for (const groqModel of GROQ_MODELS) {
        try {
          const userPrompt = buildPrompt(payload, fallback)
          const completion = await groq.chat.completions.create({
            model: groqModel,
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
            temperature: 0.35,
            max_tokens: MAX_OUTPUT_TOKENS,
            response_format: { type: "json_object" },
          })

          const tokenUsage = getTokenUsage(completion, groqModel, apiKeyIndex + 1)
          const content = completion.choices[0]?.message?.content || "{}"
          const parsed = parseGroqJson(content)
          await saveGenerationRunLog({
            tokenUsage,
            payload,
            fallback,
            systemPrompt: SYSTEM_PROMPT,
            userPrompt,
            rawContent: content,
            parsedJson: parsed,
          })
          const resume = normalizeGroqResume(parsed, fallback, groqModel)

          return NextResponse.json({
            resume,
            source: "groq",
            modelUsed: groqModel,
            tokenUsage,
          })
        } catch (error) {
          if (isRateLimitError(error)) {
            lastRateLimitMessage = getGroqErrorDetails(error).message
            continue
          }

          throw error
        }
      }
    }

    return NextResponse.json({
      resume: fallback,
      source: "local",
      warning: lastRateLimitMessage
        ? `Groq rate limit reached. Used local generator fallback. ${lastRateLimitMessage}`
        : "Groq rate limit reached. Used local generator fallback.",
    })
  } catch (error) {
    return NextResponse.json({
      resume: fallback,
      source: "local",
      warning: error instanceof Error ? `Groq failed: ${error.message}` : "Groq failed. Used local generator fallback.",
    })
  }
}
