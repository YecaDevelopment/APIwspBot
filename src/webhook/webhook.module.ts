import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { ChatModule } from 'src/chat/chat.module';
import { JiraModule } from 'src/jira/jira.module';

@Module({
  imports: [ChatModule, JiraModule],
  controllers: [WebhookController],
  providers: [WebhookService]
})
export class WebhookModule {}
