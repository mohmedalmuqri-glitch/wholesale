import { useEffect, useState } from 'react';
import { fetchDesignSettings } from '@/lib/db';
import { applyTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { DEFAULT_DESIGN_SETTINGS, type DesignSettings } from '@/types';

export function useDesignSettings(): DesignSettings {
  const [settings, setSettings] = useState<DesignSettings>(DEFAULT_DESIGN_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchDesignSettings()
        .then((value) => {
          if (!cancelled) setSettings(value);
        })
        .catch(() => {});
    };
    load();
    const channel = supabase
      .channel('design-settings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_design_settings' }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyTheme(settings);
  }, [settings]);

  return settings;
}
