import axios from 'axios';
import { Expression } from './condition';
import { ConditionEvaluator } from './condition-evaluator';

export type FlowNode = {
  id: string;
  type: string;
  next?: string; // id of the next node
  parameters?: Record<string, any>;
};

export type Flow = {
  nodes: FlowNode[];
};

export class FlowExecuter {
  private flowMap: Map<string, FlowNode> = new Map();

  constructor(private flow: Flow) {
    flow.nodes.forEach((node) => {
      this.flowMap.set(node.id, node);
    });
  }

  private async executeNode(nodeId: string, inputData: any): Promise<any> {
    const node = this.flowMap.get(nodeId);
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    switch (node.type) {
      case 'start':
        return this.executeNextNodes(node.next, inputData);
      case 'httpRequest':
        return this.executeHttpRequest(node, inputData);
      case 'condition':
        return this.executeCondition(node, inputData);
      case 'loop':
        return this.executeLoop(node, inputData);
      case 'end':
        return inputData;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private async executeHttpRequest(
    node: FlowNode,
    inputData: any,
  ): Promise<any> {
    const { url, method, headers, body } = node.parameters || {};

    // Replace placeholders with inputData if needed
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
      return this.executeNextNodes(node.next, response.data);
    } catch (error) {
      throw new Error(`HTTP request failed: ${error}`);
    }
  }

  private async executeCondition(node: FlowNode, inputData: any): Promise<any> {
    const { condition } = node.parameters || {};
    const evaluator = new ConditionEvaluator();
    const result = evaluator.evaluate(condition, inputData);

    if (result) {
      return this.executeNextNodes(node.next, inputData);
    } else if (node.parameters?.falseNext) {
      return this.executeNextNodes(node.parameters.falseNext, inputData);
    }

    return inputData;
  }

  private async executeLoop(node: FlowNode, inputData: any): Promise<any> {
    const { loopItems, itemVariable, loopNext } = node.parameters || {};
    if (!Array.isArray(loopItems)) {
      throw new Error('loopItems must be an array');
    }

    let lastOutput = inputData;
    for (const item of loopItems) {
      const loopInput = { ...lastOutput, [itemVariable]: item };
      lastOutput = await this.executeNextNodes(node.next, loopInput);
    }

    if (loopNext) {
      return this.executeNextNodes(loopNext, lastOutput);
    }

    return lastOutput;
  }

  private async executeNextNodes(
    nextIds: string | string[] | undefined,
    inputData: any,
  ): Promise<any> {
    if (!nextIds) {
      return inputData;
    }
    if (typeof nextIds === 'string') {
      return this.executeNode(nextIds, inputData);
    }
    // if array, execute all nodes sequentially and combine results
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

  public async run(): Promise<any> {
    // Find start node
    const startNode = this.flow.nodes.find((n) => n.type === 'start');
    if (!startNode) {
      throw new Error('Start node not found');
    }
    return this.executeNode(startNode.id, {});
  }
}
