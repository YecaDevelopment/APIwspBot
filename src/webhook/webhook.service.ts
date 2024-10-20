import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { sendMessage } from './defaultMessages/defaultMessage';

@Injectable()
export class WebhookService {

    constructor(private readonly configServ : ConfigService){}

    async sendMessage(to : string, msg : string){
        try {
            const URL : string = `${this.configServ.get('WSP_URI')}${this.configServ.get('WSP_PHONENUM')}/messages`;            
            
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
