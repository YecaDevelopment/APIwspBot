import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
    
    constructor(
        private readonly configServ : ConfigService,
        private readonly webHookServ : WebhookService
    ){}

    @Get()
    async verifyWebhook(@Query('hub.mode') mode: string, @Query('hub.challenge') challenge: string, @Query('hub.verify_token') token: string) {
        try {
            if (mode && token === this.configServ.get('WSP_VERIFYTOKEN')) {
                return challenge;  
            } 
            else {return 'Error: token no válido'}
        }
        catch (error) {return {status: 'FAIL verifyToken', error}}
    }

    @Post()
    async handleWebhook(@Body() body: any) {
        try {
            console.log('Mensaje recibido:', body);

            const messages = body.entry[0]?.changes[0]?.value?.messages;
            if(messages && messages.length > 0){
                const from = messages[0].from;
                console.log('from USER: ', from);
                const newFrom = '54' + from.slice(3, from.length);
                console.log('from USER: ', newFrom);
                
                const data = await this.webHookServ.sendMessage(from);
                console.log('data: ', data);
                
            }

            return { status: 'received' };
        }
        catch (error) { return {status: 'FAIL handleWebHook', error}}
    }
}
