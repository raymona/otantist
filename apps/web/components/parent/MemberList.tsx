'use client';

import { useTranslation } from 'react-i18next';
import type { ManagedMember } from '@/lib/parent-api';

interface MemberListProps {
  members: ManagedMember[];
  selectedId: string | null;
  onSelect: (member: ManagedMember) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
};

export default function MemberList({ members, selectedId, onSelect }: MemberListProps) {
  const { t } = useTranslation('parent');

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
        {t('member_list.title')}
      </h2>
      <ul role="listbox" aria-label={t('member_list.title')}>
        {members.map(member => {
          const isSelected = member.member.userId === selectedId;
          const relationshipKey = `member_list.relationship_${member.relationship}`;
          const statusKey = `member_list.status_${member.status}`;

          return (
            <li
              key={member.id}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(member)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(member);
                }
              }}
              tabIndex={0}
              className={`cursor-pointer rounded-md px-3 py-3 transition-colors ${
                isSelected ? 'border border-blue-200 bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {member.member.displayName || member.member.userId.slice(0, 8)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusColors[member.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t(statusKey)}
                </span>
              </div>
              <span className="mt-0.5 block text-xs text-gray-500">{t(relationshipKey)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
