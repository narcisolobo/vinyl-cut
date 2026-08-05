import slugify from "slugify";

interface StoreFilterOptionListProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (selection: string) => void;
  idPrefix: string;
}

function StoreFilterOptionList({
  label,
  options,
  selected,
  onToggle,
  idPrefix,
}: StoreFilterOptionListProps) {
  return (
    <fieldset>
      <legend className="sr-only">Filter by {label}</legend>
      <ul className="menu w-full flex-nowrap">
        {options.map((option) => {
          const id = slugify(`${idPrefix} ${label} ${option}`.toLowerCase());
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
    </fieldset>
  );
}

export default StoreFilterOptionList;
