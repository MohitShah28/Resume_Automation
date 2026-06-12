"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Edit,
  ExternalLink,
  Copy
} from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AtsScoreCircle } from "@/components/ui/ats-score-circle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockProfile } from "@/lib/data"
import { GeneratedResume, generateResumeFromJob } from "@/lib/resume-generator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const fallbackResume = generateResumeFromJob({
  profile: mockProfile,
  jobDescription: "Data Analyst role requiring Python, SQL, dashboards, data visualization, stakeholder management, and business intelligence.",
  template: "modern",
  tone: "professional",
  experienceLevel: "mid",
  length: "medium",
})

const templateStyles = {
  harvard: {
    body: "font-serif",
    header: "text-center border-b-2 border-gray-900 pb-3 mb-3",
    name: "font-bold text-gray-950",
    contact: "text-gray-700",
    section: "text-gray-950 uppercase tracking-wider border-b border-gray-900",
    itemTitle: "font-bold text-gray-950",
  },
  modern: {
    body: "font-sans",
    header: "text-left border-t-4 border-gray-900 pt-4 pb-3 mb-3",
    name: "font-bold text-gray-950",
    contact: "text-gray-600",
    section: "text-gray-950 uppercase tracking-wide border-b border-gray-400",
    itemTitle: "font-semibold text-gray-950",
  },
  executive: {
    body: "font-serif",
    header: "text-center border-y-2 border-gray-800 py-5 mb-4",
    name: "font-bold text-gray-950 tracking-wide",
    contact: "text-gray-700",
    section: "text-gray-950 uppercase tracking-[0.16em] border-b border-gray-400",
    itemTitle: "font-bold text-gray-950",
  },
  compact: {
    body: "font-sans",
    header: "text-left border-b border-gray-300 pb-2 mb-2",
    name: "font-bold text-gray-950",
    contact: "text-gray-600",
    section: "text-gray-950 uppercase tracking-wide border-b border-gray-300",
    itemTitle: "font-semibold text-gray-950",
  },
} as const

type TemplateId = keyof typeof templateStyles
type ResumeProject = GeneratedResume["selectedProjects"][number]

const fallbackTemplateId: TemplateId = "modern"

function getTemplateId(value: string | undefined): TemplateId {
  return value && value in templateStyles ? (value as TemplateId) : fallbackTemplateId
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function openResumePrintWindow(resumeNode: HTMLElement, fileBaseName: string) {
  const printWindow = window.open("", "_blank", "width=980,height=1200")

  if (!printWindow) {
    toast.error("Please allow popups to export the PDF.")
    return false
  }

  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n")
  const clonedResume = resumeNode.cloneNode(true) as HTMLElement

  clonedResume.classList.remove("shadow-lg", "rounded-lg")
  clonedResume.style.width = "8.5in"
  clonedResume.style.maxWidth = "none"
  clonedResume.style.margin = "0 auto"
  clonedResume.style.boxShadow = "none"
  clonedResume.style.borderRadius = "0"
  clonedResume.style.overflow = "visible"

  printWindow.document.open()
  printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${fileBaseName}</title>
    ${styleTags}
    <style>
      @page { size: letter; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111827;
      }
      body {
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      .resume-print-root {
        width: 8.5in !important;
        max-width: none !important;
        min-height: 11in !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        background: #ffffff !important;
      }
      .resume-print-page {
        min-height: 11in !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        color: #111827 !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    </style>
  </head>
  <body>
    ${clonedResume.outerHTML}
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.print();
          window.close();
        }, 250);
      });
    </script>
  </body>
