"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { SceneCard } from "~/lib/ai/types";

export type WizardStep = 1 | 2;

interface WizardState {
  currentStep: WizardStep;
  inputText: string;
  highlights: string[];
  sceneCards: SceneCard[];
  selectedCard: SceneCard | null;
  isLoading: boolean;
  error: string | null;
}

interface WizardContextType extends WizardState {
  setInputText: (text: string) => void;
  setHighlights: (highlights: string[]) => void;
  addHighlight: (highlight: string) => void;
  removeHighlight: (index: number) => void;
  setSceneCards: (cards: SceneCard[]) => void;
  setSelectedCard: (card: SceneCard | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialState: WizardState = {
  currentStep: 1,
  inputText: "",
  highlights: [],
  sceneCards: [],
  selectedCard: null,
  isLoading: false,
  error: null,
};

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const setInputText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, inputText: text }));
  }, []);

  const setHighlights = useCallback((highlights: string[]) => {
    setState((prev) => ({ ...prev, highlights }));
  }, []);

  const addHighlight = useCallback((highlight: string) => {
    setState((prev) => ({
      ...prev,
      highlights: [...prev.highlights, highlight],
    }));
  }, []);

  const removeHighlight = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  }, []);

  const setSceneCards = useCallback((cards: SceneCard[]) => {
    setState((prev) => ({ ...prev, sceneCards: cards }));
  }, []);

  const setSelectedCard = useCallback((card: SceneCard | null) => {
    setState((prev) => ({ ...prev, selectedCard: card }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error: error }));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const next = Math.min(prev.currentStep + 1, 2) as WizardStep;
      return { ...prev, currentStep: next };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      const previous = Math.max(prev.currentStep - 1, 1) as WizardStep;
      return { ...prev, currentStep: previous };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <WizardContext.Provider
      value={{
        ...state,
        setInputText,
        setHighlights,
        addHighlight,
        removeHighlight,
        setSceneCards,
        setSelectedCard,
        setIsLoading,
        setError,
        goToStep,
        nextStep,
        prevStep,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
