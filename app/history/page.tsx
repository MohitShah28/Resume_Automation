"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  FileText,
  MoreHorizontal,
  Calendar,
  Building2
} from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockResumes } from "@/lib/data"
import { toast } from "sonner"

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTemplate, setFilterTemplate] = useState("all")
  const [filterDate, setFilterDate] = useState("all")

  const filteredResumes = mockResumes.filter(resume => {
    const matchesSearch = 
      resume.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resume.company.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTemplate = filterTemplate === "all" || resume.template === filterTemplate
    
    return matchesSearch && matchesTemplate
  })

  const handleDownload = () => {
    toast.success("Downloading resume...")
  }

  const handleDuplicate = () => {
    toast.success("Resume duplicated!")
  }

  const handleDelete = () => {
    toast.success("Resume deleted!")
  }

  return (
    <AppLayout title="Resume History" subtitle="View and manage your generated resumes">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Filters */}
        <AnimatedCard hover={false}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-3">
              <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  <SelectItem value="Harvard">Harvard</SelectItem>
                  <SelectItem value="FAANG">FAANG</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AnimatedCard>

        {/* Resume List */}
        <div className="space-y-4">
          {filteredResumes.length === 0 ? (
            <AnimatedCard hover={false}>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No Resumes Found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "Start by creating your first resume"}
                </p>
              </div>
            </AnimatedCard>
          ) : (
            filteredResumes.map((resume, index) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AnimatedCard className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground truncate">
                          {resume.jobTitle}
                        </h3>
                        <Badge 
                          variant="secondary"
                          className={
                            resume.atsScore >= 90 
                              ? "bg-[#10b981]/10 text-[#10b981]" 
                              : resume.atsScore >= 80 
                              ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                              : "bg-[#ef4444]/10 text-[#ef4444]"
                          }
                        >
                          {resume.atsScore}% ATS
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {resume.company}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {resume.template}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDuplicate}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            View Resume
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDuplicate}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={handleDelete}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))
          )}
        </div>

        {/* Stats */}
        {filteredResumes.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground text-center"
          >
            Showing {filteredResumes.length} of {mockResumes.length} resumes
          </motion.p>
        )}
      </div>
    </AppLayout>
  )
}
