import { addDays, format, isAfter, isBefore, isSameDay, parse, parseISO, startOfDay } from "date-fns";

export type BookingSlot = {
  id: string;
  date: string; // ISO format
  hour: number; // 0-23
  availableSpots: number;
  totalSpots: number;
  bookedBy: string[]; // user IDs
};

export type Booking = {
  id: string;
  userId: string;
  slotId: string;
  createdAt: string; // ISO format
};

export type GymUser = {
  id: string;
  email: string;
  name: string;
  gender: "male" | "female" | "other";
  department: string;
  bookingHistory: string[]; // booking IDs
};

export type AuditLog = {
  id: string;
  userId: string;
  action: "login" | "logout" | "booking_created" | "booking_cancelled" | "admin_action";
  details: string;
  timestamp: string; // ISO format
};

// Generate mock data
const generateMockSlots = (): BookingSlot[] => {
  const slots: BookingSlot[] = [];
  const now = new Date();
  const totalSpots = 50;

  // Generate slots for the next 30 days
  for (let day = 1; day <= 30; day++) {
    const date = addDays(now, day);

    // Generate slots for each hour from 8 AM to 8 PM
    for (let hour = 8; hour <= 20; hour++) {
      // Skip lunch hour (12-1 PM)
      if (hour === 12) continue;

      const randomBookedSpots = Math.floor(Math.random() * 30);

      slots.push({
        id: `slot-${format(date, "yyyy-MM-dd")}-${hour}`,
        date: format(date, "yyyy-MM-dd"),
        hour,
        availableSpots: totalSpots - randomBookedSpots,
        totalSpots,
        bookedBy: Array(randomBookedSpots).fill(0).map((_, i) => `user-${i + 1}`),
      });
    }
  }

  return slots;
};

const generateMockUsers = (): GymUser[] => {
  const departments = ["Engineering", "Marketing", "HR", "Finance", "Sales", "Product", "Design"];
  const users: GymUser[] = [];

  for (let i = 1; i <= 100; i++) {
    const gender = i % 3 === 0 ? "female" : i % 5 === 0 ? "other" : "male";
    const department = departments[i % departments.length];

    users.push({
      id: `user-${i}`,
      email: `employee${i}@company.com`,
      name: `Employee ${i}`,
      gender,
      department,
      bookingHistory: [],
    });
  }

  return users;
};

const generateMockBookings = (users: GymUser[], slots: BookingSlot[]): Booking[] => {
  const bookings: Booking[] = [];
  const now = new Date();

  // Create some past bookings for statistics
  for (let i = 0; i < 300; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomSlot = slots[Math.floor(Math.random() * slots.length)];

    const booking: Booking = {
      id: `booking-${i + 1}`,
      userId: randomUser.id,
      slotId: randomSlot.id,
      createdAt: format(addDays(now, -Math.floor(Math.random() * 14)), "yyyy-MM-dd'T'HH:mm:ss"),
    };

    bookings.push(booking);
    randomUser.bookingHistory.push(booking.id);
  }

  return bookings;
};

const generateAuditLogs = (users: GymUser[], bookings: Booking[]): AuditLog[] => {
  const logs: AuditLog[] = [];
  const now = new Date();

  // Generate login/logout logs
  for (let i = 0; i < 200; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const timestamp = format(addDays(now, -Math.floor(Math.random() * 7)), "yyyy-MM-dd'T'HH:mm:ss");

    logs.push({
      id: `log-${logs.length + 1}`,
      userId: randomUser.id,
      action: "login",
      details: "User logged in",
      timestamp,
    });

    // Add a logout some time after login
    logs.push({
      id: `log-${logs.length + 1}`,
      userId: randomUser.id,
      action: "logout",
      details: "User logged out",
      timestamp: format(parseISO(timestamp), "yyyy-MM-dd'T'HH:mm:ss"),
    });
  }

  // Generate booking logs
  for (const booking of bookings) {
    logs.push({
      id: `log-${logs.length + 1}`,
      userId: booking.userId,
      action: "booking_created",
      details: `Booking created for slot ${booking.slotId}`,
      timestamp: booking.createdAt,
    });
  }

  return logs;
};

// Initialize mock data
export const mockSlots = generateMockSlots();
export const mockUsers = generateMockUsers();
export const mockBookings = generateMockBookings(mockUsers, mockSlots);
export const mockAuditLogs = generateAuditLogs(mockUsers, mockBookings);

// Mock API functions
export const getAvailableSlots = (dateFrom: string, dateTo: string): BookingSlot[] => {
  const startDate = parse(dateFrom, "yyyy-MM-dd", new Date());
  const endDate = parse(dateTo, "yyyy-MM-dd", new Date());

  return mockSlots.filter((slot) => {
    const slotDate = parse(slot.date, "yyyy-MM-dd", new Date());
    return (
      (isSameDay(slotDate, startDate) || isAfter(slotDate, startDate)) &&
      (isSameDay(slotDate, endDate) || isBefore(slotDate, endDate)) &&
      slot.availableSpots > 0
    );
  });
};

export const getUserBookings = (userId: string): BookingSlot[] => {
  // Get all bookings for a user
  const userBookingIds = mockUsers.find((user) => user.id === userId)?.bookingHistory || [];
  const userBookings = mockBookings.filter((booking) => userBookingIds.includes(booking.id));

  // Get the slots for those bookings
  return mockSlots.filter((slot) =>
    userBookings.some((booking) => booking.slotId === slot.id)
  );
};

