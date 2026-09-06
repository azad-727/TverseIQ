import React from 'react';

export function SegmentedControl({ options, active, onChange }) {
  return (
    <div className="flex bg-[#EAEBED] p-1 rounded-xl gap-1 border border-zinc-200/50">
      {options.map((option) => {
        const isSelected = active === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all duration-150 ${
              isSelected
                ? 'bg-white text-zinc-900 shadow-sm border border-black/5'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}