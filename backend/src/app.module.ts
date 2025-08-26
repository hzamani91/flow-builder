import { Module } from '@nestjs/common';
import { FlowsController } from './flows/flows.controller';
import { FlowService } from './flows/flow.service';

@Module({
  imports: [],
  controllers: [FlowsController],
  providers: [FlowService],
})
export class AppModule {}
