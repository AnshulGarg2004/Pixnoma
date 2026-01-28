import { createContext, useContext } from "react"
import type { Canvas } from "fabric";

interface CanvasContextProps {
  canvasEditor: Canvas | null;
  setCanvasEditor: React.Dispatch<React.SetStateAction<Canvas | null>>;
  activeTool: string;
  onToolChange: (tool: string) => void;
  processingMessage: string | null;
  setProcessingMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const CanvasContext = createContext<CanvasContextProps | null>(null);

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}
