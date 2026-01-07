import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Sparkles, X } from "lucide-react";

interface ExperienceStepProps {
  bio: string;
  setBio: (bio: string) => void;
  yearsExperience: number;
  setYearsExperience: (years: number) => void;
  specialties: string[];
  setSpecialties: (specialties: string[]) => void;
  certifications: string[];
  setCertifications: (certifications: string[]) => void;
}

export const ExperienceStep = ({
  bio,
  setBio,
  yearsExperience,
  setYearsExperience,
  specialties,
  setSpecialties,
  certifications,
  setCertifications,
}: ExperienceStepProps) => {
  const { t } = useTranslation();
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [generating, setGenerating] = useState(false);

  const addSpecialty = () => {
    if (newSpecialty && !specialties.includes(newSpecialty)) {
      setSpecialties([...specialties, newSpecialty]);
      setNewSpecialty("");
    }
  };

  const addCertification = () => {
    if (newCertification && !certifications.includes(newCertification)) {
      setCertifications([...certifications, newCertification]);
      setNewCertification("");
    }
  };

  const generateSpecialties = async () => {
    setGenerating(true);
    // Simulate AI generation
    const suggested = [
      "Fades & Tapers",
      "Color Specialist",
      "Braiding",
      "Balayage",
      "Men's Cuts",
      "Curly Hair",
      "Extensions",
      "Beard Grooming",
    ];
    const random = suggested.sort(() => Math.random() - 0.5).slice(0, 4);
    setSpecialties([...new Set([...specialties, ...random])]);
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            {t("onboardingSteps.professionalExperience")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="years">{t("stylist.onboarding.yearsExperience")}</Label>
            <Input
              id="years"
              type="number"
              min={0}
              max={50}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("onboardingSteps.aboutYou")}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("onboardingSteps.bioPlaceholder")}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("stylist.onboarding.specialties")}</span>
            <Button variant="outline" size="sm" onClick={generateSpecialties} disabled={generating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? t("onboardingSteps.generating") : t("onboardingSteps.aiSuggest")}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder={t("onboardingSteps.addSpecialtyPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && addSpecialty()}
            />
            <Button onClick={addSpecialty} variant="outline">
              {t("onboardingSteps.add")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary" className="px-3 py-1">
                {specialty}
                <button onClick={() => setSpecialties(specialties.filter((s) => s !== specialty))} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("stylist.onboarding.certifications")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder={t("onboardingSteps.addCertificationPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && addCertification()}
            />
            <Button onClick={addCertification} variant="outline">
              {t("onboardingSteps.add")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => (
              <Badge key={cert} variant="outline" className="px-3 py-1">
                <Award className="w-3 h-3 mr-1" />
                {cert}
                <button onClick={() => setCertifications(certifications.filter((c) => c !== cert))} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
