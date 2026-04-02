import type { NodeStatus, ParamDef } from './node.types';
import type { TickContext } from './tick-context.types';

export type ConditionFn = (context: TickContext, params?: Record<string, unknown>) => boolean;
export type ActionFn = (context: TickContext, params?: Record<string, unknown>) => NodeStatus;

export interface ConditionEntry {
  key: string;
  label: string;
  description: string;
  params?: ParamDef[];
  fn: ConditionFn;
}

export interface ActionEntry {
  key: string;
  label: string;
  description: string;
  params?: ParamDef[];
  fn: ActionFn;
}

export interface BTRegistry {
  conditions: Record<string, ConditionEntry>;
  actions: Record<string, ActionEntry>;
}
