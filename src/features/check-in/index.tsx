import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/auth-store'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function CheckIn() {
  const { auth: { user: authUser } } = useAuthStore()
  const [isCheckInAllowed, setIsCheckInAllowed] = useState(true)
  const [checkInLogs, setCheckInLogs] = useState<Array<{ timestamp: string; userId: string; userName: string; userEmail: string }>>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load check-in logs from localStorage on component mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('checkInLogs')
    if (!savedLogs) return
    try {
      const parsed = JSON.parse(savedLogs) as Array<string | { timestamp: string; userId: string; userName: string; userEmail: string }>
      const normalized = parsed.map((entry) =>
        typeof entry === 'string'
          ? { timestamp: entry, userId: '', userName: '', userEmail: '' }
          : entry
      )
      setCheckInLogs(normalized)
    } catch {
      setCheckInLogs([])
    }
  }, [])

  // Simple logic: allow check-in between 8 AM and 6 PM
  useEffect(() => {
    const hour = currentTime.getHours()
    setIsCheckInAllowed(hour >= 8 && hour < 18)
  }, [currentTime])

  const handleCheckIn = () => {
    const timestamp = new Date().toISOString()
    const entry = {
      timestamp,
      userId: authUser?.accountNo || '',
      userName: authUser?.email || authUser?.accountNo || '',
      userEmail: authUser?.email || '',
    }
    const newLogs = [...checkInLogs, entry]
    setCheckInLogs(newLogs)
    localStorage.setItem('checkInLogs', JSON.stringify(newLogs))
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Check In</h1>
            <p className="text-muted-foreground text-lg">
              {isCheckInAllowed 
                ? "Ready to check in! Click the button below."
                : "Check-in is currently not available. Hours: 8 AM - 6 PM"
              }
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Current time: {currentTime.toLocaleTimeString()}
            </p>
          </div>

          <Button
            onClick={handleCheckIn}
            disabled={!isCheckInAllowed}
            className={`w-64 h-64 text-2xl font-bold rounded-full transition-all duration-300 transform hover:scale-105 ${
              isCheckInAllowed
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-red-500 text-white cursor-not-allowed opacity-75'
            }`}
          >
            {isCheckInAllowed ? 'CHECK IN' : 'NOT ALLOWED'}
          </Button>

          {checkInLogs.length > 0 && (
            <Card className="w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Check-ins</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {checkInLogs.slice(-5).reverse().map((log, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy')} {log.userName ? `— ${log.userName}` : ''}
                  </div>
                ))}
              </div>
              {checkInLogs.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing last 5 of {checkInLogs.length} check-ins
                </p>
              )}
            </Card>
          )}
        </div>
      </Main>
    </>
  )
}