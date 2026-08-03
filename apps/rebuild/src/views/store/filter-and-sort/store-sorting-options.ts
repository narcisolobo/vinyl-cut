import { type SortOptions } from "@/types/sort-options";

type SortingOption = {
  label: string;
  value: SortOptions;
};

const SORTING_OPTIONS: SortingOption[] = [
  {
    label: "Latest Arrivals",
    value: "latest",
  },
  {
    label: "Artist: A → Z",
    value: "artist-asc",
  },
  {
    label: "Price: Low → High",
    value: "price-asc",
  },
  {
    label: "Price: High → Low",
    value: "price-desc",
  },
];

export { SORTING_OPTIONS };
