import { type RefObject } from "react";
import StoreFilterOptionList from "./StoreFilterOptionList";

type StoreFilterDrawerFilter = {
  label: string;
  options: string[];
  selected: string[];
  handleToggle: (selection: string) => void;
};

interface StoreFilterDrawerProps {
  filters: StoreFilterDrawerFilter[];
  checkboxRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
}

function StoreFilterDrawer({
  filters,
  checkboxRef,
  onClose,
}: StoreFilterDrawerProps) {
  return (
    <div className="drawer drawer-end lg:hidden">
      <input
        ref={checkboxRef}
        id="mobile-filter-drawer"
        type="checkbox"
        className="drawer-toggle"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="drawer-side z-30">
        <button
          type="button"
          onClick={onClose}
          aria-label="close filters"
          className="drawer-overlay"
        />
        <div className="menu bg-base-100 min-h-full w-80 p-4">
          {filters.map(({ label, options, selected, handleToggle }) => (
            <div
              key={label}
              className="collapse-arrow bg-base-200 collapse mb-2"
            >
              <input type="radio" name="mobile-filter-accordion" />
              <div className="collapse-title flex items-center gap-2">
                {label}
                <span className="badge badge-sm badge-primary">
                  {selected.length}
                </span>
              </div>
              <div className="collapse-content">
                <StoreFilterOptionList
                  idPrefix="mobile"
                  label={label}
                  options={options}
                  selected={selected}
                  onToggle={handleToggle}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary mt-2 w-full"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default StoreFilterDrawer;
