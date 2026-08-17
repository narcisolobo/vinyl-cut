import Divider from "@/components/Divider";

function AlbumGridCardSkeleton() {
  return (
    <li className="card card-sm lg:card-md bg-base-300 relative shadow-sm">
      <div className="skeleton aspect-square w-full rounded-b-none" />
      <div className="card-body">
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-5 w-1/2" />
        <Divider />
        <div className="card-actions items-center justify-between">
          <div className="skeleton h-8 w-16" />
          <div className="skeleton h-8 w-20" />
        </div>
      </div>
    </li>
  );
}

export default AlbumGridCardSkeleton;
