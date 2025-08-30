import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { FlowExecuter, ReactFlow } from './flow-executer2';

@Injectable()
export class FlowService {
  async runFlow(botname?: string, botToken?: string): Promise<any> {
    const flowPath = path.resolve('src/flows/react-flow.json');
    const flowRaw = await readFile(flowPath, { encoding: 'utf-8' });
    const flow: ReactFlow = JSON.parse(flowRaw);
    const executer = new FlowExecuter(flow);
    const result = await executer.run();
    return result;
  }
}
