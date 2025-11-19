import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

interface ProfileStepProps {
  data: {
    name: string;
    gender: string;
    email: string;
    phone: string;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
  userId: string;
}

const ProfileStep = ({ data, onUpdate, onNext, userId }: ProfileStepProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: userId,
        name: data.name,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
      });

      if (error) throw error;

      toast({
        title: "Profile saved!",
        description: "Let's upload some photos next.",
      });
      onNext();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create Your Profile</h2>
          <p className="text-muted-foreground">Tell us a bit about yourself</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onUpdate({ ...data, name: e.target.value })}
            placeholder="John Doe"
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-3">
          <Label>Gender</Label>
          <RadioGroup
            value={data.gender}
            onValueChange={(value) => onUpdate({ ...data, gender: value })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="cursor-pointer font-normal">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="cursor-pointer font-normal">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="cursor-pointer font-normal">Other</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ ...data, email: e.target.value })}
            placeholder="john@example.com"
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ ...data, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            required
            className="rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileStep;
