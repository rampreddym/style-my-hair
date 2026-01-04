import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, User, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && user && userRole) {
      navigate(userRole === 'stylist' ? '/stylist' : '/customer');
    }
  }, [user, userRole, loading, navigate]);

  const handleRoleSelect = (role: 'customer' | 'stylist') => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StyleMatch
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with the perfect hair stylist for your unique look. AI-powered style matching and seamless booking.
          </p>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card 
            className={`cursor-pointer transition-all duration-300 border-2 ${
              hoveredRole === 'customer' ? 'border-primary shadow-lg scale-[1.02]' : 'border-border hover:border-primary/50'
            }`}
            onMouseEnter={() => setHoveredRole('customer')}
            onMouseLeave={() => setHoveredRole(null)}
            onClick={() => handleRoleSelect('customer')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">I'm a Customer</CardTitle>
              <CardDescription className="text-base">
                Find your perfect hairstyle and book with local stylists
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Create your hair profile
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  AI-generated style previews
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Book and pay securely
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Get Started as Customer
              </Button>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all duration-300 border-2 ${
              hoveredRole === 'stylist' ? 'border-primary shadow-lg scale-[1.02]' : 'border-border hover:border-primary/50'
            }`}
            onMouseEnter={() => setHoveredRole('stylist')}
            onMouseLeave={() => setHoveredRole(null)}
            onClick={() => handleRoleSelect('stylist')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Scissors className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">I'm a Stylist</CardTitle>
              <CardDescription className="text-base">
                Grow your business and connect with new clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Showcase your specialties
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Manage appointments easily
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Get paid securely via Stripe
                </li>
              </ul>
              <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                Join as Stylist
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;