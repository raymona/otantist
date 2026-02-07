'use client';

import { useTranslation } from 'react-i18next';
import TagInput from './TagInput';

interface StepConversationProps {
  goodTopics: string[];
  avoidTopics: string[];
  interactionTips: string[];
  onAddGoodTopic: (tag: string) => void;
  onRemoveGoodTopic: (index: number) => void;
  onAddAvoidTopic: (tag: string) => void;
  onRemoveAvoidTopic: (index: number) => void;
  onAddTip: (tag: string) => void;
  onRemoveTip: (index: number) => void;
}

export default function StepConversation({
  goodTopics,
  avoidTopics,
  interactionTips,
  onAddGoodTopic,
  onRemoveGoodTopic,
  onAddAvoidTopic,
  onRemoveAvoidTopic,
  onAddTip,
  onRemoveTip,
}: StepConversationProps) {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('conversation_title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('conversation_description')}</p>
      </div>

      <TagInput
        tags={goodTopics}
        onAdd={onAddGoodTopic}
        onRemove={onRemoveGoodTopic}
        label={t('good_topics')}
        placeholder={t('good_topics_placeholder')}
        hint={t('good_topics_hint')}
        tagColor="green"
      />

      <TagInput
        tags={avoidTopics}
        onAdd={onAddAvoidTopic}
        onRemove={onRemoveAvoidTopic}
        label={t('avoid_topics')}
        placeholder={t('avoid_topics_placeholder')}
        hint={t('avoid_topics_hint')}
        tagColor="red"
      />

      <TagInput
        tags={interactionTips}
        onAdd={onAddTip}
        onRemove={onRemoveTip}
        label={t('interaction_tips')}
        placeholder={t('interaction_tips_placeholder')}
        hint={t('interaction_tips_hint')}
        tagColor="blue"
      />
    </div>
  );
}
