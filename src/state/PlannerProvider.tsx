import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { furnitureProducts } from '../data/furnitureProducts';
import { createInitialState, plannerReducer, type PlannerAction, type PlannerState } from './plannerState';

const PlannerContext = createContext<{ state: PlannerState; dispatch: Dispatch<PlannerAction> } | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(plannerReducer, furnitureProducts, createInitialState);
  return <PlannerContext.Provider value={{ state, dispatch }}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used inside PlannerProvider');
  return context;
}
