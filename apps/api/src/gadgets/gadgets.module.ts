import { Module } from '@nestjs/common';
import { GadgetsController } from './gadgets.controller';
import { GadgetsService } from './gadgets.service';

@Module({
  controllers: [GadgetsController],
  providers: [GadgetsService],
  exports: [GadgetsService],
})
export class GadgetsModule {}
