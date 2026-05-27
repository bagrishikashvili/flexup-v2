import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/utils/cn';

export interface AddressResult {
  displayName: string;
  city: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const AUTOCOMPLETE_URL = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[
  'VITE_ADDRESS_AUTOCOMPLETE_URL'
];

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  disabled,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedValue = useDebounce(value, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 2 || !AUTOCOMPLETE_URL) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${AUTOCOMPLETE_URL}?q=${encodeURIComponent(debouncedValue)}`)
      .then((r) => r.json())
      .then((data: AddressResult[]) => {
        if (!cancelled) {
          setSuggestions(Array.isArray(data) ? data : []);
          setOpen(data.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(result: AddressResult) {
    onChange(result.displayName);
    onSelect(result);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-md overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors flex flex-col gap-0.5"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
              >
                <span className="font-medium text-foreground truncate">{s.displayName}</span>
                <span className="text-xs text-muted-foreground">{s.city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
