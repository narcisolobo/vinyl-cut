"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StoreFilter from "./StoreFilter";
import StoreFilterBadge from "./StoreFilterBadge";
import { CONDITIONS, ERAS, GENRES, toggleValue } from "./store-filter-utils";
import { SORTING_OPTIONS } from "./store-sorting-options";
import StoreFilterContainer from "./StoreFilterContainer";
import StoreFilterButton from "./StoreFilterButton";
import StoreFilterDrawer from "./StoreFilterDrawer";

function StoreFilterAndSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filterCheckboxRef = useRef<HTMLInputElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);

  const toggleFilterDrawer = () => {
    if (filterCheckboxRef.current) {
      filterCheckboxRef.current.checked = !filterCheckboxRef.current.checked;
    }
  };

  const closeFilterDrawer = () => {
    if (!filterCheckboxRef.current?.checked) return;
    filterCheckboxRef.current.checked = false;
    filterTriggerRef.current?.focus();
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeFilterDrawer();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedSort = searchParams.get("sort") ?? "latest";

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "latest") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const selectedGenres =
    searchParams.get("genre")?.split(",").filter(Boolean) ?? [];
  const selectedEras =
    searchParams.get("era")?.split(",").filter(Boolean) ?? [];
  const selectedConditions =
    searchParams.get("condition")?.split(",").filter(Boolean) ?? [];

  const updateFilter = (key: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (values.length > 0) {
      params.set(key, values.join(","));
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filters = [
    {
      label: "Genres",
      options: GENRES,
      selected: selectedGenres,
      handleToggle: (value: string) =>
        updateFilter("genre", toggleValue(selectedGenres, value)),
    },
    {
      label: "Eras",
      options: ERAS,
      selected: selectedEras,
      handleToggle: (value: string) =>
        updateFilter("era", toggleValue(selectedEras, value)),
    },
    {
      label: "Conditions",
      options: CONDITIONS,
      selected: selectedConditions,
      handleToggle: (value: string) =>
        updateFilter("condition", toggleValue(selectedConditions, value)),
    },
  ];

  const selectedFilters = filters.flatMap(({ label, selected, handleToggle }) =>
    selected.map((value) => ({ category: label, value, handleToggle })),
  );

  return (
    <section className="mt-18 bg-transparent px-8 py-4">
      <h2 className="sr-only">Filter and Sort Products</h2>
      <div className="max-w-8xl mx-auto flex justify-between">
        <section>
          <h3 className="sr-only">Filtering Options</h3>
          <StoreFilterButton
            filterCount={selectedFilters.length}
            triggerRef={filterTriggerRef}
            onToggle={toggleFilterDrawer}
          />
          <StoreFilterContainer className="hidden items-center gap-2 lg:flex">
            {filters.map(({ label, options, selected, handleToggle }) => (
              <StoreFilter
                key={label}
                label={label}
                options={options}
                selected={selected}
                onToggle={handleToggle}
              />
            ))}
          </StoreFilterContainer>
          <StoreFilterDrawer
            filters={filters}
            checkboxRef={filterCheckboxRef}
            onClose={closeFilterDrawer}
          />
        </section>
        <section>
          <h3 className="sr-only">Sorting Options</h3>
          <fieldset className="flex items-center gap-2">
            <label htmlFor="sorting-options" className="hidden sm:block">
              Sort:{" "}
            </label>
            <select
              name="sorting-options"
              value={selectedSort}
              className="select select-sm md:select-md select-soft max-w-80 min-w-52 font-semibold"
              onChange={(e) => updateSort(e.target.value)}
            >
              {SORTING_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </fieldset>
        </section>
      </div>
      <section className="mx-auto max-w-7xl py-4">
        <h2 className="sr-only">Selected Filters</h2>
        <div className="space-x-2">
          {selectedFilters.length > 0 &&
            selectedFilters.map(({ category, value, handleToggle }) => (
              <StoreFilterBadge
                key={`${category}-${value}`}
                filterName={value}
                onDelete={handleToggle}
              />
            ))}
        </div>
      </section>
    </section>
  );
}

export default StoreFilterAndSort;
