import { useEffect, useState } from "react";
import { format, isAfter, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BookingSlot {
  id: string;
  startTime: string;
  endTime: string;
  availableSpots: number;
  totalSpots: number;
}

export function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user?.token) {
        toast.error("You must be logged in to view your bookings.");
        return;
      }

      try {
        const response = await fetch("https://gym-test-fmui.onrender.com/api/v1/view", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const data = await response.json();
        setBookings(data.bookedSessions || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load your bookings.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserBookings();
    }
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!user?.token) {
      toast.error("You must be logged in to cancel a booking.");
      return;
    }

    try {
      const response = await fetch("https://gym-test-fmui.onrender.com/api/v1/delete", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: bookingId }),
      });

      const result = await response.json();
      if (result.responseCode === "00") {
        toast.success("Booking cancelled successfully");
        setBookings(bookings.filter((booking) => booking.id !== bookingId));
      } else {
        toast.error("Failed to cancel booking: " + result.responseMessage);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("An error occurred while cancelling the booking.");
    }
  };

  const now = new Date();

  // Split bookings into upcoming and past
  const upcomingBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.startTime);
    return isAfter(bookingDate, now);
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.startTime);
    return !isAfter(bookingDate, now);
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const formatTimeSlot = (time: string) => {
    const hour = new Date(time).getHours();
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
                const date = new Date(booking.startTime);
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
                              {formatTimeSlot(booking.startTime)}
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
                const date = new Date(booking.startTime);
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
                              {formatTimeSlot(booking.startTime)}
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