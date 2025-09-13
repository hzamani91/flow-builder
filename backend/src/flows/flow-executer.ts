import axios from 'axios';
import { ConditionEvaluator } from './condition-evaluator';

export type ReactFlowNode = {
  id: string;
  type: string;
  data: {
    parameters?: Record<string, any>;
  };
};

export type ReactFlowEdge = {
  id: string;
  source: string;
  target: string;
};

export type ReactFlow = {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
};

export class FlowExecuter {
  private flowMap: Map<string, ReactFlowNode> = new Map();
  private edges: ReactFlowEdge[] = [];

  constructor(private flow: ReactFlow) {
    flow.nodes.forEach((node) => {
      this.flowMap.set(node.id, node);
    });
    this.edges = flow.edges;
  }

  private async executeNode(nodeId: string, inputData: any): Promise<any> {
    const node = this.flowMap.get(nodeId);
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    switch (node.type) {
      case 'start':
        return this.executeNextNodes(nodeId, inputData);
      case 'httpRequest':
        return this.executeHttpRequest(node, nodeId, inputData);
      case 'condition':
        return this.executeCondition(node, nodeId, inputData);
      case 'loop':
        return this.executeLoop(node, nodeId, inputData);
      case 'end':
        return inputData;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private async executeHttpRequest(
    node: ReactFlowNode,
    nodeId: string,
    inputData: any,
  ): Promise<any> {
    const { url, method, headers, body } = node.data.parameters || {};

    const resolvedUrl = this.resolvePlaceholders(url, inputData);
    const resolvedHeaders = this.resolvePlaceholdersInObject(
      headers,
      inputData,
    );
    const resolvedBody = this.resolvePlaceholders(body, inputData);

    try {
      const response = await axios({
        url: resolvedUrl,
        method: method || 'GET',
        headers: resolvedHeaders,
        data: resolvedBody,
      });
      return this.executeNextNodes(nodeId, response.data);
    } catch (error) {
      throw new Error(`HTTP request failed: ${error}`);
    }
  }

  private async executeCondition(
    node: ReactFlowNode,
    nodeId: string,
    inputData: any,
  ): Promise<any> {
    const { condition, falseNext } = node.data.parameters || {};
    const evaluator = new ConditionEvaluator();
    const result = evaluator.evaluate(condition, inputData);

    if (result) {
      return this.executeNextNodes(nodeId, inputData);
    } else if (falseNext) {
      return this.executeNode(falseNext, inputData);
    }

    return inputData;
  }

  private async executeLoop(
    node: ReactFlowNode,
    nodeId: string,
    inputData: any,
  ): Promise<any> {
    const { loopItems, itemVariable, loopNext } = node.data.parameters || {};
    if (!Array.isArray(loopItems)) {
      throw new Error('loopItems must be an array');
    }

    let lastOutput = inputData;
    for (const item of loopItems) {
      const loopInput = { ...lastOutput, [itemVariable]: item };
      lastOutput = await this.executeNextNodes(nodeId, loopInput);
    }

    if (loopNext) {
      return this.executeNode(loopNext, lastOutput);
    }

    return lastOutput;
  }

  private async executeNextNodes(
    currentNodeId: string,
    inputData: any,
  ): Promise<any> {
    const nextIds = this.edges
      .filter((edge) => edge.source === currentNodeId)
      .map((edge) => edge.target);

    if (nextIds.length === 0) {
      return inputData;
    }

    let lastOutput = inputData;
    for (const nextId of nextIds) {
      lastOutput = await this.executeNode(nextId, lastOutput);
    }
    return lastOutput;
  }

  private resolvePlaceholders(template: any, data: any): any {
    if (typeof template === 'string') {
      return template.replace(/{{(.*?)}}/g, (_, g) => {
        let [pathPart, defaultPart] = g.split('|').map((s) => s.trim());
        const path = pathPart.split('.');

        let value = data;
        for (const key of path) {
          if (value == null) {
            value = undefined;
            break;
          }
          value = value[key];
        }

        if (value == null && defaultPart?.startsWith('default:')) {
          value = defaultPart.replace('default:', '').trim();
        }

        return value != null ? value : '';
      });
    }
    return template;
  }

  private resolvePlaceholdersInObject(obj: any, data: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.resolvePlaceholders(obj, data);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.resolvePlaceholdersInObject(item, data));
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        result[key] = this.resolvePlaceholdersInObject(obj[key], data);
      }
      return result;
    }

    return obj;
  }

  public async run(inputData:Record<string,any>): Promise<any> {
    const startNode = this.flow.nodes.find((n) => n.type === 'start');
    if (!startNode) {
      throw new Error('Start node not found');
    }
    return this.executeNode(startNode.id, inputData);
  }
}