</html>`)
  printWindow.document.close()
  return true
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function makeCrcTable() {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let crc = index
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    }
    table[index] = crc >>> 0
  }
  return table
}

const crcTable = makeCrcTable()

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff)
}

function writeUint32(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff)
}

function createZipBlob(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder()
  const output: number[] = []
  const centralDirectory: number[] = []

  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const contentBytes = encoder.encode(file.content)
    const checksum = crc32(contentBytes)
    const localHeaderOffset = output.length

    writeUint32(output, 0x04034b50)
    writeUint16(output, 20)
    writeUint16(output, 0)
    writeUint16(output, 0)
    writeUint16(output, 0)
    writeUint16(output, 0)
    writeUint32(output, checksum)
    writeUint32(output, contentBytes.length)
    writeUint32(output, contentBytes.length)
    writeUint16(output, nameBytes.length)
    writeUint16(output, 0)
    output.push(...nameBytes, ...contentBytes)

    writeUint32(centralDirectory, 0x02014b50)
    writeUint16(centralDirectory, 20)
    writeUint16(centralDirectory, 20)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint32(centralDirectory, checksum)
    writeUint32(centralDirectory, contentBytes.length)
    writeUint32(centralDirectory, contentBytes.length)
    writeUint16(centralDirectory, nameBytes.length)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint16(centralDirectory, 0)
    writeUint32(centralDirectory, 0)
    writeUint32(centralDirectory, localHeaderOffset)
    centralDirectory.push(...nameBytes)
  }

  const centralDirectoryOffset = output.length
  output.push(...centralDirectory)
  writeUint32(output, 0x06054b50)
  writeUint16(output, 0)
  writeUint16(output, 0)
  writeUint16(output, files.length)
  writeUint16(output, files.length)
  writeUint32(output, centralDirectory.length)
  writeUint32(output, centralDirectoryOffset)
  writeUint16(output, 0)

  return new Blob([new Uint8Array(output)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
}

function createDocxBlob(text: string) {
  const paragraphs = text.split("\n").map((line) => {
    const isHeading = /^[A-Z][A-Z\s&]+$/.test(line.trim()) && line.trim().length > 2
    const runProps = isHeading ? "<w:rPr><w:b/></w:rPr>" : ""
    return `<w:p><w:r>${runProps}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
  }).join("")

  return createZipBlob([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    },
    {
      name: "word/document.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`,
    },
  ])
}

function mergeProjectsForFullPage(projects: ResumeProject[], profileProjects: ResumeProject[]) {
  const merged = [...projects]

  for (const project of profileProjects) {
    const alreadyAdded = merged.some((item) => item.id === project.id || item.name === project.name)
    if (!alreadyAdded) merged.push(project)
    if (merged.length >= 3) break
  }

  return merged.slice(0, 3).map((project) => {
    const profileProject = profileProjects.find((item) => item.id === project.id || item.name === project.name)
    const highlights = project.highlights?.length ? project.highlights : profileProject?.highlights || []
    const fallbackHighlights = [
      project.description,
      profileProject?.description,
      "Organized project outputs into clear workflows, dashboards, or reports for practical review",
      "Tested results for consistency, readability, and alignment with user or business requirements",
    ].filter((item): item is string => Boolean(item?.trim()))

    return {
      ...profileProject,
      ...project,
      technologies: project.technologies?.length ? project.technologies : profileProject?.technologies || [],
      highlights: Array.from(new Set([...highlights, ...fallbackHighlights])).slice(0, 4),
    }
  })
}

