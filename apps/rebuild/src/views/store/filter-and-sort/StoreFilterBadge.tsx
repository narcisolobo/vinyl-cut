import { XIcon } from "@phosphor-icons/react/dist/ssr";

interface StoreFilterBadgeProps {
  filterName: string;
  onDelete: (value: string) => void;
}

function StoreFilterBadge({ filterName, onDelete }: StoreFilterBadgeProps) {
  return (
    <span className="badge badge-primary">
      {filterName}{" "}
      <button className="cursor-pointer" onClick={() => onDelete(filterName)}>
        <XIcon />
      </button>
    </span>
  );
}

export default StoreFilterBadge;
