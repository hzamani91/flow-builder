import { Controller, Get, Param } from '@nestjs/common';
import { FlowService } from './flow.service';

@Controller('flows')
export class FlowsController {
  constructor(private readonly flowService: FlowService) {}

  @Get('run/:id')
  async runFlow(@Param('id') id:number) {
    const result = await this.flowService.runFlow({todoId:id});
    return { success: true, data: result };
  }
}