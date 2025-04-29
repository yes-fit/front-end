import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { getAuditLogs, getGymUsageStats, mockBookings, mockSlots, mockUsers } from "@/lib/api/mockData";
import { format, parse, startOfMonth, endOfMonth, isWithinInterval, getMonth } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jsPDF } from "jspdf";

interface UsageMetrics {
  totalBookingsCount: number;
  averageSessionsPerDay: number;
  peakHours: { hour: number; count: number }[];
  peakDays: { day: string; count: number }[];
  usageByMonth: { month: string; count: number }[];
  repeatUsers: { count: number; percentage: number };
  popularTimeSlots: { time: string; count: number }[];
  departmentUsage: { department: string; count: number; percentage: number }[];
  monthlyTrend: { month: string; count: number }[];
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "quarter" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);

  // Calculate analytics on component mount or when timeframe changes
  useEffect(() => {
    setLoading(true);

    
    calculateMetrics(timeFrame);

    setLoading(false);
  }, [timeFrame]);

  const calculateMetrics = (timeframe: string) => {
    // Get basic stats from mock data
    const stats = getGymUsageStats();

    // Filter bookings based on timeframe
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "quarter":
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case "month":
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    // Filter bookings for the selected timeframe
    const filteredBookings = mockBookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= startDate;
    });

    // Calculate peak hours
    const hourCounts: Record<number, number> = {};
    filteredBookings.forEach(booking => {
      const slot = mockSlots.find(s => s.id === booking.slotId);
      if (slot) {
        hourCounts[slot.hour] = (hourCounts[slot.hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: Number.parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate peak days
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayCounts: Record<string, number> = {};

    filteredBookings.forEach(booking => {
      const slot = mockSlots.find(s => s.id === booking.slotId);
      if (slot) {
        const date = parse(slot.date, "yyyy-MM-dd", new Date());
        const dayName = dayNames[date.getDay()];
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
      }
    });

    const peakDays = Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate usage by month
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthCounts: Record<string, number> = {};

    filteredBookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      const monthName = monthNames[date.getMonth()];
      monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
    });

    const usageByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const aIndex = monthNames.indexOf(a.month);
        const bIndex = monthNames.indexOf(b.month);
        return aIndex - bIndex;
      });

    // Calculate repeat user frequency
    const userVisitCounts: Record<string, number> = {};

    filteredBookings.forEach(booking => {
      userVisitCounts[booking.userId] = (userVisitCounts[booking.userId] || 0) + 1;
    });

    const repeatUserCount = Object.values(userVisitCounts).filter(count => count > 1).length;
    const totalUserCount = Object.keys(userVisitCounts).length;
    const repeatUserPercentage = totalUserCount > 0 ? (repeatUserCount / totalUserCount) * 100 : 0;

    // Calculate popular time slots
    const timeSlotCounts: Record<string, number> = {};

    filteredBookings.forEach(booking => {
      const slot = mockSlots.find(s => s.id === booking.slotId);
      if (slot) {
        const hour = slot.hour;
        const formattedHour = hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
        timeSlotCounts[formattedHour] = (timeSlotCounts[formattedHour] || 0) + 1;
      }
    });

    const popularTimeSlots = Object.entries(timeSlotCounts)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate department usage
    const departmentCounts: Record<string, number> = {};

    filteredBookings.forEach(booking => {
      const user = mockUsers.find(u => u.id === booking.userId);
      if (user) {
        departmentCounts[user.department] = (departmentCounts[user.department] || 0) + 1;
      }
    });

    const totalBookings = filteredBookings.length;
    const departmentUsage = Object.entries(departmentCounts)
      .map(([department, count]) => ({
        department,
        count,
        percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate monthly trend for the past year
    const monthlyTrend: { month: string; count: number }[] = [];
    const currentMonth = now.getMonth();

    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - i + 12) % 12; // Loop backward through months
      const monthName = monthNames[monthIndex];

      // Filter bookings for this month
      const monthCount = filteredBookings.filter(booking => {
        const date = new Date(booking.createdAt);
        return date.getMonth() === monthIndex;
      }).length;

      monthlyTrend.unshift({ month: monthName, count: monthCount }); // Add to front of array
    }

    // Set metrics
    setMetrics({
      totalBookingsCount: filteredBookings.length,
      averageSessionsPerDay: filteredBookings.length / 30, // Simplified, should be calculated based on actual timeframe
      peakHours,
      peakDays,
      usageByMonth,
      repeatUsers: {
        count: repeatUserCount,
        percentage: repeatUserPercentage,
      },
      popularTimeSlots,
      departmentUsage,
      monthlyTrend,
    });
  };

  const handleGenerateReport = () => {
    if (!metrics) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Enterprise Gym Analytics Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), "MMMM do, yyyy")}`, 20, 30);
    doc.text(`Time period: ${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}`, 20, 40);

    // Key metrics
    doc.setFontSize(16);
    doc.text("Key Metrics", 20, 55);

    doc.setFontSize(12);
    doc.text(`Total Bookings: ${metrics.totalBookingsCount}`, 20, 65);
    doc.text(`Average Sessions Per Day: ${metrics.averageSessionsPerDay.toFixed(2)}`, 20, 75);
    doc.text(`Repeat Users: ${metrics.repeatUsers.percentage.toFixed(2)}%`, 20, 85);

    // Top times and days
    doc.setFontSize(16);
    doc.text("Peak Usage Times", 20, 100);

    doc.setFontSize(12);
    metrics.peakHours.slice(0, 3).forEach((hour, index) => {
      const formattedHour = hour.hour < 12 ? `${hour.hour} AM` : hour.hour === 12 ? "12 PM" : `${hour.hour - 12} PM`;
      doc.text(`${index + 1}. ${formattedHour} - ${hour.count} bookings`, 20, 110 + index * 10);
    });

    doc.setFontSize(16);
    doc.text("Peak Days", 20, 145);

    doc.setFontSize(12);
    metrics.peakDays.slice(0, 3).forEach((day, index) => {
      doc.text(`${index + 1}. ${day.day} - ${day.count} bookings`, 20, 155 + index * 10);
    });

    // Department usage
    doc.setFontSize(16);
    doc.text("Department Usage", 20, 190);

    doc.setFontSize(12);
    metrics.departmentUsage.slice(0, 5).forEach((dept, index) => {
      doc.text(`${dept.department}: ${dept.count} bookings (${dept.percentage.toFixed(2)}%)`, 20, 200 + index * 10);
    });

    // Save the PDF
    doc.save("gym-analytics-report.pdf");
  };

  // Format hour for display
  const formatHour = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${h} ${ampm}`;
  };

  // Custom colors for charts
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gym Usage Analytics</h1>
        <div className="flex gap-2">
          <Select
            defaultValue="month"
            onValueChange={(value) => setTimeFrame(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="quarter">Past Quarter</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleGenerateReport} disabled={!metrics}>
            Download Report
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading analytics...</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">
              Overview & Trends
            </TabsTrigger>
            <TabsTrigger value="usage">
              Usage Patterns
            </TabsTrigger>
            <TabsTrigger value="demographics">
              User Demographics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Total Bookings</CardTitle>
                  <CardDescription>Period: {timeFrame}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics?.totalBookingsCount || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Avg. Sessions</CardTitle>
                  <CardDescription>Per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics?.averageSessionsPerDay.toFixed(1) || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Most Popular Day</CardTitle>
                  <CardDescription>Highest gym usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics?.peakDays[0]?.day || "N/A"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Most Popular Time</CardTitle>
                  <CardDescription>Highest traffic hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {metrics?.peakHours[0] ? formatHour(metrics.peakHours[0].hour) : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Gym Usage Trend</CardTitle>
                <CardDescription>Booking trends over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.monthlyTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Bookings"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Engagement Stats */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Repeat Users</CardTitle>
                  <CardDescription>Percentage of users who visit multiple times</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex flex-col justify-center items-center">
                  <div className="text-6xl font-bold text-primary">
                    {metrics?.repeatUsers.percentage.toFixed(1)}%
                  </div>
                  <p className="text-muted-foreground mt-2">
                    {metrics?.repeatUsers.count} users visited more than once
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Distribution</CardTitle>
                  <CardDescription>Gym usage breakdown by month</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.usageByMonth || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usage Patterns Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                  <CardDescription>Most popular gym hours</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics?.peakHours.map(h => ({ hour: formatHour(h.hour), count: h.count })) || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Days</CardTitle>
                  <CardDescription>Most popular gym days</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.peakDays || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Most Popular Time Slots</CardTitle>
                <CardDescription>Top 5 time slots by booking frequency</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-5 h-full">
                  {metrics?.popularTimeSlots.map((slot, index) => (
                    <div key={slot.time} className="flex flex-col h-full">
                      <div className="flex-1 flex items-end pb-4">
                        <div
                          className="w-full bg-blue-500 rounded-t-md"
                          style={{
                            height: `${(slot.count / (metrics.popularTimeSlots[0]?.count || 1)) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{slot.time}</div>
                        <div className="text-sm text-muted-foreground">{slot.count} bookings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Patterns Insights</CardTitle>
                <CardDescription>Key findings and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Peak Times</h3>
                    <p className="text-muted-foreground">
                      The gym experiences highest usage during {metrics?.peakHours[0] ? formatHour(metrics.peakHours[0].hour) : "evening"} hours.
                      Consider adding more staff during these times to ensure safety and equipment availability.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Weekly Patterns</h3>
                    <p className="text-muted-foreground">
                      {metrics?.peakDays[0]?.day || "Weekdays"} show the highest booking rate, while
                      {metrics?.peakDays[metrics.peakDays.length - 1]?.day || "weekends"} have the lowest attendance.
                      Consider implementing special programs on low-attendance days to increase usage.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Optimization Opportunities</h3>
                    <p className="text-muted-foreground">
                      Based on the current usage patterns, there may be opportunities to optimize gym hours and
                      resource allocation. Consider extending hours during peak days and potentially reducing hours
                      during consistently low-usage periods.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Department Usage</CardTitle>
                  <CardDescription>Gym usage by department</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics?.departmentUsage || []}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="department"
                        label={({ department, percent }) => `${department}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {(metrics?.departmentUsage || []).map((entry, index) => (
                          <Cell key={`cell-${entry.department}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [`${value} bookings`, props.payload.department]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Engagement</CardTitle>
                  <CardDescription>Comparative usage statistics</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics?.departmentUsage || []}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="department" />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Demographics Insights</CardTitle>
                <CardDescription>Departmental usage patterns and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Department Engagement</h3>
                    <p className="text-muted-foreground">
                      {metrics?.departmentUsage[0]?.department || "Engineering"} shows the highest gym usage at
                      {metrics?.departmentUsage[0]?.percentage.toFixed(1) || 0}%, while
                      {metrics?.departmentUsage[metrics?.departmentUsage.length - 1]?.department || "Marketing"} has the lowest
                      at {metrics?.departmentUsage[metrics?.departmentUsage.length - 1]?.percentage.toFixed(1) || 0}%.
                      Consider targeted wellness campaigns for departments with lower engagement.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Participation Rates</h3>
                    <p className="text-muted-foreground">
                      Overall, approximately {metrics?.repeatUsers.percentage.toFixed(1) || 0}% of users who book gym sessions
                      return for additional workouts. This indicates a good retention rate and suggests the facility is meeting
                      user expectations. Continue to gather feedback to maintain this positive trend.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Wellness Program Opportunities</h3>
                    <p className="text-muted-foreground">
                      Based on department usage patterns, consider implementing targeted wellness programs for
                      specific departments. For example, early morning sessions for finance teams or lunchtime
                      express workouts for marketing teams may help increase engagement from less active departments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
