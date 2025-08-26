import { Controller, Get } from '@nestjs/common';
import { FlowService } from './flow.service';

@Controller('flows')
export class FlowsController {
  constructor(private readonly flowService: FlowService) {}

  @Get('run')
  async runFlow() {
    const result = await this.flowService.runFlow();
    return { success: true, data: result };
  }
}