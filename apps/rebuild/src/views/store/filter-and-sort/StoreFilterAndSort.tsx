"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StoreFilter from "./StoreFilter";
import StoreFilterBadge from "./StoreFilterBadge";
import { GENRES, ERAS, CONDITIONS, toggleValue } from "./store-filter-utils";

function StoreFilterAndSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    () => searchParams.get("genre")?.split(",") ?? [],
  );
  const [selectedEras, setSelectedEras] = useState<string[]>(
    () => searchParams.get("era")?.split(",") ?? [],
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    () => searchParams.get("condition")?.split(",") ?? [],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGenres.length > 0) params.set("genre", selectedGenres.join(","));
    if (selectedEras.length > 0) params.set("era", selectedEras.join(","));
    if (selectedConditions.length > 0)
      params.set("condition", selectedConditions.join(","));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [selectedGenres, selectedEras, selectedConditions, pathname, router]);

  const filters = [
    {
      label: "Genres",
      options: GENRES,
      selected: selectedGenres,
      handleToggle: (value: string) =>
        setSelectedGenres((prev) => toggleValue(prev, value)),
    },
    {
      label: "Eras",
      options: ERAS,
      selected: selectedEras,
      handleToggle: (value: string) =>
        setSelectedEras((prev) => toggleValue(prev, value)),
    },
    {
      label: "Conditions",
      options: CONDITIONS,
      selected: selectedConditions,
      handleToggle: (value: string) =>
        setSelectedConditions((prev) => toggleValue(prev, value)),
    },
  ];

  const selectedFilters = filters.flatMap(({ label, selected, handleToggle }) =>
    selected.map((value) => ({ category: label, value, handleToggle })),
  );

  return (
    <section className="bg-base-300 px-8 py-4">
      <h2 className="sr-only">Filter and Sort Products</h2>
      <div className="max-w-8xl mx-auto flex justify-between">
        <section className="flex items-center gap-2">
          <h3 className="sr-only">Filtering Options</h3>
          {filters.map(({ label, options, selected, handleToggle }) => (
            <StoreFilter
              key={label}
              label={label}
              options={options}
              selected={selected}
              onToggle={handleToggle}
            />
          ))}
        </section>
        <section>
          <h3 className="sr-only">Sorting Options</h3>
          <fieldset className="flex items-center gap-2">
            <label htmlFor="sorting-options">Sort: </label>
            <select
              name="sorting-options"
              defaultValue="latest"
              className="select select-soft max-w-80 min-w-52 font-semibold"
            >
              <option value="latest">Latest Arrivals</option>
              <option value="artist">Artist: A → Z</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
          </fieldset>
        </section>
      </div>
      <section className="max-w-8xl mx-auto py-4">
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
