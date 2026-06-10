"use client"

import { useEffect, useState } from "react"
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

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function wrapText(value: string, maxLength: number) {
  if (!value.trim()) return [""]

  const words = value.split(/\s+/)
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = nextLine
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}

function createPdfBlob(text: string) {
  const wrappedLines = text
    .split("\n")
    .flatMap((line) => wrapText(line, 95))
  const linesPerPage = 58
  const pages = Array.from({ length: Math.ceil(wrappedLines.length / linesPerPage) || 1 }, (_, index) =>
    wrappedLines.slice(index * linesPerPage, (index + 1) * linesPerPage)
  )
  const objects: string[] = []
  const addObject = (content: string) => {
    objects.push(content)
    return objects.length
  }

  const catalogRef = addObject("<< /Type /Catalog /Pages 2 0 R >>")
  const pagesRef = addObject("")
  const fontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  const pageRefs: number[] = []

  for (const pageLines of pages) {
    const stream = [
      "BT",
      "/F1 10 Tf",
      "50 780 Td",
      "14 TL",
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      "ET",
    ].join("\n")
    const contentRef = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    const pageRef = addObject(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRef} 0 R >> >> /Contents ${contentRef} 0 R >>`)
    pageRefs.push(pageRef)
  }

  objects[pagesRef - 1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`

  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: "application/pdf" })
}

