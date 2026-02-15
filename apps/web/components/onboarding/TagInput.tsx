'use client';

import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  label: string;
  placeholder: string;
  hint: string;
  tagColor: 'green' | 'red' | 'blue';
  removeLabel?: string;
}

const TAG_STYLES = {
  green: { bg: 'bg-green-100 text-green-800', remove: 'text-green-600 hover:text-green-800' },
  red: { bg: 'bg-red-100 text-red-800', remove: 'text-red-600 hover:text-red-800' },
  blue: { bg: 'bg-blue-100 text-blue-800', remove: 'text-blue-600 hover:text-blue-800' },
};

export default function TagInput({
  tags,
  onAdd,
  onRemove,
  label,
  placeholder,
  hint,
  tagColor,
  removeLabel = 'Remove',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const styles = TAG_STYLES[tagColor];

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        onAdd(trimmed);
        setInputValue('');
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 mb-2 flex flex-wrap gap-2" role="list" aria-label={label}>
        {tags.map((tag, index) => (
          <span
            key={index}
            role="listitem"
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${styles.bg}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`${removeLabel} ${tag}`}
              title={`${removeLabel} ${tag}`}
              className={`ml-2 ${styles.remove}`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
      />
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}
