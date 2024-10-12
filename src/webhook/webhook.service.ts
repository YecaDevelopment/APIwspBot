import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WebhookService {

    constructor(private readonly configServ : ConfigService){}

    async sendMessage(to : string){
        try {
            const URL : string = `${this.configServ.get('WSP_URI')}${this.configServ.get('WSP_PHONENUM')}/messages`;            
            
            const data = {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "template",
                "template": {
                    "name": "hello_world",
                    "language": {
                        "code": "en_US"
                    }
                }
            };
            console.log('DATAsending: ', data);
            

            const response = await axios.post(URL, data, {
                headers: {
                    Authorization: `Bearer ${this.configServ.get('WSP_ACCTOKEN')}`,
                    "Content-Type": 'application/json'
                },
            })
            return {data, response}
        } 
        catch (error) { return {status: 'FAIL webhookSERV', error}}
    }
}
