import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { sendMessage } from './defaultMessages/defaultMessage';
import { ChatService } from 'src/chat/chat.service';
import { Chat } from 'src/chat/chat';

@Injectable()
export class WebhookService {

    constructor(
        private readonly configServ : ConfigService,
        private readonly chatServ : ChatService
    ){}

    async sendMessage(to : string, msg : string){
        try {
            const URL : string = `${this.configServ.get('WSP_URI')}${this.configServ.get('WSP_PHONENUM')}/messages`;            
            let chat : Chat | boolean | string;

            if(this.chatServ.findChat(to)) {
                chat = this.chatServ.findChat(to)
            }else {
                //chat = this.chatServ.startChat(sendMessage('hola'), to)
            }

            const data = {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "text",
                "text": {"body": sendMessage(msg)}
            };
            console.log('DATAsending: ', data, this.configServ.get('WSP_PHONENUM'));
            
            const response = await axios.post(URL, data, {
                headers: {
                    Authorization: `Bearer ${this.configServ.get('WSP_PERMAACCTOKEN')}`,
                    'Content-Type': 'application/json'
                },
            })
            console.log(response);
            
            return {data, response}
        } 
        catch (error) { return {status: 'FAIL webhookSERV', error}}
    }
}
