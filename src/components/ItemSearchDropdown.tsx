import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Database } from 'lucide-react';
import { ItemBarang } from '../code/daftar-barang';

interface ItemSearchDropdownProps {
  value: string;
  onChange: (value: string, itemObj?: ItemBarang) => void;
  items: ItemBarang[];
  placeholder?: string;
  required?: boolean;
  onOpenMaster?: () => void;
}

export const ItemSearchDropdown: React.FC<ItemSearchDropdownProps> = ({
  value,
  onChange,
  items,
  placeholder = 'Cari / Pilih barang',
  required = false,
  onOpenMaster,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = items.filter((item) => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  const handleSelect = (item: ItemBarang) => {
    onChange(item.name, item);
    setSearchTerm(item.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchTerm(text);
    onChange(text);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input box with rounded corners (melengkung) */}
      <div className="flex items-center w-full bg-white border border-stone-800 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <input
          type="text"
          required={required}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm text-stone-900 bg-transparent placeholder-stone-400 focus:outline-none"
        />
        {/* Dropdown Arrow Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-l border-stone-300 transition-colors select-none cursor-pointer"
          title="Buka daftar barang"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu with rounded corners */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-64 flex flex-col bg-white border border-stone-400 shadow-xl rounded-lg z-50 overflow-hidden">
          <div className="overflow-y-auto divide-y divide-stone-100">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const isSelected = item.name.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={`${item.name}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 hover:bg-stone-100 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected ? 'bg-blue-50 font-semibold' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-stone-900 truncate">{item.name}</p>
                      {(item.code || item.category || item.defaultUnit) && (
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                          {item.code && (
                            <span className="font-mono text-[11px] bg-stone-100 px-1 py-0.2 rounded text-stone-600">
                              {item.code}
                            </span>
                          )}
                          {item.category && <span>• {item.category}</span>}
                          {item.defaultUnit && (
                            <span className="text-emerald-700 font-medium">
                              • Satuan: {item.defaultUnit}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-stone-500">
                Tidak ada barang yang cocok dengan "{searchTerm}".
              </div>
            )}
          </div>
          {onOpenMaster && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenMaster();
              }}
              className="w-full px-3 py-2 bg-stone-50 hover:bg-stone-100 border-t border-stone-200 text-xs font-bold text-blue-700 flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Kelola Master Barang</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
