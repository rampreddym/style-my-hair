import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { languages, LanguageCode } from "@/i18n";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";

interface LanguageSwitcherProps {
  variant?: "icon" | "full";
  className?: string;
}

export const LanguageSwitcher = ({ variant = "icon", className = "" }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const { saveLanguagePreference } = useLanguagePreference();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (code: LanguageCode) => {
    saveLanguagePreference(code);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "default"}
          className={`min-h-[44px] min-w-[44px] no-tap-highlight ${className}`}
        >
          {variant === "icon" ? (
            <>
              <span className="text-lg mr-1">{currentLanguage.flag}</span>
              <Globe className="h-4 w-4" />
            </>
          ) : (
            <>
              <span className="text-lg mr-2">{currentLanguage.flag}</span>
              <span>{currentLanguage.name}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="flex items-center justify-between min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {i18n.language === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};