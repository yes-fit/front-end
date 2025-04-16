import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { type BookingSlot, getUserBookings } from "@/lib/api/mockData";
import {
  Area,
  AreaChart,
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

// Helper function to get day name
const getDayName = (dayIndex: number) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex];
};

export function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    bookingsByDay: [0, 0, 0, 0, 0, 0, 0], // Sun to Sat
    bookingsByHour: new Array(24).fill(0),
    mostFrequentDay: "",
    mostFrequentTime: "",
  });

  useEffect(() => {
    if (user) {
      // Get user bookings
      const userBookings = getUserBookings(user.id);
      setBookings(userBookings);

      // Calculate statistics
      const now = new Date();
      const upcoming = userBookings.filter((booking) => {
        const bookingDate = parseISO(`${booking.date}T${booking.hour.toString().padStart(2, "0")}:00:00`);
        return bookingDate > now;
      });

      // Count bookings by day of week
      const bookingsByDay = [0, 0, 0, 0, 0, 0, 0];
      const bookingsByHour = new Array(24).fill(0);

      for (const booking of userBookings) {
        const date = new Date(booking.date);
        const dayOfWeek = date.getDay();
        bookingsByDay[dayOfWeek]++;
        bookingsByHour[booking.hour]++;
      }

      // Find most frequent day and time
      let maxDayValue = 0;
      let maxDayIndex = 0;
      for (let i = 0; i < bookingsByDay.length; i++) {
        if (bookingsByDay[i] > maxDayValue) {
          maxDayValue = bookingsByDay[i];
          maxDayIndex = i;
        }
      }

      let maxHourValue = 0;
      let maxHourIndex = 0;
      for (let i = 0; i < bookingsByHour.length; i++) {
        if (bookingsByHour[i] > maxHourValue) {
          maxHourValue = bookingsByHour[i];
          maxHourIndex = i;
        }
      }

      const formatHour = (hour: number) => {
        const h = hour % 12 || 12;
        const ampm = hour >= 12 ? "PM" : "AM";
        return `${h}:00 ${ampm}`;
      };

      setStats({
        totalBookings: userBookings.length,
        upcomingBookings: upcoming.length,
        bookingsByDay,
        bookingsByHour,
        mostFrequentDay: maxDayValue > 0 ? getDayName(maxDayIndex) : "None",
        mostFrequentTime: maxHourValue > 0 ? formatHour(maxHourIndex) : "None",
      });

      setLoading(false);
    }
  }, [user]);

  // Prepare data for charts
  const dayChartData = stats.bookingsByDay.map((count, index) => ({
    name: getDayName(index).substring(0, 3),
    bookings: count,
  }));

  const hourChartData = stats.bookingsByHour
    .map((count, hour) => ({ hour, count }))
    .filter((data) => data.hour >= 6 && data.hour <= 22); // Filter to relevant hours (6 AM to 10 PM)

  const formatHourLabel = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${h} ${ampm}`;
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
        <Button asChild>
          <Link to="/book">Book a Session</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Bookings</CardTitle>
            <CardDescription>Your lifetime gym sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Scheduled gym sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.upcomingBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Best Workout Day</CardTitle>
            <CardDescription>Your most active day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.mostFrequentDay}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Workouts by Day</CardTitle>
            <CardDescription>Distribution of your gym visits by day of week</CardDescription>
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
            <CardTitle>Workouts by Time</CardTitle>
            <CardDescription>Distribution of your gym visits by time of day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={formatHourLabel}
                  ticks={[6, 8, 10, 12, 14, 16, 18, 20, 22]}
                />
                <YAxis />
                <Tooltip labelFormatter={(hour) => `Time: ${formatHourLabel(Number(hour))}`} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#93c5fd" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Your scheduled gym sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading your bookings...</p>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings
                  .filter((booking) => {
                    const bookingDate = new Date(booking.date);
                    return bookingDate >= new Date();
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    if (dateA.getTime() !== dateB.getTime()) {
                      return dateA.getTime() - dateB.getTime();
                    }
                    return a.hour - b.hour;
                  })
                  .slice(0, 5)
                  .map((booking) => {
                    const date = new Date(booking.date);
                    const hourFormatted = booking.hour % 12 || 12;
                    const ampm = booking.hour >= 12 ? "PM" : "AM";
                    return (
                      <div key={booking.id} className="flex justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{format(date, "EEEE, MMMM do, yyyy")}</div>
                          <div className="text-sm text-muted-foreground">
                            {hourFormatted}:00 {ampm} - {hourFormatted}:59 {ampm}
                          </div>
                        </div>
                        <div className="self-center">
                          <Button variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-center py-4">
                You don't have any upcoming bookings.{" "}
                <Link to="/book" className="font-medium text-primary hover:underline">
                  Book a session
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
