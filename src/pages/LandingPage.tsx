import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Union Gym Booking System
                </h1>
                <p className="max-w-[600px] text-gray-200 md:text-xl">
                  Book gym sessions easily, track your workouts, and maintain a healthy work-life balance with our state-of-the-art gym booking platform.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                {user ? (
                  <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    <Link to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}>Go to Dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    <Link to="/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-end gap-8">
              <div className="flex items-center justify-center px-6 py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <img
                  src="/images/481376266_18483789931022422_3791355207825246788_n.jpeg"
                  alt="Union Gym"
                  className="object-cover w-full h-auto rounded-lg shadow-2xl"
                  style={{ maxHeight: "350px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}