function createFormattedResumePdfBlob({
  generatedResume,
  tailoredSkills,
  displayProjects,
  displayAchievements,
  templateId,
}: {
  generatedResume: GeneratedResume
  tailoredSkills: string[]
  displayProjects: ResumeProject[]
  displayAchievements: string[]
  templateId: TemplateId
}) {
  const profile = generatedResume.profile
  const objects: string[] = []
  const addObject = (content: string) => {
    objects.push(content)
    return objects.length
  }
  const pages: string[] = []
  const marginX = 46
  const pageWidth = 612
  const pageHeight = 792
  const contentWidth = pageWidth - marginX * 2
  let commands: string[] = []
  let y = 756

  const textWidth = (text: string, size: number) => text.length * size * 0.48
  const maxChars = (width: number, size: number) => Math.max(18, Math.floor(width / (size * 0.5)))
  const finishPage = () => {
    pages.push(commands.join("\n"))
    commands = []
    y = 756
  }
  const ensureSpace = (height: number) => {
    if (y - height < 42) finishPage()
  }
  const drawText = (
    text: string,
    x: number,
    currentY: number,
    size = 9,
    font: "regular" | "bold" | "italic" = "regular",
    align: "left" | "center" | "right" = "left"
  ) => {
    const fontName = font === "bold" ? "F2" : font === "italic" ? "F3" : "F1"
    const adjustedX =
      align === "center"
        ? x - textWidth(text, size) / 2
        : align === "right"
          ? x - textWidth(text, size)
          : x
    commands.push(`BT /${fontName} ${size} Tf ${adjustedX.toFixed(2)} ${currentY.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`)
  }
  const drawLine = (lineY: number, width = contentWidth, x = marginX, strokeWidth = 0.7) => {
    commands.push(`${strokeWidth} w ${x} ${lineY.toFixed(2)} m ${x + width} ${lineY.toFixed(2)} l S`)
  }
  const addWrappedText = (
    text: string,
    options: {
      x?: number
      width?: number
      size?: number
      lineHeight?: number
      font?: "regular" | "bold" | "italic"
      bullet?: boolean
    } = {}
  ) => {
    const size = options.size || 9
    const lineHeight = options.lineHeight || 11
    const x = options.x || marginX
    const width = options.width || contentWidth
    const prefix = options.bullet ? "- " : ""
    const lines = wrapText(text, maxChars(width - (options.bullet ? 12 : 0), size))

    ensureSpace(lines.length * lineHeight + 2)
    lines.forEach((line, index) => {
      drawText(`${index === 0 ? prefix : "  "}${line}`, x, y, size, options.font)
      y -= lineHeight
    })
  }
  const addSection = (title: string) => {
    ensureSpace(24)
    y -= 6
    drawText(title.toUpperCase(), marginX, y, 10, "bold")
    drawLine(y - 4)
    y -= 16
  }

  if (templateId === "harvard") {
    drawText(`${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`, pageWidth / 2, y, 18, "bold", "center")
    y -= 16
    drawText(`${profile.personalInfo.email} | ${profile.personalInfo.phone} | ${profile.personalInfo.location}`, pageWidth / 2, y, 8, "regular", "center")
    y -= 11
    drawText(`${profile.personalInfo.linkedin} | ${profile.personalInfo.github} | ${profile.personalInfo.portfolio}`, pageWidth / 2, y, 8, "regular", "center")
    y -= 10
    drawLine(y, contentWidth, marginX, 1.2)
    y -= 12
  } else if (templateId === "executive") {
    drawLine(y + 4, contentWidth, marginX, 1.2)
    y -= 20
    drawText(`${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`.toUpperCase(), pageWidth / 2, y, 18, "bold", "center")
    y -= 13
    drawLine(y + 5, 80, pageWidth / 2 - 40, 0.8)
    y -= 7
    drawText(`${profile.personalInfo.email} | ${profile.personalInfo.phone} | ${profile.personalInfo.location}`, pageWidth / 2, y, 8, "regular", "center")
    y -= 10
    drawText(`${profile.personalInfo.linkedin} | ${profile.personalInfo.github} | ${profile.personalInfo.portfolio}`, pageWidth / 2, y, 8, "regular", "center")
    y -= 10
    drawLine(y, contentWidth, marginX, 1.2)
    y -= 14
  } else if (templateId === "compact") {
    drawText(`${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`, marginX, y, 17, "bold")
    drawText(`${profile.personalInfo.email}`, pageWidth - marginX, y, 8, "regular", "right")
    y -= 12
    drawText("Software Developer | Data Analyst", marginX, y, 8, "regular")
    drawText(`${profile.personalInfo.location} | ${profile.personalInfo.github}`, pageWidth - marginX, y, 8, "regular", "right")
    y -= 9
    drawLine(y, contentWidth, marginX, 0.9)
    y -= 11
  } else {
    drawLine(y + 4, contentWidth, marginX, 2)
    y -= 16
    drawText(`${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`, marginX, y, 18, "bold")
    y -= 13
    drawText(`${profile.personalInfo.email} | ${profile.personalInfo.phone} | ${profile.personalInfo.location}`, marginX, y, 8, "regular")
    y -= 10
    drawText(`${profile.personalInfo.linkedin} | ${profile.personalInfo.github} | ${profile.personalInfo.portfolio}`, marginX, y, 8, "regular")
    y -= 12
  }

  addSection("Professional Summary")
  addWrappedText(generatedResume.improvedSummary || generatedResume.summary, { size: 9, lineHeight: 11 })

  addSection("Technical Skills")
  addWrappedText(`Relevant Skills: ${tailoredSkills.join(", ")}`, { size: 8.5, lineHeight: 10.5 })

  addSection("Professional Experience")
  generatedResume.selectedExperience.forEach((exp) => {
    ensureSpace(42)
    drawText(exp.position, marginX, y, 9.5, "bold")
    drawText(`${exp.startDate} - ${exp.endDate}`, pageWidth - marginX, y, 8, "regular", "right")
    y -= 11
    drawText(`${exp.company}, ${exp.location}`, marginX, y, 8.5, "italic")
    y -= 11
    exp.description.forEach((bullet) => addWrappedText(bullet, { x: marginX + 10, width: contentWidth - 10, size: 8.5, lineHeight: 10, bullet: true }))
    y -= 3
  })

  addSection("Projects")
  displayProjects.forEach((project) => {
    ensureSpace(42)
    drawText(project.name, marginX, y, 9.5, "bold")
    drawText(project.technologies.slice(0, 5).join(", "), pageWidth - marginX, y, 7.5, "regular", "right")
    y -= 11
    project.highlights.forEach((highlight) => addWrappedText(highlight, { x: marginX + 10, width: contentWidth - 10, size: 8.5, lineHeight: 10, bullet: true }))
    y -= 3
  })

  addSection("Education")
  profile.education.forEach((edu) => {
    ensureSpace(26)
    drawText(`${edu.degree} in ${edu.field}`, marginX, y, 9, "bold")
    drawText(edu.endDate, pageWidth - marginX, y, 8, "regular", "right")
    y -= 10
    drawText(`${edu.institution}${edu.gpa ? ` | GPA: ${edu.gpa}` : ""}`, marginX, y, 8.5)
    y -= 13
  })

  if (displayAchievements.length) {
    addSection("Achievements")
    displayAchievements.forEach((achievement) => addWrappedText(achievement, { x: marginX + 10, width: contentWidth - 10, size: 8.5, lineHeight: 10, bullet: true }))
  }

  finishPage()

  const catalogRef = addObject("<< /Type /Catalog /Pages 2 0 R >>")
  const pagesRef = addObject("")
  const regularFontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  const boldFontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
  const italicFontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>")
  const pageRefs: number[] = []

  pages.forEach((streamCommands) => {
    const contentRef = addObject(`<< /Length ${streamCommands.length} >>\nstream\n${streamCommands}\nendstream`)
    const pageRef = addObject(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${regularFontRef} 0 R /F2 ${boldFontRef} 0 R /F3 ${italicFontRef} 0 R >> >> /Contents ${contentRef} 0 R >>`)
    pageRefs.push(pageRef)
  })

  objects[pagesRef - 1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`

  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: "application/pdf" })
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

function mergeAchievementsForFullPage(achievements: string[], profileAchievements: string[]) {
  return Array.from(new Set([...achievements, ...profileAchievements])).slice(0, 5)
}

function buildDownloadText({
  generatedResume,
  tailoredSkills,
  displayProjects,
  displayAchievements,
}: {
  generatedResume: GeneratedResume
  tailoredSkills: string[]
  displayProjects: ResumeProject[]
  displayAchievements: string[]
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
    "",
    ...(displayAchievements.length
      ? [
          "ACHIEVEMENTS",
          ...displayAchievements.map((achievement) => `- ${achievement}`),
        ]
      : []),
  ].filter((line) => line !== undefined).join("\n").trim()
}

export default function ResumePreviewPage() {
  const [zoom, setZoom] = useState(100)
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume>(fallbackResume)

  useEffect(() => {
    const savedResume = window.localStorage.getItem("generatedResume")
    if (!savedResume) return

    try {
      setGeneratedResume(JSON.parse(savedResume))
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
  const templateId = (generatedResume.template in templateStyles ? generatedResume.template : "modern") as TemplateId
  const resumeTemplate = templateStyles[templateId]
  const isCompact = templateId === "compact"
  const displayProjects = mergeProjectsForFullPage(generatedResume.selectedProjects, profile.projects)
  const displayAchievements = mergeAchievementsForFullPage(generatedResume.selectedAchievements || [], profile.achievements || [])
  const downloadText = buildDownloadText({ generatedResume, tailoredSkills, displayProjects, displayAchievements })
  const fileBaseName = sanitizeFilename(`${profile.personalInfo.firstName}_${profile.personalInfo.lastName}_resume`) || "resume"

  const handleDownloadPDF = () => {
    downloadBlob(
      createFormattedResumePdfBlob({ generatedResume, tailoredSkills, displayProjects, displayAchievements, templateId }),
      `${fileBaseName}.pdf`
    )
    toast.success("PDF downloaded")
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-lg mx-auto overflow-auto"
                style={{
                  width: `${(8.5 * 96 * zoom) / 100}px`,
                  minHeight: `${(11 * 96 * zoom) / 100}px`,
                  maxWidth: "100%"
                }}
              >
                <div className={cn("px-7 py-6", resumeTemplate.body, isCompact && "px-6 py-5")} style={{ fontSize: `${(14 * zoom) / 100}px` }}>
                  {/* Header */}
                  <div className={resumeTemplate.header}>
                    <h1 className={cn("text-2xl", resumeTemplate.name, templateId === "executive" && "uppercase")} style={{ fontSize: `${(24 * zoom) / 100}px` }}>
                      {profile.personalInfo.firstName} {profile.personalInfo.lastName}
                    </h1>
                    {templateId === "executive" && <div className="w-20 h-px bg-gray-800 mx-auto my-2" />}
                    <p className={cn("mt-1", resumeTemplate.contact)} style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                      {profile.personalInfo.email} | {profile.personalInfo.phone} | {profile.personalInfo.location}
                    </p>
                    <p className={resumeTemplate.contact} style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                      {profile.personalInfo.linkedin} | {profile.personalInfo.github} | {profile.personalInfo.portfolio}
                    </p>
                  </div>

                  {/* Professional Summary */}
                  <div className={isCompact ? "mb-2" : "mb-3"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-2", resumeTemplate.section)}>
                      Professional Summary
                    </h2>
                    <p className="text-gray-700 leading-relaxed" style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                      {generatedResume.improvedSummary || generatedResume.summary}
                    </p>
                  </div>

                  {/* Technical Skills */}
                  <div className={isCompact ? "mb-2" : "mb-3"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-2", resumeTemplate.section)}>
                      Technical Skills
                    </h2>
                    <div className="text-gray-700" style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                      <p><strong>Relevant Skills:</strong> {tailoredSkills.join(", ")}</p>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className={isCompact ? "mb-2" : "mb-3"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-2", resumeTemplate.section)}>
                      Professional Experience
                    </h2>
                    {generatedResume.selectedExperience.map((exp) => (
                      <div key={exp.id} className={isCompact ? "mb-2" : "mb-2.5"}>
                        <div className="flex justify-between items-baseline gap-4">
                          <h3 className={resumeTemplate.itemTitle}>{exp.position}</h3>
                          <span className="text-gray-600 whitespace-nowrap" style={{ fontSize: `${(11 * zoom) / 100}px` }}>
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </div>
                        <p className="text-gray-700 italic" style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                          {exp.company}, {exp.location}
                        </p>
                        <ul className={cn("list-disc pl-5 text-gray-700", isCompact ? "mt-0.5" : "mt-1")} style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                          {exp.description.map((bullet, idx) => (
                            <li key={idx}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Projects */}
                  <div className={isCompact ? "mb-2" : "mb-3"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-2", resumeTemplate.section)}>
                      Projects
                    </h2>
                    {displayProjects.map((project) => (
                      <div key={project.id} className={isCompact ? "mb-2" : "mb-2.5"}>
                        <div className="flex justify-between items-baseline gap-4">
                          <h3 className={resumeTemplate.itemTitle}>{project.name}</h3>
                          <span className="text-gray-600 text-right" style={{ fontSize: `${(11 * zoom) / 100}px` }}>
                            {project.technologies.slice(0, 5).join(", ")}
                          </span>
                        </div>
                        <ul className="list-disc pl-5 text-gray-700" style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                          {project.highlights.map((highlight, idx) => (
                            <li key={idx}>{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Education */}
                  <div className={isCompact ? "mb-2" : "mb-3"}>
                    <h2 className={cn("text-sm font-bold pb-1 mb-2", resumeTemplate.section)}>
                      Education
                    </h2>
                    {profile.education.map((edu) => (
                      <div key={edu.id} className="mb-2">
                        <div className="flex justify-between items-baseline gap-4">
                          <h3 className={resumeTemplate.itemTitle}>{edu.degree} in {edu.field}</h3>
                          <span className="text-gray-600 whitespace-nowrap" style={{ fontSize: `${(11 * zoom) / 100}px` }}>
                            {edu.endDate}
                          </span>
                        </div>
                        <p className="text-gray-700" style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                          {edu.institution} | GPA: {edu.gpa}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Achievements */}
                  {displayAchievements.length > 0 && (
                    <div className="mb-3">
                      <h2 className={cn("text-sm font-bold pb-1 mb-2", resumeTemplate.section)}>
                        Achievements
                      </h2>
                      <ul className="list-disc pl-5 text-gray-700" style={{ fontSize: `${(12 * zoom) / 100}px` }}>
                        {displayAchievements.map((achievement, idx) => (
                          <li key={idx}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

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
