import type { BTNodeDef, NodeStatus } from '../model/node.types';
import type { TickContext } from '../model/tick-context.types';
import type { BTRegistry } from '../model/registry.types';
import { NODE_STATUS, NODE_TYPE } from '../model/node.types';

const tickSelector = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry): NodeStatus => {
  for (const child of node.children ?? []) {
    const status = tickNode(child, ctx, reg);
    if (status !== NODE_STATUS.FAILURE) return status;
  }
  return NODE_STATUS.FAILURE;
};

const tickSequence = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry): NodeStatus => {
  for (const child of node.children ?? []) {
    const status = tickNode(child, ctx, reg);
    if (status !== NODE_STATUS.SUCCESS) return status;
  }
  return NODE_STATUS.SUCCESS;
};

const tickCondition = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry): NodeStatus => {
  const entry = node.conditionKey ? reg.conditions[node.conditionKey] : null;
  if (!entry) return NODE_STATUS.FAILURE;
  return entry.fn(ctx, node.params) ? NODE_STATUS.SUCCESS : NODE_STATUS.FAILURE;
};

const tickAction = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry): NodeStatus => {
  const entry = node.actionKey ? reg.actions[node.actionKey] : null;
  if (!entry) return NODE_STATUS.FAILURE;
  return entry.fn(ctx, node.params);
};

const tickDecorator = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry): NodeStatus => {
  const child = node.children?.[0];
  if (!child) return NODE_STATUS.FAILURE;
  const status = tickNode(child, ctx, reg);
  if (node.decoratorType === 'invert') {
    if (status === NODE_STATUS.SUCCESS) return NODE_STATUS.FAILURE;
    if (status === NODE_STATUS.FAILURE) return NODE_STATUS.SUCCESS;
  }
  return status;
};

export const tickNode = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry): NodeStatus => {
  switch (node.type) {
    case NODE_TYPE.SELECTOR:  return tickSelector(node, ctx, reg);
    case NODE_TYPE.SEQUENCE:  return tickSequence(node, ctx, reg);
    case NODE_TYPE.CONDITION: return tickCondition(node, ctx, reg);
    case NODE_TYPE.ACTION:    return tickAction(node, ctx, reg);
    case NODE_TYPE.DECORATOR: return tickDecorator(node, ctx, reg);
    default: return NODE_STATUS.FAILURE;
  }
};

/** Full tree tick — returns the root status plus a per-node status map for UI */
export const tickTree = (
  root: BTNodeDef,
  ctx: TickContext,
  reg: BTRegistry,
  statusMap: Map<string, NodeStatus> = new Map(),
): NodeStatus => {
  const status = tickNode(root, ctx, reg);
  statusMap.set(root.id, status);
  for (const child of root.children ?? []) {
    tickTree(child, ctx, reg, statusMap);
  }
  return status;
};
