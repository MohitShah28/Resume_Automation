"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  FileText,
  TrendingUp,
  Target,
  User,
  Plus,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { AnimatedCard } from "@/components/ui/animated-card"
import { CountUp } from "@/components/ui/count-up"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { dashboardStats, mockResumes, recentActivity } from "@/lib/data"

const stats = [
  {
    label: "Total Resumes Generated",
    value: dashboardStats.totalResumes,
    icon: FileText,
    color: "text-[#4f46e5]",
    bgColor: "bg-[#4f46e5]/10"
  },
  {
    label: "Average ATS Score",
    value: dashboardStats.avgAtsScore,
    suffix: "%",
    icon: TrendingUp,
    color: "text-[#10b981]",
    bgColor: "bg-[#10b981]/10"
  },
  {
    label: "Applications Prepared",
    value: dashboardStats.applicationsPrepared,
    icon: Target,
    color: "text-[#f59e0b]",
    bgColor: "bg-[#f59e0b]/10"
  },
  {
    label: "Profile Completion",
    value: dashboardStats.profileCompletion,
    suffix: "%",
    icon: User,
    color: "text-primary",
    bgColor: "bg-primary/10"
  }
]

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard" subtitle="Welcome back, Mohit">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <AnimatedCard key={stat.label} delay={index * 0.1}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2 text-foreground">
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        {/* Quick Action */}
        <AnimatedCard delay={0.4} hover={false}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-foreground">Ready to create a new resume?</h2>
                <p className="text-muted-foreground text-sm">
                  Paste a job description and let AI optimize your resume
                </p>
              </div>
            </div>
            <Link href="/resume-builder">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Resume
              </Button>
            </Link>
          </div>
        </AnimatedCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Resumes */}
          <AnimatedCard delay={0.5} className="lg:col-span-2" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-foreground">Recent Resumes</h2>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {mockResumes.slice(0, 4).map((resume, index) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{resume.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">{resume.company}</p>
                  </div>
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
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </AnimatedCard>

          {/* Activity Timeline */}
          <AnimatedCard delay={0.6} hover={false}>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg text-foreground">Recent Activity</h2>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    {index < recentActivity.length - 1 && (
                      <div className="absolute top-4 left-[3px] w-0.5 h-full bg-border" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedCard>
        </div>
      </div>
    </AppLayout>
  )
}
