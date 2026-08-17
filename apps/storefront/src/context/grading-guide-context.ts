import { createContext } from "react";

const GradingGuideContext = createContext<(() => void) | null>(null);

export { GradingGuideContext };
