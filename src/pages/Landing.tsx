import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Users, Calendar, Star, CheckCircle, Share2, Copy, ArrowRight } from "lucide-react";
import heroImage from "@/assets/landing-hero.jpg";
import logo from "@/assets/hair-bnb-logo.png";

const Landing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const referredBy = searchParams.get("ref") || "";

  useEffect(() => {
    const fetchCount = async () => {
      const { data } = await supabase.rpc("get_waitlist_count");
      setWaitlistCount(data || 0);
    };
    fetchCount();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("launch_waitlist")
        .insert({
          email: email.trim().toLowerCase(),
          name: name.trim() || null,
          referred_by: referredBy || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Already exists — fetch their code via secure RPC
          const { data: existing } = await supabase.rpc("get_waitlist_referral", {
            _email: email.trim().toLowerCase(),
          });
          const row = Array.isArray(existing) ? existing[0] : (existing as any);
          if (row) {
            setReferralCode(row.referral_code);
            setReferralCount(row.referral_count);
            setSignedUp(true);
            toast.info("You're already on the waitlist! Here's your referral link.");
          }
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } else if (data) {
        setReferralCode(data.referral_code);
        setReferralCount(0);
        setSignedUp(true);
        setWaitlistCount((c) => c + 1);
        toast.success("You're on the list! 🎉");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = `${window.location.origin}/launch?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Referral link copied!");
  };

  const features = [
    { icon: Sparkles, title: "AI Style Preview", desc: "See any hairstyle on YOUR face before you commit" },
    { icon: Users, title: "Expert Stylists", desc: "Find verified local stylists who specialize in your look" },
    { icon: Calendar, title: "Instant Booking", desc: "Book your appointment in under 30 seconds" },
    { icon: Star, title: "No More Surprises", desc: "Your stylist sees exactly what you want — zero miscommunication" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="Hair BnB hero" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <img src={logo} alt="Hair BnB logo" width={160} height={160} className="mx-auto mb-6 w-32 h-32 sm:w-40 sm:h-40 drop-shadow-2xl" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-6">
            See Your New Look{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              Before You Book
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Hair BnB uses AI to show you exactly how any hairstyle looks on you. Find the perfect stylist. Book with confidence. No more bad haircuts.
          </p>

          {/* Signup Form */}
          {!signedUp ? (
            <form onSubmit={handleSignup} className="max-w-md mx-auto space-y-3">
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-card/80 border-border/50 h-12 text-base backdrop-blur-sm"
              />
              <Input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card/80 border-border/50 h-12 text-base backdrop-blur-sm"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {loading ? "Joining..." : "Join the Waitlist"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              {referredBy && (
                <p className="text-sm text-accent">🎁 You were referred by a friend — you'll skip the line!</p>
              )}
              <p className="text-xs text-muted-foreground">
                {waitlistCount > 0
                  ? `Join ${waitlistCount.toLocaleString()}+ people already on the waitlist`
                  : "Be among the first to try Hair BnB"}
              </p>
            </form>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-center gap-2 text-success mb-4">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">You're on the list!</span>
              </div>

              <div className="p-4 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm text-left space-y-3">
                <p className="text-sm text-muted-foreground">Share your link to skip the line:</p>
                <div className="flex gap-2">
                  <Input readOnly value={shareUrl} className="bg-secondary/50 text-sm" />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-accent">
                    <Share2 className="w-4 h-4" />
                    <span>{referralCount} referrals</span>
                  </div>
                  <span className="text-muted-foreground">Refer 3 friends → get early access + free first booking</span>
                </div>
              </div>

              <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
                Already have an account? Sign in
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            Three steps to your perfect haircut. No guesswork, no regrets.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card/60 border border-border/40 hover:border-primary/40 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">{(waitlistCount + 247).toLocaleString()}+</div>
              <div className="text-sm text-muted-foreground mt-1">On the waitlist</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-accent">20+</div>
              <div className="text-sm text-muted-foreground mt-1">Hairstyle options</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold" style={{ color: "hsl(35, 100%, 55%)" }}>3</div>
              <div className="text-sm text-muted-foreground mt-1">Languages supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to see your new look?</h2>
          <p className="text-muted-foreground mb-8">
            Join the waitlist and be the first to experience the future of haircuts.
          </p>
          {!signedUp ? (
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ backgroundImage: "var(--gradient-primary)" }}
              className="text-base font-semibold px-8"
            >
              Join the Waitlist
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button size="lg" onClick={copyLink} variant="outline" className="text-base px-8">
              <Share2 className="mr-2 w-4 h-4" />
              Share Your Referral Link
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6 text-center text-sm text-muted-foreground">
        © 2025 Hair BnB. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
