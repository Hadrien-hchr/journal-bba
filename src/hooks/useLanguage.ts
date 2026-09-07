import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';

function normalize(value?: string | null): AppLanguage | null {
  if (!value) return null;
  const base = value.split('-')[0] as AppLanguage;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(base) ? base : null;
}

export function useLanguage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const syncedRef = useRef(false);

  const current = (normalize(i18n.language) ?? 'fr') as AppLanguage;

  // Load the language stored on the user's profile once after sign-in
  useEffect(() => {
    if (!user || syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .maybeSingle();

      const profileLang = normalize((data as { language?: string } | null)?.language);
      const storedLang = normalize(localStorage.getItem(LANGUAGE_STORAGE_KEY));

      if (storedLang && storedLang !== profileLang) {
        await supabase.from('profiles').update({ language: storedLang }).eq('id', user.id);
        return;
      }

      if (profileLang && profileLang !== current) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, profileLang);
        await i18n.changeLanguage(profileLang);
      }
    })();
  }, [user, i18n, current]);

  useEffect(() => {
    if (!user) syncedRef.current = false;
  }, [user]);

  const setLanguage = useCallback(
    async (lang: AppLanguage) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      await i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
      if (user) {
        await supabase.from('profiles').update({ language: lang }).eq('id', user.id);
      }
    },
    [i18n, user]
  );

  return { language: current, setLanguage, languages: SUPPORTED_LANGUAGES };
}
