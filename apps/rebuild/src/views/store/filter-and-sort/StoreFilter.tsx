import slugify from "slugify";

interface StoreFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (selection: string) => void;
}

function StoreFilter({ label, options, selected, onToggle }: StoreFilterProps) {
  return (
    <fieldset>
      <legend className="sr-only">Filter by {label}</legend>
      <details className="dropdown max-w-80 min-w-52">
        <summary className="btn btn-primary btn-soft mb-1 flex w-full items-center justify-between">
          {label}
          <span className="badge badge-sm badge-primary">
            {selected.length}
          </span>
        </summary>
        <ul className="dropdown-content menu bg-base-100 z-30 max-h-72 w-52 flex-nowrap overflow-y-auto p-2 shadow-sm">
          {options.map((option) => {
            const id = slugify(`${label} ${option}`.toLowerCase());
            return (
              <li key={option} className="text-primary">
                <label htmlFor={id}>
                  <input
                    id={id}
                    type="checkbox"
                    value={option}
                    checked={selected.includes(option)}
                    className="checkbox checkbox-sm checkbox-primary"
                    onChange={() => onToggle(option)}
                  />
                  {option}
                </label>
              </li>
            );
          })}
        </ul>
      </details>
    </fieldset>
  );
}

export default StoreFilter;
