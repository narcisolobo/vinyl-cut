interface StoreFilterButtonProps {
  filterCount: number;
}

function StoreFilterButton({ filterCount }: StoreFilterButtonProps) {
  return (
    <label
      htmlFor="mobile-filter-drawer"
      className="btn btn-sm md:btn-md btn-primary btn-soft drawer-button lg:hidden"
    >
      Filter
      <span className="badge badge-sm badge-primary">{filterCount}</span>
    </label>
  );
}

export default StoreFilterButton;
