import { useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

/**
 * TagInput - Multi-tag input component with suggestions
 *
 * @param {Object} props
 * @param {string[]} props.value - Current tags array
 * @param {function} props.onChange - Callback when tags change
 * @param {string[]} props.suggestions - Optional suggestions to show
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.label - Input label
 * @param {number} props.maxTags - Maximum number of tags allowed
 */
export default function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Digite e pressione Enter',
  label,
  maxTags = 10,
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return;
    if (value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    // If user types a comma, add the tag
    if (newValue.includes(',')) {
      const parts = newValue.split(',');
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          addTag(part);
        } else {
          setInputValue(part);
        }
      });
    } else {
      setInputValue(newValue);
      setShowSuggestions(newValue.length > 0);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(s)
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className="min-h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:border-patronos-accent focus-within:ring-1 focus-within:ring-patronos-accent"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex flex-wrap gap-2">
            {value.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-patronos-accent/10 px-2.5 py-0.5 text-sm font-medium text-patronos-accent"
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="hover:text-patronos-accent/70 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(inputValue.length > 0)}
              onBlur={() => {
                // Delay to allow clicking on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder={value.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] border-0 p-0 text-sm focus:ring-0 focus:outline-none"
              disabled={value.length >= maxTags}
            />
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      {maxTags && (
        <p className="mt-1 text-xs text-gray-500">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}
