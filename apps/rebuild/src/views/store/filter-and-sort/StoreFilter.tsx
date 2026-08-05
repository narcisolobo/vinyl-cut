import StoreFilterOptionList from "./StoreFilterOptionList";

interface StoreFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (selection: string) => void;
}

function StoreFilter({ label, options, selected, onToggle }: StoreFilterProps) {
  return (
    <details className="dropdown max-w-80 min-w-52">
      <summary className="btn btn-primary btn-soft mb-1 flex w-full items-center justify-between">
        {label}
        <span className="badge badge-sm badge-primary">{selected.length}</span>
      </summary>
      <div className="dropdown-content bg-base-100 z-30 max-h-72 w-52 overflow-y-auto p-2 shadow-sm">
        <StoreFilterOptionList
          idPrefix="desktop"
          label={label}
          options={options}
          selected={selected}
          onToggle={onToggle}
        />
      </div>
    </details>
  );
}

export default StoreFilter;
