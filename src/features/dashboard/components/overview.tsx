import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { format, subMonths } from "date-fns";
import { useMemo } from "react";

interface OverviewProps {
  checkinsData: any[];
}

export function Overview({ checkinsData }: OverviewProps) {
  const monthlyData = useMemo(() => {
    // Generate last 12 months
    const months: Array<{ name: string; month: string; total: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      months.push({
        name: format(monthDate, "MMM"),
        month: format(monthDate, "yyyy-MM"),
        total: 0,
      });
    }

    // Count check-ins per month
    checkinsData.forEach((checkin) => {
      try {
        const date = new Date(checkin.submittedAt);
        const monthKey = format(date, "yyyy-MM");
        const month = months.find((m) => m.month === monthKey);
        if (month) {
          month.total++;
        }
      } catch {
        // Skip invalid dates
      }
    });

    return months;
  }, [checkinsData]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={monthlyData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  );
}
