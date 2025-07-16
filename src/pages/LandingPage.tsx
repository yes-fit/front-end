import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Hero Section */}
      <section className="relative w-full py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="flex flex-col justify-center space-y-4 text-center md:text-left">
              <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">
                Union Gym Booking System
              </h1>
              <p className="max-w-lg text-gray-200 md:text-lg">
                Book gym sessions easily, track your workouts, and maintain a healthy work-life balance with our state-of-the-art gym booking platform.
              </p>
              <div className="flex flex-col gap-4 md:flex-row">
                {user ? (
                  <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 transition">
                    <Link to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}>Go to Dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 transition">
                    <Link to="/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src="/images/481376266_18483789931022422_3791355207825246788_n.jpeg"
                alt="Union Gym"
                className="object-cover w-full max-w-md h-auto rounded-lg shadow-xl transition-transform duration-300 transform hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}