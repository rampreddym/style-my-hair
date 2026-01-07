import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LanguageCode } from '@/i18n';

export const useLanguagePreference = () => {
  const { i18n } = useTranslation();
  const { user, userRole } = useAuth();

  // Load language preference from database when user logs in
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (!user || !userRole) return;

      const table = userRole === 'customer' ? 'customers' : 'stylists';
      
      const { data, error } = await supabase
        .from(table)
        .select('language_preference')
        .eq('user_id', user.id)
        .single();

      if (data?.language_preference && !error) {
        i18n.changeLanguage(data.language_preference);
      }
    };

    loadLanguagePreference();
  }, [user, userRole, i18n]);

  // Save language preference to database
  const saveLanguagePreference = async (languageCode: LanguageCode) => {
    if (!user || !userRole) {
      // Just change language locally if not logged in
      i18n.changeLanguage(languageCode);
      return;
    }

    const table = userRole === 'customer' ? 'customers' : 'stylists';

    await supabase
      .from(table)
      .update({ language_preference: languageCode })
      .eq('user_id', user.id);

    i18n.changeLanguage(languageCode);
  };

  return { saveLanguagePreference };
};
