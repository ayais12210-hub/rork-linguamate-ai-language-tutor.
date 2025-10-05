import { trpc } from '@/lib/trpc';
import { useEffect } from 'react';
import { usePreferenceProfile } from '@/app/modules/personalisation/profile-store';

export function usePreferencesSync() {
  const { profile } = usePreferenceProfile();
  const get = trpc.preferences.get.useQuery(undefined, { enabled: false });
  const upsert = trpc.preferences.upsert.useMutation();

  useEffect(() => {
    (async () => {
      try {
        if (!profile) return;
        await upsert.mutateAsync({ profile });
      } catch (e: unknown) {
        if (__DEV__) {

          console.log('[Sync] preferences upsert failed', e);

        }
      }
    })();
  }, [profile, upsert]);

  return { refresh: () => get.refetch() };
}
