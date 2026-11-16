interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface OptionGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

/** A radio group drawn as pills. Real radio inputs, so keyboard and screen readers work natively. */
export function OptionGroup<T extends string>({ legend, name, value, options, onChange }: OptionGroupProps<T>) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
        {options.map((option) => (
          <label key={option.value} className="relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="block min-h-12 rounded-2xl border border-brass/25 px-4 py-2.5 transition-colors hover:border-brass/60 peer-checked:border-brass peer-checked:bg-brass/15 peer-focus-visible:ring-2 peer-focus-visible:ring-brass-soft">
              <span className="block text-sm font-semibold text-parchment">{option.label}</span>
              {option.hint && <span className="mt-0.5 block text-xs text-dust">{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
