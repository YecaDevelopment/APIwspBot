import { Body, Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';

import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {

    constructor(private readonly chatServ : ChatService) {}

    @Get('init')
    async initChat(@Body() values : {phone : string}){
        try {
            const newChat = await this.chatServ.startChat('Hi Mark', values.phone, 1, 23)
            return newChat  
        }
        catch (error) {return error}
    }

    @Get('find')
    async findChat(@Query('phone') phone : string){
        try {
            const newChat = await this.chatServ.findChat(phone)
            console.log(newChat);
                        
            return newChat ? "Chat FOUNDED" : "Chat NOT FOUND"  
        }
        catch (error) {return error}
    }

    @Get('findAll')
    async findAllChat(@Res() res : Response){
        try {
            const allChats = await this.chatServ.findAllChat()            
            return res.json(allChats);
        }
        catch (error) {return error}
    }

    @Get('destroy/:phone')
    async destroyChat(@Param('phone') phone : string){
        try {
            const newChat = await this.chatServ.endChat(phone)
            return newChat
        }
        catch (error) {return error}
    }
}
