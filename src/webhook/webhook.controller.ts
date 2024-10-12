import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('webhook')
export class WebhookController {
    
    constructor(private readonly configServ : ConfigService ){}

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
            // Aquí vamos a procesar el mensaje y responder
            return { status: 'received' };
        }
        catch (error) { return {status: 'FAIL handleWebHook', error}}
    }
}
