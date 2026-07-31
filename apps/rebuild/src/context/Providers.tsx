import { ReactNode } from "react";
import DrawerProvider from "./DrawerProvider";
import GradingGuideProvider from "./GradingGuideProvider";

interface ProvidersProps {
  children: ReactNode;
}

function Providers({ children }: ProvidersProps) {
  return (
    <GradingGuideProvider>
      <DrawerProvider>{children}</DrawerProvider>
    </GradingGuideProvider>
  );
}

export default Providers;
