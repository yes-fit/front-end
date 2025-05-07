import { useState } from "react";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define BookingStatus type
type BookingStatus = {
  success?: boolean;
  message?: string;
};

// Define Slot type
interface BookingSlot {
  id: string;
  startTime: string;
  endTime: string;
  availableSpots: number;
  totalSpots: number;
}

export function BookingPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(null);

  // Load available slots when date changes
  const handleDateChange = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setBookingStatus(null);

    if (date) {
      const dateString = format(date, "yyyy-MM-dd");
      try {
        const response = await fetch(`https://gym-application2.onrender.com/api/v1/view`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setAvailableSlots(data.bookedSessions.filter((slot: BookingSlot) => slot.startTime.startsWith(dateString)));
      } catch (error) {
        console.error("Error fetching available slots:", error);
      }
    } else {
      setAvailableSlots([]);
    }
  };

  const handleSlotSelect = (slot: BookingSlot) => {
    setSelectedSlot(slot);
    setBookingStatus(null);
  };

  const handleBookSlot = async () => {
    if (!user || !selectedSlot) return;

    setIsLoading(true);
    setBookingStatus(null);

    try {
      const response = await fetch(`https://gym-application2.onrender.com/api/v1/bookSession`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`, // Use the token here
        },
        body: JSON.stringify({ startTime: selectedSlot.startTime }),
      });
      const result = await response.json();

      if (result.responseCode === "00") {
        toast.success("Session booked successfully!");
        setBookingStatus({ success: true, message: "Booking confirmed! See you at the gym." });
        // Refresh available slots
        await handleDateChange(selectedDate);
        setSelectedSlot(null);
      } else {
        toast.error("Booking failed");
        setBookingStatus({ success: false, message: result.responseMessage });
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("An error occurred while booking");
      setBookingStatus({ success: false, message: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeSlot = (hour: string) => {
    const time = new Date(hour);
    const hourFormatted = time.getHours() % 12 || 12;
    const ampm = time.getHours() >= 12 ? "PM" : "AM";
    return `${hourFormatted}:00 ${ampm} - ${hourFormatted}:59 ${ampm}`;
  };

  const today = new Date();
  const disabledDays = { before: addDays(today, 1) }; // 24 hours in advance rule
  const maxDate = addDays(today, 30); // Maximum 1 month in advance

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Book a Gym Session</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date for your gym session</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              disabled={disabledDays}
              toDate={maxDate}
              className="mx-auto"
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
            <p>* Bookings must be made at least 24 hours in advance</p>
            <p>* Maximum 2 sessions per day (not consecutive)</p>
            <p>* Maximum 3 sessions per week</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
            <CardDescription>
              {selectedDate
                ? `Available slots for ${format(selectedDate, "EEEE, MMMM do, yyyy")}`
                : "Select a date to see available slots"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                      onClick={() => handleSlotSelect(slot)}
                      className="justify-between"
                    >
                      <span>{formatTimeSlot(slot.startTime)}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4">No available slots for this date.</p>
              )
            ) : (
              <p className="text-center py-4">Please select a date first.</p>
            )}

            {bookingStatus && (
              <Alert className={`mt-4 ${bookingStatus.success ? "bg-green-50" : "bg-red-50"}`}>
                <AlertTitle>{bookingStatus.success ? "Success" : "Cannot Book"}</AlertTitle>
                <AlertDescription>{bookingStatus.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={!selectedSlot || isLoading || Boolean(bookingStatus && !bookingStatus.success)}
              onClick={handleBookSlot}
            >
              {isLoading ? "Booking..." : "Book Session"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}