export const canBookSlot = (userId: string, slotId: string, date: string): { canBook: boolean; reason?: string } => {
  const today = startOfDay(new Date());
  const bookingDate = parse(date, "yyyy-MM-dd", new Date());

  // Rule: Bookings must be made at least 24 hours in advance
  if (isBefore(bookingDate, addDays(today, 1))) {
    return { canBook: false, reason: "Bookings must be made at least 24 hours in advance" };
  }

  // Get user's existing bookings for the same day
  const userSlots = getUserBookings(userId);
  const slotsOnSameDay = userSlots.filter((slot) => slot.date === date);

  // Rule: Maximum 2 sessions per day
  if (slotsOnSameDay.length >= 2) {
    return { canBook: false, reason: "Maximum 2 sessions per day allowed" };
  }

  // Rule: Sessions cannot be consecutive
  const requestedSlot = mockSlots.find((slot) => slot.id === slotId);
  if (!requestedSlot) {
    return { canBook: false, reason: "Invalid slot" };
  }

  const hasAdjacentBooking = slotsOnSameDay.some(
    (slot) => Math.abs(slot.hour - requestedSlot.hour) === 1
  );

  if (hasAdjacentBooking) {
    return { canBook: false, reason: "Cannot book consecutive sessions" };
  }

  // Rule: Maximum 3 sessions per week
  const startOfWeek = addDays(today, -today.getDay());
  const endOfWeek = addDays(startOfWeek, 6);

  const userBookingsThisWeek = userSlots.filter((slot) => {
    const slotDate = parse(slot.date, "yyyy-MM-dd", new Date());
    return (
      (isSameDay(slotDate, startOfWeek) || isAfter(slotDate, startOfWeek)) &&
      (isSameDay(slotDate, endOfWeek) || isBefore(slotDate, endOfWeek))
    );
  });

  if (userBookingsThisWeek.length >= 3) {
    return { canBook: false, reason: "Maximum 3 sessions per week allowed" };
  }

  return { canBook: true };
};

export const bookSlot = (userId: string, slotId: string): { success: boolean; message: string } => {
  // Find the slot
  const slotIndex = mockSlots.findIndex((slot) => slot.id === slotId);
  if (slotIndex === -1) {
    return { success: false, message: "Slot not found" };
  }

  const slot = mockSlots[slotIndex];

  // Check if slot is available
  if (slot.availableSpots <= 0) {
    return { success: false, message: "No available spots in this slot" };
  }

  // Check booking rules
  const bookingRules = canBookSlot(userId, slotId, slot.date);
  if (!bookingRules.canBook) {
    return { success: false, message: bookingRules.reason || "Cannot book this slot" };
  }

  // Create booking
  const booking: Booking = {
    id: `booking-${Date.now()}`,
    userId,
    slotId,
    createdAt: new Date().toISOString(),
  };

  // Update slot
  mockSlots[slotIndex] = {
    ...slot,
    availableSpots: slot.availableSpots - 1,
    bookedBy: [...slot.bookedBy, userId],
  };

  // Add booking to user's history
  const userIndex = mockUsers.findIndex((user) => user.id === userId);
  if (userIndex !== -1) {
    mockUsers[userIndex].bookingHistory.push(booking.id);
  }

  // Add booking to bookings list
  mockBookings.push(booking);

  // Add audit log
  mockAuditLogs.push({
    id: `log-${mockAuditLogs.length + 1}`,
    userId,
    action: "booking_created",
    details: `Booking created for slot ${slotId}`,
    timestamp: new Date().toISOString(),
  });

  return { success: true, message: "Booking successful" };
};

// Admin API functions
export const getGymUsageStats = () => {
  // Total bookings by day of week
  const bookingsByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat

  mockBookings.forEach((booking) => {
    const slot = mockSlots.find((s) => s.id === booking.slotId);
    if (slot) {
      const date = parse(slot.date, "yyyy-MM-dd", new Date());
      bookingsByDayOfWeek[date.getDay()]++;
    }
  });

  // Gender distribution
  const genderDistribution = {
    male: 0,
    female: 0,
    other: 0,
  };

  // Department distribution
  const departmentDistribution: Record<string, number> = {};

  // User frequency
  const userFrequency: Record<string, number> = {};

  mockBookings.forEach((booking) => {
    const user = mockUsers.find((u) => u.id === booking.userId);
    if (user) {
      // Update gender stats
      genderDistribution[user.gender]++;

      // Update department stats
      departmentDistribution[user.department] = (departmentDistribution[user.department] || 0) + 1;

      // Update user frequency
      userFrequency[user.id] = (userFrequency[user.id] || 0) + 1;
    }
  });

  // Get top users
  const topUsers = Object.entries(userFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([userId, count]) => {
      const user = mockUsers.find((u) => u.id === userId);
      return {
        id: userId,
        name: user?.name || "Unknown",
        email: user?.email || "Unknown",
        department: user?.department || "Unknown",
        bookingsCount: count,
      };
    });

  return {
    totalBookings: mockBookings.length,
    bookingsByDayOfWeek,
    genderDistribution,
    departmentDistribution,
    topUsers,
    currentActiveUsers: 32, // Mock data
  };
};

export const getAuditLogs = (page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedLogs = mockAuditLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(startIndex, endIndex);

  return {
    logs: paginatedLogs.map((log) => {
      const user = mockUsers.find((u) => u.id === log.userId);
      return {
        ...log,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "Unknown",
      };
    }),
    totalCount: mockAuditLogs.length,
    page,
    totalPages: Math.ceil(mockAuditLogs.length / limit),
  };
};
