export const NODE_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  RUNNING: 'running',
  IDLE: 'idle',
} as const;

export type NodeStatus = typeof NODE_STATUS[keyof typeof NODE_STATUS];

export const NODE_TYPE = {
  SELECTOR: 'selector',
  SEQUENCE: 'sequence',
  ACTION: 'action',
  CONDITION: 'condition',
  DECORATOR: 'decorator',
} as const;

export type NodeType = typeof NODE_TYPE[keyof typeof NODE_TYPE];

export type DecoratorType = 'invert' | 'repeat' | 'throttle';

export interface ParamDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  defaultValue?: unknown;
}

export interface BTNodeDef {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  /** Only for condition nodes */
  conditionKey?: string;
  /** Only for action nodes */
  actionKey?: string;
  /** Only for decorator nodes */
  decoratorType?: DecoratorType;
  decoratorParams?: Record<string, unknown>;
  /** Runtime params passed to condition/action fn */
  params?: Record<string, unknown>;
  children?: BTNodeDef[];
}

export interface BTTreeDef {
  id: string;
  name: string;
  description?: string;
  root: BTNodeDef;
  createdAt: string;
  updatedAt: string;
}
