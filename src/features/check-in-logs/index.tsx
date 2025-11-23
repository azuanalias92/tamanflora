import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface CheckInLog {
  id: string;
  checkpointId: string;
  checkpointName?: string;
  residentName?: string;
  vehiclePlate?: string;
  timestamp: string;
  date: Date;
}

interface GroupedLogs {
  [checkpointId: string]: {
    checkpointName: string;
    logs: CheckInLog[];
  };
}

export function CheckInLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Fetch check-in logs from API
  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ["check-in-logs"],
    queryFn: async () => {
      const token = useAuthStore.getState().auth.accessToken;
      const res = await fetch("/api/check-in", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch check-ins");
      const json = res.status === 204 ? [] : await res.json();
      return (json as any[]).map((item) => ({
        id: item.id,
        checkpointId: item.checkpointId || item.checkpoint_id,
        checkpointName: item.checkpointName || item.checkpoint_name,
        residentName: item.residentName || item.resident_name,
        vehiclePlate: item.vehiclePlate || item.vehicle_plate,
        timestamp: item.timestamp || item.created_at,
        date: new Date(item.timestamp || item.created_at),
      }));
    },
  });

  // Fetch checkpoints for names
  const { data: checkpoints = [] } = useQuery({
    queryKey: ["checkpoints"],
    queryFn: async () => {
      const token = useAuthStore.getState().auth.accessToken;
      const res = await fetch("/api/checkpoints", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch checkpoints");
      return res.json();
    },
  });

  // Filter and group logs
  const groupedLogs = useMemo(() => {
    let filtered = checkIns;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.checkpointName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          format(log.date, "dd/MM/yyyy p").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter((log) => log.date >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => log.date <= endOfDay);
    }

    // Group by checkpoint
    const grouped: GroupedLogs = {};
    filtered.forEach((log) => {
      const checkpointId = log.checkpointId;
      if (!grouped[checkpointId]) {
        const checkpoint = checkpoints.find((cp: any) => cp.id === checkpointId);
        grouped[checkpointId] = {
          checkpointName: checkpoint?.name || log.checkpointName || checkpointId,
          logs: [],
        };
      }
      grouped[checkpointId].logs.push(log);
    });

    // Sort logs within each group by date descending
    Object.values(grouped).forEach((group) => {
      group.logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    return grouped;
  }, [checkIns, checkpoints, searchTerm, dateFrom, dateTo]);

  const totalLogs = Object.values(groupedLogs).reduce((sum, group) => sum + group.logs.length, 0);

  const exportLogs = () => {
    const csvContent = [
      ["Checkpoint", "Resident", "Vehicle Plate", "Date", "Time"],
      ...Object.entries(groupedLogs).flatMap(([_, group]) =>
        group.logs.map((log) => [group.checkpointName, log.residentName || "-", log.vehiclePlate || "-", format(log.date, "yyyy-MM-dd"), format(log.date, "HH:mm:ss")])
      ),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `check-in-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            <p className="text-muted-foreground">View check-in records grouped by checkpoint</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportLogs} variant="outline" size="sm" disabled={totalLogs === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
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
                <Input placeholder="Search checkpoint, resident, plate..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>

        {/* Grouped Logs Display */}
        {isLoading ? (
          <Card className="p-6">
            <div className="text-center py-8 text-muted-foreground">Loading check-in logs...</div>
          </Card>
        ) : totalLogs === 0 ? (
          <Card className="p-6">
            <div className="text-center py-8 text-muted-foreground">{checkIns.length === 0 ? "No check-in records found" : "No records match your filters"}</div>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedLogs).map(([checkpointId, group]) => (
              <Card key={checkpointId} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{group.checkpointName}</h3>
                  <span className="text-sm text-muted-foreground">{group.logs.length} records</span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {group.logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{log.residentName || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.vehiclePlate && `${log.vehiclePlate} • `}
                          {format(log.date, "dd/MM/yyyy p")}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{format(log.date, "HH:mm:ss")}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Main>
    </>
  );
}
