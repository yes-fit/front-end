import { useEffect, useState } from "react";
import { format, isAfter, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type BookingSlot, getUserBookings } from "@/lib/api/mockData";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch user bookings
      const userBookings = getUserBookings(user.id);
      setBookings(userBookings);
      setLoading(false);
    }
  }, [user]);

  const handleCancelBooking = (bookingId: string) => {
    // In a real app, this would call an API to cancel the booking
    toast.success("Booking cancelled successfully");

    // Update local state to reflect the cancellation
    setBookings(bookings.filter((booking) => booking.id !== bookingId));
  };

  const now = new Date();

  // Split bookings into upcoming and past
  const upcomingBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(`${booking.date}T${booking.hour.toString().padStart(2, "0")}:00:00`);
    return isAfter(bookingDate, now);
  }).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.hour - b.hour;
  });

  const pastBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(`${booking.date}T${booking.hour.toString().padStart(2, "0")}:00:00`);
    return !isAfter(bookingDate, now);
  }).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime(); // Most recent first
    }
    return b.hour - a.hour;
  });

  const formatTimeSlot = (hour: number) => {
    const hourFormatted = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hourFormatted}:00 ${ampm} - ${hourFormatted}:59 ${ampm}`;
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Button asChild>
          <Link to="/book">Book New Session</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading your bookings...</p>
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">
              Upcoming Sessions ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Sessions ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Alert>
                <AlertTitle>No upcoming bookings</AlertTitle>
                <AlertDescription>
                  You don't have any upcoming gym sessions.{" "}
                  <Link to="/book" className="font-medium text-primary hover:underline">
                    Book a session
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
              upcomingBookings.map((booking) => {
                const date = new Date(booking.date);
                return (
                  <Card key={booking.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="bg-primary p-6 text-white text-center md:w-48 flex flex-col justify-center items-center">
                        <div className="text-3xl font-bold">{format(date, "dd")}</div>
                        <div className="text-xl">{format(date, "MMM")}</div>
                        <div className="mt-2">{format(date, "EEEE")}</div>
                      </div>
                      <CardContent className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h3 className="text-xl font-bold">Gym Session</h3>
                            <p className="text-gray-500">
                              {formatTimeSlot(booking.hour)}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0">
                            <Button
                              variant="outline"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel Booking
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>Location: Enterprise Gym, Main Building</p>
                          <p className="mt-1">
                            Spots available: {booking.availableSpots}/{booking.totalSpots}
                          </p>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Alert>
                <AlertTitle>No past sessions</AlertTitle>
                <AlertDescription>
                  You haven't attended any gym sessions yet.
                </AlertDescription>
              </Alert>
            ) : (
              pastBookings.map((booking) => {
                const date = new Date(booking.date);
                return (
                  <Card key={booking.id} className="overflow-hidden opacity-80">
                    <div className="flex flex-col md:flex-row">
                      <div className="bg-gray-500 p-6 text-white text-center md:w-48 flex flex-col justify-center items-center">
                        <div className="text-3xl font-bold">{format(date, "dd")}</div>
                        <div className="text-xl">{format(date, "MMM")}</div>
                        <div className="mt-2">{format(date, "EEEE")}</div>
                      </div>
                      <CardContent className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h3 className="text-xl font-bold">Completed Session</h3>
                            <p className="text-gray-500">
                              {formatTimeSlot(booking.hour)}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0">
                            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Completed
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>Location: Enterprise Gym, Main Building</p>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
