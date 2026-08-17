import { ReactNode } from "react";

interface StoreFilterContainerProps {
  children: ReactNode;
  className: string;
}

function StoreFilterContainer({
  children,
  className,
}: StoreFilterContainerProps) {
  return <div className={className}>{children}</div>;
}

export default StoreFilterContainer;