function buildDownloadText({
  generatedResume,
  tailoredSkills,
  displayProjects,
}: {
  generatedResume: GeneratedResume
  tailoredSkills: string[]
  displayProjects: ResumeProject[]
}) {
  const profile = generatedResume.profile

  return [
    `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
    `${profile.personalInfo.email} | ${profile.personalInfo.phone} | ${profile.personalInfo.location}`,
    `${profile.personalInfo.linkedin} | ${profile.personalInfo.github} | ${profile.personalInfo.portfolio}`,
    "",
    "PROFESSIONAL SUMMARY",
    generatedResume.improvedSummary || generatedResume.summary,
    "",
    "TECHNICAL SKILLS",
    `Relevant Skills: ${tailoredSkills.join(", ")}`,
    "",
    "PROFESSIONAL EXPERIENCE",
    ...generatedResume.selectedExperience.flatMap((exp) => [
      `${exp.position} | ${exp.company}, ${exp.location} | ${exp.startDate} - ${exp.endDate}`,
      ...exp.description.map((bullet) => `- ${bullet}`),
      "",
    ]),
    "PROJECTS",
    ...displayProjects.flatMap((project) => [
      `${project.name} | ${project.technologies.slice(0, 8).join(", ")}`,
      ...project.highlights.map((highlight) => `- ${highlight}`),
      "",
    ]),
    "EDUCATION",
    ...profile.education.flatMap((edu) => [
      `${edu.degree} in ${edu.field} | ${edu.institution} | ${edu.endDate}`,
      edu.gpa ? `GPA: ${edu.gpa}` : "",
    ]),
  ].filter((line) => line !== undefined).join("\n").trim()
}

export default function ResumePreviewPage() {
  const resumePrintRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(100)
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume>(fallbackResume)
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(getTemplateId(fallbackResume.template))

  useEffect(() => {
    const savedResume = window.localStorage.getItem("generatedResume")
    if (!savedResume) return

    try {
      const parsedResume = JSON.parse(savedResume) as GeneratedResume
      setGeneratedResume(parsedResume)
      setSelectedTemplateId(getTemplateId(parsedResume.template))
    } catch {
      window.localStorage.removeItem("generatedResume")
    }
  }, [])

  const profile = generatedResume.profile
  const tailoredSkills = generatedResume.tailoredSkills?.length
    ? generatedResume.tailoredSkills
    : [
        ...profile.skills.programming,
        ...profile.skills.dataAnalysis,
        ...profile.skills.visualization,
        ...profile.skills.cloud,
        ...profile.skills.tools,
      ]
  const resumeTemplate = templateStyles[selectedTemplateId]
  const isCompact = selectedTemplateId === "compact"
  const displayProjects = mergeProjectsForFullPage(generatedResume.selectedProjects, profile.projects)
  const downloadText = buildDownloadText({ generatedResume, tailoredSkills, displayProjects })
  const fileBaseName = sanitizeFilename(`${profile.personalInfo.firstName}_${profile.personalInfo.lastName}_resume`) || "resume"

  const handleDownloadPDF = async () => {
    const resumeNode = resumePrintRef.current
    const resumeTemplateId = getTemplateId(generatedResume.template)

    if (!resumeNode || selectedTemplateId !== resumeTemplateId) {
      toast.error("Template mismatch detected. Please reopen the resume preview and try again.")
      return
    }

    const previousZoom = zoom

    try {
      toast.loading("Preparing PDF preview...", { id: "resume-pdf" })
      setZoom(100)
      await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)))
      const didOpenPrintWindow = openResumePrintWindow(resumeNode, fileBaseName)
      setZoom(previousZoom)
      if (didOpenPrintWindow) {
        toast.success("Print dialog opened. Choose Save as PDF.", { id: "resume-pdf" })
      }
    } catch (error) {
      setZoom(previousZoom)
      console.error("PDF generation failed", error)
      toast.error("PDF generation failed. Please try again.", { id: "resume-pdf" })
    }
  }

  const handleDownloadDOCX = () => {
    downloadBlob(createDocxBlob(downloadText), `${fileBaseName}.docx`)
    toast.success("DOCX downloaded")
  }

  const handleCopyResume = async () => {
    await navigator.clipboard.writeText(downloadText)
    toast.success("Resume copied to clipboard")
  }

  return (
    <AppLayout title="Resume Preview" subtitle="Review and download your generated resume">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume Document Preview */}
          <div className="lg:col-span-2">
            <AnimatedCard hover={false} className="p-4">
              {/* Zoom Controls */}
              <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Preview</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleCopyResume}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Document */}
              <motion.div
                ref={resumePrintRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="resume-print-root bg-white rounded-lg shadow-lg mx-auto overflow-visible"
                style={{
                  width: `${(8.5 * 96 * zoom) / 100}px`,
                  minHeight: `${(11 * 96 * zoom) / 100}px`,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  display: "block"
                }}
              >
                <div className={cn("resume-print-page", resumeTemplate.body, isCompact ? "px-6 py-5" : "px-7 py-6")} style={{ fontSize: `${(14 * zoom) / 100}px`, lineHeight: "1.5" }}>
                  {/* Header */}
                  <div className={resumeTemplate.header} style={{ pageBreakInside: "avoid" }}>
                    <h1 className={cn("text-2xl", resumeTemplate.name, selectedTemplateId === "executive" && "uppercase")} style={{ fontSize: `${(24 * zoom) / 100}px`, margin: "0 0 0.3em 0" }}>
                      {profile.personalInfo.firstName} {profile.personalInfo.lastName}
                    </h1>
                    {selectedTemplateId === "executive" && <div className="w-20 h-px bg-gray-800 mx-auto my-1" style={{ margin: "0.2em auto" }} />}
                    <p className={cn("mt-1", resumeTemplate.contact)} style={{ fontSize: `${(11 * zoom) / 100}px`, margin: "0.2em 0 0 0" }}>
                      {profile.personalInfo.email} | {profile.personalInfo.phone} | {profile.personalInfo.location}
                    </p>
                    <p className={resumeTemplate.contact} style={{ fontSize: `${(11 * zoom) / 100}px`, margin: "0.1em 0 0 0" }}>
                      {profile.personalInfo.linkedin} | {profile.personalInfo.github} | {profile.personalInfo.portfolio}
                    </p>
                  </div>

                  {/* Professional Summary */}
                  <div className={isCompact ? "mb-1.5" : "mb-2.5"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-1.5", resumeTemplate.section)}>
                      Professional Summary
                    </h2>
                    <p className="text-gray-700 leading-relaxed" style={{ fontSize: `${(11 * zoom) / 100}px`, margin: 0 }}>
                      {generatedResume.improvedSummary || generatedResume.summary}
                    </p>
                  </div>

                  {/* Technical Skills */}
                  <div className={isCompact ? "mb-1.5" : "mb-2.5"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-1.5", resumeTemplate.section)}>
                      Technical Skills
                    </h2>
                    <div className="text-gray-700" style={{ fontSize: `${(11 * zoom) / 100}px`, margin: 0 }}>
                      <p style={{ margin: 0 }}><strong>Relevant Skills:</strong> {tailoredSkills.join(", ")}</p>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className={isCompact ? "mb-1.5" : "mb-2.5"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-1.5", resumeTemplate.section)}>
                      Professional Experience
                    </h2>
                    {generatedResume.selectedExperience.map((exp) => (
                      <div key={exp.id} className={isCompact ? "mb-1.5" : "mb-2"} style={{ pageBreakInside: "avoid" }}>
                        <div className="flex justify-between items-baseline gap-4">
                          <h3 className={resumeTemplate.itemTitle} style={{ fontSize: `${(12 * zoom) / 100}px`, margin: 0 }}>{exp.position}</h3>
                          <span className="text-gray-600 whitespace-nowrap" style={{ fontSize: `${(10 * zoom) / 100}px`, margin: 0 }}>
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </div>
                        <p className="text-gray-700 italic" style={{ fontSize: `${(11 * zoom) / 100}px`, margin: "0.2em 0 0 0" }}>
                          {exp.company}, {exp.location}
                        </p>
                        <ul className={cn("list-disc pl-5 text-gray-700", isCompact ? "mt-0.5" : "mt-0.5")} style={{ fontSize: `${(11 * zoom) / 100}px`, margin: "0.3em 0 0 0" }}>
                          {exp.description.map((bullet, idx) => (
                            <li key={idx} style={{ margin: "0.15em 0", pageBreakInside: "avoid" }}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Projects */}
                  <div className={isCompact ? "mb-1.5" : "mb-2.5"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-1.5", resumeTemplate.section)}>
                      Projects
                    </h2>
                    {displayProjects.map((project) => (
                      <div key={project.id} className={isCompact ? "mb-1.5" : "mb-2"} style={{ pageBreakInside: "avoid" }}>
                        <div className="flex justify-between items-baseline gap-4">
                          <h3 className={resumeTemplate.itemTitle} style={{ fontSize: `${(12 * zoom) / 100}px`, margin: 0 }}>{project.name}</h3>
                          <span className="text-gray-600 text-right" style={{ fontSize: `${(10 * zoom) / 100}px`, margin: 0 }}>
                            {project.technologies.slice(0, 5).join(", ")}
                          </span>
                        </div>
                        <ul className="list-disc pl-5 text-gray-700" style={{ fontSize: `${(11 * zoom) / 100}px`, margin: "0.3em 0 0 0" }}>
                          {project.highlights.map((highlight, idx) => (
                            <li key={idx} style={{ margin: "0.15em 0", pageBreakInside: "avoid" }}>{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Education */}
                  <div className={isCompact ? "mb-1.5" : "mb-2.5"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-1.5", resumeTemplate.section)}>
                      Education
                    </h2>
                    {profile.education.map((edu) => (
                      <div key={edu.id} className="mb-1" style={{ pageBreakInside: "avoid" }}>
                        <div className="flex justify-between items-baseline gap-4">
                          <h3 className={resumeTemplate.itemTitle} style={{ fontSize: `${(12 * zoom) / 100}px`, margin: 0 }}>{edu.degree} in {edu.field}</h3>
                          <span className="text-gray-600 whitespace-nowrap" style={{ fontSize: `${(10 * zoom) / 100}px`, margin: 0 }}>
                            {edu.endDate}
                          </span>
                        </div>
                        <p className="text-gray-700" style={{ fontSize: `${(11 * zoom) / 100}px`, margin: "0.15em 0 0 0" }}>
                          {edu.institution} | GPA: {edu.gpa}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Certifications are temporarily hidden. Keep this block for future re-enable. */}
                  {/* <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
                      Certifications
                    </h2>
                    <div className="text-gray-700" style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                      {generatedResume.selectedCertifications.map((cert) => (
                        <p key={cert.id}>{cert.name} - {cert.issuer} ({cert.date})</p>
                      ))}
                    </div>
                  </div> */}
                </div>
              </motion.div>
            </AnimatedCard>
          </div>

          {/* Right Panel - ATS Insights */}
          <div className="space-y-4">
            {/* ATS Score */}
            <AnimatedCard delay={0.1}>
              <div className="flex flex-col items-center text-center">
                <AtsScoreCircle score={generatedResume.atsScore} size="lg" />
                <p className="text-sm text-muted-foreground mt-3">
                  Your resume is highly optimized for ATS systems
                </p>
              </div>
            </AnimatedCard>

            {/* Matched Keywords */}
            <AnimatedCard delay={0.2}>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
                Matched Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {generatedResume.matchedKeywords.map((keyword, index) => (
                  <motion.div
                    key={keyword}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <Badge className="bg-[#10b981]/10 text-[#10b981]">{keyword}</Badge>
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>

            {/* Keywords Missing From Profile */}
            <AnimatedCard delay={0.3}>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-[#f59e0b]" />
                Missing From Profile
              </h3>
              <div className="flex flex-wrap gap-2">
                {generatedResume.missingKeywords.map((keyword, index) => (
                  <motion.div
                    key={keyword}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <Badge className="bg-[#f59e0b]/10 text-[#f59e0b]">{keyword}</Badge>
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>

            {/* Strengths */}
            <AnimatedCard delay={0.4}>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-[#4f46e5]" />
                Match Summary
              </h3>
              <p className="text-sm text-foreground">{generatedResume.matchSummary}</p>
            </AnimatedCard>

            {/* Suggestions */}
            <AnimatedCard delay={0.5}>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-[#f59e0b]" />
                Improvement Suggestions
              </h3>
              <ul className="space-y-2">
                {generatedResume.suggestions.map((suggestion, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <AlertCircle className="h-4 w-4 text-[#f59e0b] mt-0.5 shrink-0" />
                    {suggestion}
                  </motion.li>
                ))}
              </ul>
            </AnimatedCard>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full gap-2" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleDownloadDOCX}>
                <FileText className="h-4 w-4" />
                Export DOCX
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleCopyResume}>
                <Copy className="h-4 w-4" />
                Copy Resume
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Edit className="h-4 w-4" />
                Edit Resume
              </Button>
              <Button variant="ghost" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Share Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
