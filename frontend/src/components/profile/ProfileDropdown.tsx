'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface ProfileDropdownOption {
  key: string;
  label: string;
  count?: number;
  hint?: string;
}

export interface ProfileDropdownProps {
  label: string;
  value: string;
  options: ProfileDropdownOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
  badge?: string | number;
}

export default function ProfileDropdown({
  label,
  value,
  options,
  onChange,
  icon,
  className = '',
  badge,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.key === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (key: string) => {
    onChange(key);
    setIsOpen(false);
  };

  const isFiltered = value !== 'ALL' && value !== 'NEWEST';

  return (
    <div
      ref={containerRef}
      className={`profile-dropdown-container ${className} ${isOpen ? 'is-open' : ''}`}
    >
      <button
        type="button"
        className={`profile-dropdown-trigger ${isFiltered ? 'is-filtered' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="profile-dropdown-trigger-icon">
          {icon}
        </span>
        <div className="profile-dropdown-trigger-text">
          <span className="profile-dropdown-category-label">{label}:</span>
          <span className="profile-dropdown-selected-val">
            {selectedOption?.label}
          </span>
        </div>
        {typeof badge !== 'undefined' && (
          <span className="profile-dropdown-badge">{badge}</span>
        )}
        <ChevronDown
          className={`profile-dropdown-chevron ${isOpen ? 'rotate-180' : ''}`}
          size={15}
        />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu" role="listbox">
          <div className="profile-dropdown-header">
            <span>{label}</span>
          </div>
          <div className="profile-dropdown-list">
            {options.map((opt) => {
              const isSelected = opt.key === value;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`profile-dropdown-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelect(opt.key)}
                >
                  <div className="profile-dropdown-item-left">
                    <span className="profile-dropdown-item-check">
                      {isSelected ? <Check size={14} strokeWidth={2.5} /> : null}
                    </span>
                    <span className="profile-dropdown-item-label">{opt.label}</span>
                  </div>
                  <div className="profile-dropdown-item-right">
                    {typeof opt.count === 'number' && (
                      <span className="profile-dropdown-item-count">{opt.count}</span>
                    )}
                    {opt.hint && (
                      <span className="profile-dropdown-item-hint">{opt.hint}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

