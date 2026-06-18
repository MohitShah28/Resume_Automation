import { mockProfile } from "@/lib/data"
import type { GeneratedResume, ProfileData } from "@/lib/resume-generator"

const MASTER_PROFILE_KEY = "master_profile"
const LEGACY_PROFILE_KEY = "resumeProfile"
const LATEST_GENERATED_RESUME_KEY = "generatedResume"
const GENERATED_RESUMES_KEY = "generated_resumes"

type ProfileSaveSource = "profile_management" | "resume_generation"

export type StoredGeneratedResume = {
  id: string
  label: string
  resume: GeneratedResume
  createdAt: string
}

function cloneProfile(profile: ProfileData): ProfileData {
  return structuredClone(profile)
}

function readJson<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

export function loadMasterProfile(): ProfileData {
  const savedProfile = readJson<ProfileData>(MASTER_PROFILE_KEY) || readJson<ProfileData>(LEGACY_PROFILE_KEY)
  return cloneProfile(savedProfile || mockProfile)
}

export function createProfileWorkingCopy(): ProfileData {
  return cloneProfile(loadMasterProfile())
}

export function saveMasterProfile(profile: ProfileData, source: ProfileSaveSource) {
  if (source !== "profile_management") {
    throw new Error("Blocked profile update outside Profile Management.")
  }

  window.localStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(cloneProfile(profile)))
}

export function saveGeneratedResume(resume: GeneratedResume) {
  const storedResume: StoredGeneratedResume = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: `${resume.jobTitle} Resume`,
    resume,
    createdAt: new Date().toISOString(),
  }
  const generatedResumes = readJson<StoredGeneratedResume[]>(GENERATED_RESUMES_KEY) || []

  window.localStorage.setItem(LATEST_GENERATED_RESUME_KEY, JSON.stringify(resume))
  window.localStorage.setItem(GENERATED_RESUMES_KEY, JSON.stringify([storedResume, ...generatedResumes]))
}

export function loadLatestGeneratedResume() {
  return readJson<GeneratedResume>(LATEST_GENERATED_RESUME_KEY)
}

export function clearLatestGeneratedResume() {
  window.localStorage.removeItem(LATEST_GENERATED_RESUME_KEY)
}
