import type { BTNodeDef, NodeStatus } from '../model/node.types'
import { NODE_STATUS, NODE_TYPE } from '../model/node.types'
import type { BTRegistry } from '../model/registry.types'
import type { TickContext } from '../model/tick-context.types'

const tickSelector = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry, statusMap?: Map<string, NodeStatus>): NodeStatus => {
  for (const child of node.children ?? []) {
    const status = tickNode(child, ctx, reg, statusMap);
    if (status !== NODE_STATUS.FAILURE) return status;
  }
  return NODE_STATUS.FAILURE;
};

const tickSequence = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry, statusMap?: Map<string, NodeStatus>): NodeStatus => {
  for (const child of node.children ?? []) {
    const status = tickNode(child, ctx, reg, statusMap);
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
  const status = entry.fn(ctx, node.params);
  
  if (status === NODE_STATUS.SUCCESS || status === NODE_STATUS.RUNNING) {
    ctx.commands.push({ type: node.actionKey!, payload: node.params });
  }
  return status;
};

const tickDecorator = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry, statusMap?: Map<string, NodeStatus>): NodeStatus => {
  const child = node.children?.[0];
  if (!child) return NODE_STATUS.FAILURE;
  const status = tickNode(child, ctx, reg, statusMap);
  if (node.decoratorType === 'invert') {
    if (status === NODE_STATUS.SUCCESS) return NODE_STATUS.FAILURE;
    if (status === NODE_STATUS.FAILURE) return NODE_STATUS.SUCCESS;
  }
  return status;
};

export const tickNode = (node: BTNodeDef, ctx: TickContext, reg: BTRegistry, statusMap?: Map<string, NodeStatus>): NodeStatus => {
  let status: NodeStatus = NODE_STATUS.FAILURE;
  switch (node.type) {
    case NODE_TYPE.SELECTOR:  status = tickSelector(node, ctx, reg, statusMap); break;
    case NODE_TYPE.SEQUENCE:  status = tickSequence(node, ctx, reg, statusMap); break;
    case NODE_TYPE.CONDITION: status = tickCondition(node, ctx, reg); break;
    case NODE_TYPE.ACTION:    status = tickAction(node, ctx, reg); break;
    case NODE_TYPE.DECORATOR: status = tickDecorator(node, ctx, reg, statusMap); break;
  }
  if (statusMap) {
    statusMap.set(node.id, status);
  }
  return status;
};

/** Full tree tick — returns the root status plus a per-node status map for UI */
export const tickTree = (
  root: BTNodeDef,
  ctx: TickContext,
  reg: BTRegistry,
  statusMap: Map<string, NodeStatus> = new Map(),
): NodeStatus => {
  // Clear status map to 'idle' if we wanted to be thorough, but Map is fine.
  return tickNode(root, ctx, reg, statusMap);
};
