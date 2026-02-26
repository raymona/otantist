'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { useApiError } from '@/lib/use-api-error';
import {
  usersApi,
  preferencesApi,
  AgeGroup,
  ProfileVisibility,
  TonePreference,
  ColorIntensity,
} from '@/lib/api';
import StepProfile from '@/components/onboarding/StepProfile';
import StepCommunication from '@/components/onboarding/StepCommunication';
import StepSensory from '@/components/onboarding/StepSensory';
import StepConversation from '@/components/onboarding/StepConversation';
import StepComplete from '@/components/onboarding/StepComplete';

type Step = 'profile' | 'communication' | 'sensory' | 'conversation' | 'complete';
const STEPS: Step[] = ['profile', 'communication', 'sensory', 'conversation', 'complete'];

export default function OnboardingPage() {
  const { t } = useTranslation('onboarding');
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isReady, isLoading: authLoading } = useAuthGuard('authenticated');
  const { getErrorMessage } = useApiError();

  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [error, setError] = useState('');
  const [resumed, setResumed] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('visible');

  // Communication state
  const [preferredTone, setPreferredTone] = useState<TonePreference | ''>('');
  const [commModes, setCommModes] = useState<string[]>(['text']);
  const [slowRepliesOk, setSlowRepliesOk] = useState(true);
  const [oneMessageAtTime, setOneMessageAtTime] = useState(false);
  const [readWithoutReply, setReadWithoutReply] = useState(true);

  // Sensory state
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [colorIntensity, setColorIntensity] = useState<ColorIntensity>('standard');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationLimit, setNotificationLimit] = useState(5);
  const [notificationGrouped, setNotificationGrouped] = useState(true);

  // Conversation state
  const [goodTopics, setGoodTopics] = useState<string[]>([]);
  const [avoidTopics, setAvoidTopics] = useState<string[]>([]);
  const [interactionTips, setInteractionTips] = useState<string[]>([]);

  // Redirect if onboarding already complete, or resume at correct step
  useEffect(() => {
    if (!user) return;
    if (user.onboardingComplete) {
      router.push('/dashboard');
      return;
    }

    const stepMap: Record<string, Step> = {
      basic_profile: 'profile',
      communication_preferences: 'communication',
      sensory_preferences: 'sensory',
      conversation_starters: 'conversation',
    };

    if (user.onboardingStep && stepMap[user.onboardingStep]) {
      const resumeStep = stepMap[user.onboardingStep];
      if (resumeStep !== 'profile') {
        setCurrentStep(resumeStep);
        setResumed(true);
      }
    }
  }, [user, router]);

  // Load previously saved data when resuming
  useEffect(() => {
    if (!resumed || !isReady) return;

    const loadSavedData = async () => {
      try {
        if (user?.displayName) setDisplayName(user.displayName);
        if (user?.ageGroup) setAgeGroup(user.ageGroup as AgeGroup);
        if (user?.profileVisibility)
          setProfileVisibility(user.profileVisibility as ProfileVisibility);

        try {
          const commPrefs = await preferencesApi.getCommunication();
          if (commPrefs) {
            if (commPrefs.commModes?.length) setCommModes(commPrefs.commModes);
            if (commPrefs.preferredTone) setPreferredTone(commPrefs.preferredTone);
            if (commPrefs.slowRepliesOk != null) setSlowRepliesOk(commPrefs.slowRepliesOk);
            if (commPrefs.oneMessageAtTime != null) setOneMessageAtTime(commPrefs.oneMessageAtTime);
            if (commPrefs.readWithoutReply != null) setReadWithoutReply(commPrefs.readWithoutReply);
          }
        } catch {
          /* No saved data yet */
        }

        try {
          const sensPrefs = await preferencesApi.getSensory();
          if (sensPrefs) {
            if (sensPrefs.enableAnimations != null) setEnableAnimations(sensPrefs.enableAnimations);
            if (sensPrefs.colorIntensity) setColorIntensity(sensPrefs.colorIntensity);
            if (sensPrefs.soundEnabled != null) setSoundEnabled(sensPrefs.soundEnabled);
            if (sensPrefs.notificationLimit != null)
              setNotificationLimit(sensPrefs.notificationLimit);
            if (sensPrefs.notificationGrouped != null)
              setNotificationGrouped(sensPrefs.notificationGrouped);
          }
        } catch {
          /* No saved data yet */
        }

        try {
          const convStarters = await preferencesApi.getConversationStarters();
          if (convStarters) {
            if (convStarters.goodTopics?.length) setGoodTopics(convStarters.goodTopics);
            if (convStarters.avoidTopics?.length) setAvoidTopics(convStarters.avoidTopics);
            if (convStarters.interactionTips?.length)
              setInteractionTips(convStarters.interactionTips);
          }
        } catch {
          /* No saved data yet */
        }
      } catch {
        // Silently ignore load errors
      }
    };

    loadSavedData();
  }, [resumed, isReady]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const saveCurrentStep = async (markComplete: boolean) => {
    if (currentStep === 'profile') {
      await usersApi.updateProfile({
        displayName: displayName || undefined,
        ageGroup: ageGroup || undefined,
        profileVisibility,
      });
    } else if (currentStep === 'communication') {
      await preferencesApi.updateCommunication({
        preferredTone: preferredTone || undefined,
        commModes,
        slowRepliesOk,
        oneMessageAtTime,
        readWithoutReply,
        ...(markComplete && { sectionComplete: true }),
      });
    } else if (currentStep === 'sensory') {
      await preferencesApi.updateSensory({
        enableAnimations,
        colorIntensity,
        soundEnabled,
        notificationLimit,
        notificationGrouped,
        ...(markComplete && { sectionComplete: true }),
      });
    } else if (currentStep === 'conversation') {
      await preferencesApi.updateConversationStarters({
        goodTopics,
        avoidTopics,
        interactionTips,
        ...(markComplete && { sectionComplete: true }),
      });
    }
  };

  const handleNext = async () => {
    // Validate required fields before saving
    if (currentStep === 'profile') {
      if (!displayName.trim()) {
        setError(t('error_display_name_required'));
        return;
      }
      if (!ageGroup) {
        setError(t('error_age_group_required'));
        return;
      }
    }
    if (currentStep === 'communication') {
      if (!preferredTone) {
        setError(t('error_tone_required'));
        return;
      }
      if (commModes.length === 0) {
        setError(t('error_comm_mode_required'));
        return;
      }
    }

    setError('');
    setIsLoading(true);
    try {
      await saveCurrentStep(true);
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEPS.length) {
        setCurrentStep(STEPS[nextIndex]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleSaveAndExit = async () => {
    setError('');
    setIsSavingAndExiting(true);
    try {
      await saveCurrentStep(false);
      logout();
      router.push('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingAndExiting(false);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Fetch fresh user data to verify onboarding is actually complete.
      // Using usersApi.getMe() directly (not refreshUser) so we get the
      // updated value in the same call, not from stale React closure state.
      const freshUser = await usersApi.getMe();

      if (!freshUser.onboardingComplete) {
        // Backend says onboarding isn't done — navigate back to the missing step.
        const stepMapping: Record<string, Step> = {
          basic_profile: 'profile',
          communication_preferences: 'communication',
          sensory_preferences: 'sensory',
          conversation_starters: 'conversation',
        };
        const targetStep = freshUser.onboardingStep && stepMapping[freshUser.onboardingStep];
        if (targetStep) {
          setCurrentStep(targetStep);
        }
        setError(t('error_not_complete'));
        return;
      }

      // Full page navigation so auth context re-initializes with fresh data.
      window.location.href = freshUser.isParent ? '/parent' : '/dashboard';
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCommMode = (mode: string) => {
    setCommModes(prev => (prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]));
  };

  const addTag = (tag: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const trimmed = tag.trim();
    if (trimmed) {
      setter(prev => [...prev, trimmed]);
    }
  };

  const removeTag = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p role="status" className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600">
          <span className="sr-only">{t('common:loading')}</span>
        </p>
      </main>
    );
  }

  if (!isReady) return null;

  const progressPercent = ((currentStepIndex + 1) / (STEPS.length - 1)) * 100;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            {t('common:cancel')}
          </button>
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('common:app_name')}</h1>
          <p className="mt-2 text-gray-600">{t('title')}</p>
          {currentStep !== 'complete' && (
            <p className="mt-1 text-sm text-gray-500">
              {t('step', { current: currentStepIndex + 1, total: STEPS.length - 1 })}
            </p>
          )}
        </header>

        {/* Progress bar */}
        {currentStep !== 'complete' && (
          <nav
            aria-label={t('step', { current: currentStepIndex + 1, total: STEPS.length - 1 })}
            className="mb-8"
          >
            <ol className="mb-2 flex justify-between">
              {STEPS.slice(0, -1).map((step, index) => (
                <li
                  key={step}
                  aria-current={index === currentStepIndex ? 'step' : undefined}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </li>
              ))}
            </ol>
            <div
              role="progressbar"
              aria-valuenow={currentStepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={STEPS.length - 1}
              aria-label={t('step', { current: currentStepIndex + 1, total: STEPS.length - 1 })}
              className="h-2 rounded-full bg-gray-200"
            >
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </nav>
        )}

        {resumed && (
          <p
            role="status"
            className="mb-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700"
          >
            {t('resume_message')}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700"
          >
            {error}
          </p>
        )}

        <section className="rounded-lg bg-white p-4 shadow md:p-8">
          {currentStep === 'profile' && (
            <StepProfile
              displayName={displayName}
              ageGroup={ageGroup}
              profileVisibility={profileVisibility}
              onDisplayNameChange={setDisplayName}
              onAgeGroupChange={setAgeGroup}
              onVisibilityChange={setProfileVisibility}
            />
          )}

          {currentStep === 'communication' && (
            <StepCommunication
              preferredTone={preferredTone}
              commModes={commModes}
              slowRepliesOk={slowRepliesOk}
              oneMessageAtTime={oneMessageAtTime}
              readWithoutReply={readWithoutReply}
              onToneChange={setPreferredTone}
              onToggleCommMode={toggleCommMode}
              onSlowRepliesChange={setSlowRepliesOk}
              onOneMessageChange={setOneMessageAtTime}
              onReadWithoutReplyChange={setReadWithoutReply}
            />
          )}

          {currentStep === 'sensory' && (
            <StepSensory
              enableAnimations={enableAnimations}
              colorIntensity={colorIntensity}
              soundEnabled={soundEnabled}
              notificationLimit={notificationLimit}
              notificationGrouped={notificationGrouped}
              onAnimationsChange={setEnableAnimations}
              onColorIntensityChange={setColorIntensity}
              onSoundChange={setSoundEnabled}
              onNotificationLimitChange={setNotificationLimit}
              onNotificationGroupedChange={setNotificationGrouped}
            />
          )}

          {currentStep === 'conversation' && (
            <StepConversation
              goodTopics={goodTopics}
              avoidTopics={avoidTopics}
              interactionTips={interactionTips}
              onAddGoodTopic={tag => addTag(tag, setGoodTopics)}
              onRemoveGoodTopic={i => removeTag(i, setGoodTopics)}
              onAddAvoidTopic={tag => addTag(tag, setAvoidTopics)}
              onRemoveAvoidTopic={i => removeTag(i, setAvoidTopics)}
              onAddTip={tag => addTag(tag, setInteractionTips)}
              onRemoveTip={i => removeTag(i, setInteractionTips)}
            />
          )}

          {currentStep === 'complete' && <StepComplete />}

          {/* Navigation buttons */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex justify-between">
              {currentStepIndex > 0 && currentStep !== 'complete' ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {t('back')}
                </button>
              ) : (
                <div />
              )}

              {currentStep === 'complete' ? (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                >
                  {t('go_to_app')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading || isSavingAndExiting}
                  aria-busy={isLoading}
                  className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading
                    ? t('saving')
                    : currentStepIndex === STEPS.length - 2
                      ? t('finish')
                      : t('next')}
                </button>
              )}
            </div>

            {currentStep !== 'complete' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  disabled={isLoading || isSavingAndExiting}
                  aria-busy={isSavingAndExiting}
                  className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
                >
                  {isSavingAndExiting ? t('saving_and_exiting') : t('save_and_exit')}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
