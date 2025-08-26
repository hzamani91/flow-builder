import { Injectable } from '@nestjs/common';
import * as path from 'path';
import {readFile} from 'fs/promises';
import { FlowExecuter, Flow } from './flow-executer';

@Injectable()
export class FlowService {
  async runFlow(): Promise<any> {
    const flowPath = path.resolve('src/flows/example-flow.json');
    const flowRaw = await readFile(flowPath, { encoding: 'utf-8' });
    const flow: Flow = JSON.parse(flowRaw);
    const executer = new FlowExecuter(flow);
    const result = await executer.run();
    return result;
  }
}
