import { useState } from "react";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { useAuth } from "@/hooks/useAuth"; 
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define BookingStatus type
type BookingStatus = {
  success?: boolean;
  message?: string;
};

// Define BookingSlot type
export type BookingSlot = {
  id: string;
  date: string; // ISO format
  hour: number; // 0-23
  availableSpots: number;
  totalSpots: number;
  bookedBy: string[]; // user IDs
};

// Fetch available slots from the API
export const fetchAvailableSlots = async (date: string, token: string): Promise<BookingSlot[]> => {
  const url = "https://gymapp-ho99.onrender.com/api/v1/available"; 
  console.log(`Fetching available slots for date: ${date}`); 
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // Include token for authentication
    },
    body: JSON.stringify({ date }), // Send date in the request body
  });

  if (!response.ok) {
    console.error("Error fetching available slots"); 
    throw new Error("Error fetching available slots");
  }

  const data = await response.json();
  console.log("Available slots data:", data); 

  // Defensive check: Ensure availabilityList exists and is an array
  if (!data.availabilityList || !Array.isArray(data.availabilityList)) {
    toast.info("No available slots for this date."); 
    return []; // Return an empty array if no slots are available
  }

  return data.availabilityList.map((slot: { hour: number; available: boolean }) => ({
    id: `slot-${slot.hour}`,
    date: date,
    hour: slot.hour,
    availableSpots: slot.available ? 1 : 0,
    totalSpots: 50, 
    bookedBy: [],
  }));
};

// Book a slot using the API
export const bookSlot = async (startTime: string, token: string): Promise<{ success: boolean; message: string }> => {
  const url = "https://gymapp-ho99.onrender.com/api/v1/bookSession"; 
  console.log(`Booking slot at: ${startTime}`); 
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, 
    },
    body: JSON.stringify({ startTime }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Booking failed:", errorData); 
    return { success: false, message: errorData.responseMessage || "Booking failed" };
  }

  const data = await response.json();
  console.log("Booking result:", data); 
  return { success: true, message: "Booking successful" };
};

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
      console.log(`Selected date changed to: ${dateString}`); 
      if (!user || !user.token) {
        toast.error("You must be logged in to fetch slots.");
        return;
      }

      try {
        const slots = await fetchAvailableSlots(dateString, user.token); 
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error fetching available slots:", error);
        toast.error("Failed to fetch available slots. Please try again.");
      }
    } else {
      setAvailableSlots([]);
    }
  };

  const handleSlotSelect = (slot: BookingSlot) => {
    console.log(`Slot selected: ${slot.id}`); 
    setSelectedSlot(slot);
    setBookingStatus(null);
  };

  const handleBookSlot = async () => {
    if (!user || !user.token || !selectedSlot) {
      toast.error("You must be logged in and select a slot to book.");
      return;
    }

    setIsLoading(true);
    setBookingStatus(null);

    const startTime = `${selectedSlot.date}T${selectedSlot.hour}:00:00`;
    console.log(`Attempting to book slot at: ${startTime}`); 
    try {
      const bookingResult = await bookSlot(startTime, user.token); 

      if (bookingResult.success) {
        toast.success("Session booked successfully!");
        setBookingStatus({ success: true, message: "Booking confirmed! See you at the gym." });
        await handleDateChange(selectedDate);
        setSelectedSlot(null);
      } else {
        toast.error("Booking failed");
        setBookingStatus({ success: false, message: bookingResult.message });
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("An error occurred while booking.");
      setBookingStatus({ success: false, message: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeSlot = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const hourFormatted = hour % 12 || 12;
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
                      <span>{formatTimeSlot(slot.hour)}</span>
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