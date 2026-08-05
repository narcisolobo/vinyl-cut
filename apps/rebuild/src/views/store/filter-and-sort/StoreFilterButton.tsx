interface StoreFilterButtonProps {
  filterCount: number;
}

function StoreFilterButton({ filterCount }: StoreFilterButtonProps) {
  return (
    <button className="btn btn-sm md:btn-md btn-primary btn-soft lg:hidden">
      Filter
      <span className="badge badge-sm badge-primary">{filterCount}</span>
    </button>
  );
}

export default StoreFilterButton;
