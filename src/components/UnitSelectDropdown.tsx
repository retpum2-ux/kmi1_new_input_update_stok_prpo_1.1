import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { SatuanUnit } from '../code/daftar-satuan';

interface UnitSelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  units: SatuanUnit[];
  onOpenMasterUnits?: () => void;
}

export const UnitSelectDropdown: React.FC<UnitSelectDropdownProps> = ({
  value,
  onChange,
  units,
  onOpenMasterUnits,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (unitCode: string) => {
    onChange(unitCode);
    setIsOpen(false);
  };

  const displayText = value ? value : 'U/M';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger styled with rounded corners without brackets */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-stone-800 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm font-bold tracking-wider text-stone-800 text-center transition-colors select-none cursor-pointer"
        title="Pilih satuan U/M"
      >
        <span className="w-full text-center">{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 text-stone-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu with rounded corners (melengkung) */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 max-h-60 flex flex-col bg-white border border-stone-400 shadow-xl rounded-lg z-50 overflow-hidden">
          <div className="overflow-y-auto divide-y divide-stone-100">
            {units.map((unit) => {
              const isSelected = unit.code === value;
              return (
                <button
                  key={unit.code}
                  type="button"
                  onClick={() => handleSelect(unit.code)}
                  className={`w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  <div>
                    <span className="font-mono font-bold text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-800">
                      {unit.code}
                    </span>
                    <span className="ml-2 text-xs text-stone-600">
                      {unit.name}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
          {onOpenMasterUnits && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenMasterUnits();
              }}
              className="w-full px-3 py-2 bg-stone-50 hover:bg-stone-100 border-t border-stone-200 text-xs font-bold text-blue-700 flex items-center justify-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kelola Satuan U/M</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
