import { createContext, useContext } from "react";

export type SlideMode = "teacher" | "participant";

export interface SlideCtx {
  mode: SlideMode;
  stepId: string;
}

/** Cine se uită la slide. Prezentatorul vede textul brut; participantul primește câmpuri și substituție la „Copiază”. */
export const SlideContext = createContext<SlideCtx>({ mode: "teacher", stepId: "" });

export const useSlide = () => useContext(SlideContext);
