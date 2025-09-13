import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { FlowExecuter, ReactFlow } from './flow-executer';

@Injectable()
export class FlowService {
  async runFlow(inputData:Record<string,any>): Promise<any> {
    const flowPath = path.resolve('src/flows/react-flow.json');
    const flowRaw = await readFile(flowPath, { encoding: 'utf-8' });
    const flow: ReactFlow = JSON.parse(flowRaw);
    const executer = new FlowExecuter(flow);
    const result = await executer.run(inputData);
    return result;
  }
}
