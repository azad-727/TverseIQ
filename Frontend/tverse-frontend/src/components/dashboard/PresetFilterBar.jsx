import './PresetFilterBar.css';

const PRESETS = [
  { key: 'all', label: 'All Keywords' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shared', label: 'Shared' },
  { key: 'graduate', label: '🎓 Ready to Graduate' },
  { key: 'bleeding', label: '🩸 Bleeding' },
  { key: 'highCvr', label: 'High CVR' },
];

export function PresetFilterBar({ active, onChange }) {
  return (
    <div className="preset-filter-bar">
      {PRESETS.map(({ key, label }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`preset-pill ${active === key ? 'preset-pill-active' : ''}`}>
          {label}
        </button>
      ))}
    </div>
  );
}