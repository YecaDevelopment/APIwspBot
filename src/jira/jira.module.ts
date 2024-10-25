import { Module } from '@nestjs/common';
import { JiraService } from './jira.service';
import { ChatModule } from 'src/chat/chat.module';
import { JiraController } from './jira.controller';

@Module({
  imports: [ChatModule],
  providers: [JiraService],
  exports: [JiraService],
  controllers: [JiraController],
})
export class JiraModule {}
