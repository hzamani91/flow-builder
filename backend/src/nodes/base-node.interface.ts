export interface INode {
  id: string;
  type: string;
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  execute(inputData: any): Promise<any>;
}