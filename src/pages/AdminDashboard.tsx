import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { getAuditLogs, getGymUsageStats } from "@/lib/api/mockData";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";

type GymUsageStats = {
  totalBookings: number;
  bookingsByDayOfWeek: number[];
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  departmentDistribution: Record<string, number>;
  topUsers: {
    id: string;
    name: string;
    email: string;
    department: string;
    bookingsCount: number;
  }[];
  currentActiveUsers: number;
};

// Helper function to get day name
const getDayName = (dayIndex: number) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex];
};

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GymUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get gym usage statistics
    const usageStats = getGymUsageStats();
    setStats(usageStats);
    setLoading(false);
  }, []);

  const handleGenerateReport = () => {
    if (!stats) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Enterprise Gym Usage Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), "MMMM do, yyyy")}`, 20, 30);

    // Key metrics
    doc.setFontSize(16);
    doc.text("Key Metrics", 20, 45);

    doc.setFontSize(12);
    doc.text(`Total Bookings: ${stats.totalBookings}`, 20, 55);
    doc.text(`Current Active Users: ${stats.currentActiveUsers}`, 20, 65);

    // Gender distribution
    doc.setFontSize(16);
    doc.text("Gender Distribution", 20, 80);

    doc.setFontSize(12);
    doc.text(`Male: ${stats.genderDistribution.male}`, 20, 90);
    doc.text(`Female: ${stats.genderDistribution.female}`, 20, 100);
   

    // Top departments
    doc.setFontSize(16);
    doc.text("Top Departments", 20, 130);

    const departments = Object.entries(stats.departmentDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    doc.setFontSize(12);
    departments.forEach((dept, index) => {
      doc.text(`${dept[0]}: ${dept[1]} bookings`, 20, 140 + index * 10);
    });

    // Save the PDF
    doc.save("gym-usage-report.pdf");
  };

  // Prepare data for charts
  const dayChartData = stats?.bookingsByDayOfWeek.map((count, index) => ({
    name: getDayName(index).substring(0, 3),
    bookings: count,
  })) || [];

  const genderData = stats ? [
    { name: "Male", value: stats.genderDistribution.male },
    { name: "Female", value: stats.genderDistribution.female },
   
  ] : [];

  const departmentData = stats
    ? Object.entries(stats.departmentDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleGenerateReport} disabled={!stats}>
          Generate Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Bookings</CardTitle>
            <CardDescription>All-time gym sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalBookings || "Loading..."}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Current Active Users</CardTitle>
            <CardDescription>Users currently in the gym</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.currentActiveUsers || "Loading..."}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Most Popular Day</CardTitle>
            <CardDescription>Highest gym usage</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-3xl font-bold">
                {getDayName(stats.bookingsByDayOfWeek.indexOf(Math.max(...stats.bookingsByDayOfWeek)))}
              </div>
            ) : (
              "Loading..."
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Gym Usage by Day</CardTitle>
            <CardDescription>Distribution of gym visits by day of week</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Breakdown of gym users by gender</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Gym usage by department</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Users</CardTitle>
            <CardDescription>Most frequent gym visitors</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading top users...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.topUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell className="text-right">{user.bookingsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Logs</CardTitle>
            <CardDescription>Latest gym activities and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading activity logs...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getAuditLogs(1, 5).logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action === "login"
                              ? "bg-green-100 text-green-800"
                              : log.action === "logout"
                              ? "bg-gray-100 text-gray-800"
                              : log.action === "booking_created"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {log.action.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
