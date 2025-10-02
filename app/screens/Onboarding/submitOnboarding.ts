import { mapAnswerToProfile } from '@/app/modules/personalisation/mapper';
import { usePreferenceProfile } from '@/app/modules/personalisation/profile-store';
import { trpc } from '@/lib/trpc';
import { useCallback } from 'react';

export function useSubmitOnboarding() {
  const { updateFromOnboarding } = usePreferenceProfile();
  const utils = trpc.useUtils();
  const upsert = trpc.preferences.upsert.useMutation();

  const submit = useCallback(async (answers: unknown) => {
    console.log('[OnboardingSubmit] submitting');
    const { profile, explanation } = mapAnswerToProfile(answers);
    console.log('[OnboardingSubmit] explanation', explanation);
    const saved = await updateFromOnboarding(answers);
    try {
      await upsert.mutateAsync({ profile: saved });
      await utils.invalidate();
    } catch (e: unknown) {
      console.log('[OnboardingSubmit] server sync failed, will retry later', e);
    }
    return profile;
  }, [updateFromOnboarding, upsert, utils]);

  return { submit, isSaving: upsert.isPending, error: upsert.error };
}
