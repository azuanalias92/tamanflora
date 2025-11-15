import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Download, Search, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface CheckInLog {
  timestamp: string
  date: Date
  userId?: string
  userName?: string
  userEmail?: string
}

export function CheckInLogs() {
  const [logs, setLogs] = useState<CheckInLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<CheckInLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  // Load check-in logs from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('checkInLogs')
    if (!savedLogs) return
    try {
      const parsed = JSON.parse(savedLogs) as Array<string | { timestamp: string; userId?: string; userName?: string; userEmail?: string }>
      const normalized: CheckInLog[] = parsed.map((entry) => {
        if (typeof entry === 'string') {
          return { timestamp: entry, date: new Date(entry) }
        }
        return { timestamp: entry.timestamp, date: new Date(entry.timestamp), userId: entry.userId, userName: entry.userName, userEmail: entry.userEmail }
      })
      setLogs(normalized)
      setFilteredLogs(normalized)
    } catch {
      setLogs([])
      setFilteredLogs([])
    }
  }, [])

  // Filter logs based on search term and date range
  useEffect(() => {
    let filtered = logs

    // Filter by search term (search in formatted date/time string)
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        format(log.date, 'dd/MM/yyyy p').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(log => log.date >= dateFrom)
    }
    if (dateTo) {
      // Set time to end of day for dateTo
      const endOfDay = new Date(dateTo)
      endOfDay.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => log.date <= endOfDay)
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, dateFrom, dateTo])

  const clearAllLogs = () => {
    if (window.confirm('Are you sure you want to clear all check-in logs?')) {
      localStorage.removeItem('checkInLogs')
      setLogs([])
      setFilteredLogs([])
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Date', 'Time'],
      ...filteredLogs.map(log => [
        log.timestamp,
        format(log.date, 'yyyy-MM-dd'),
        format(log.date, 'HH:mm:ss')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `check-in-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-6 sm:gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Check-in Logs</h1>
            <p className="text-muted-foreground">
              View and manage all check-in records
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={clearAllLogs} variant="outline" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>

        {/* Logs Display */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Check-in Records</h3>
            <span className="text-sm text-muted-foreground">
              {filteredLogs.length} of {logs.length} total records
            </span>
          </div>
          
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {logs.length === 0 ? "No check-in records found" : "No records match your filters"}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{format(log.date, 'dd/MM/yyyy')}</div>
                    <div className="text-sm text-muted-foreground">{format(log.date, 'p')}{log.userName ? ` — ${log.userName}` : ''}</div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {format(log.date, 'HH:mm:ss')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Main>
    </>
  )
}