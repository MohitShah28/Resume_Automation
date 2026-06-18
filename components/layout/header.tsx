"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Moon, Search, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <motion.header
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30"
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-64 pl-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4f46e5] rounded-full" />
          </Button>
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              MS
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </motion.header>
  )
}
