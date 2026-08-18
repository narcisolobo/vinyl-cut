import StoreFilterOptionList from "./StoreFilterOptionList";

type StoreFilterDrawerFilter = {
  label: string;
  options: string[];
  selected: string[];
  handleToggle: (selection: string) => void;
};

interface StoreFilterDrawerProps {
  filters: StoreFilterDrawerFilter[];
}

function StoreFilterDrawer({ filters }: StoreFilterDrawerProps) {
  return (
    <div className="drawer drawer-end lg:hidden">
      <input
        id="mobile-filter-drawer"
        type="checkbox"
        className="drawer-toggle"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="drawer-side z-30">
        <label
          htmlFor="mobile-filter-drawer"
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
          <label
            htmlFor="mobile-filter-drawer"
            className="btn btn-primary mt-2 w-full"
          >
            Show Results
          </label>
        </div>
      </div>
    </div>
  );
}

export default StoreFilterDrawer;
