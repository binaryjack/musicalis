export { BehaviorTreeEditor } from './ui/behavior-tree-editor';
export { defaultRegistry } from './lib/bt-registry';
export { tickTree } from './lib/bt-engine';
export { btReducer, btActions } from './store/bt-slice';
export { useBtEditor } from './hooks/use-bt-editor';
export type { BTNodeDef, BTTreeDef, NodeStatus, NodeType } from './model/node.types';
export type { TickContext } from './model/tick-context.types';
export type { BTRegistry } from './model/registry.types';
