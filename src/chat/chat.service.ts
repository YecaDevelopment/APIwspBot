import { Injectable } from '@nestjs/common';
import * as conversation from '../chat/chat'
@Injectable()
export class ChatService {
    private conversation = conversation

    constructor(){}

    startChat(welcomeMsg : string, userPhone : string) : string {
        return this.conversation.startChat(welcomeMsg, userPhone)
    }

    findChat(userPhone : string): (conversation.Chat | boolean){
        return this.conversation.findChat(userPhone)
    }

    endChat(userPhone : string) : string {
        return this.conversation.endChat(userPhone)
    }
}
