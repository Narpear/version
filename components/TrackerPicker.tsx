'use client';

import { Dumbbell, Utensils, Target, Droplet, Footprints, Moon, Sparkles, BookOpen } from 'lucide-react';

export const ALL_TRACKERS = [
  { key: 'food',     label: 'Food',     icon: Utensils,   color: '#BDEFD4', required: true  },
  { key: 'gym',      label: 'Gym',      icon: Dumbbell,   color: '#BDCFF5', required: true  },
  { key: 'progress', label: 'Progress', icon: Target,     color: '#F5E8BD', required: true  },
  { key: 'water',    label: 'Water',    icon: Droplet,    color: '#BDE8F5', required: false },
  { key: 'steps',    label: 'Steps',    icon: Footprints, color: '#F5CFBD', required: false },
  { key: 'sleep',    label: 'Sleep',    icon: Moon,       color: '#CBBDF5', required: false },
  { key: 'skincare', label: 'Skincare', icon: Sparkles,   color: '#E4BDF5', required: false },
  { key: 'books',    label: 'Books',    icon: BookOpen,   color: '#F5D4BD', required: false },
] as const;

interface TrackerPickerProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function TrackerPicker({ selected, onChange }: TrackerPickerProps) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {ALL_TRACKERS.map(({ key, label, icon: Icon, color, required }) => {
        const isSelected = required || selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => !required && toggle(key)}
            className={`flex items-center gap-3 p-4 border-2 border-darkgray transition-all text-left ${
              required
                ? 'cursor-default'
                : isSelected
                  ? 'shadow-pixel'
                  : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: isSelected ? color : required ? color : '#D1D5DB' }}
          >
            <Icon size={20} className="shrink-0" />
            <div>
              <p className="font-pixel text-xs">{label}</p>
              {required && (
                <p className="font-mono text-[10px] text-darkgray/60">Always on</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
