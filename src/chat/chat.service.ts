import { Injectable } from '@nestjs/common';
import * as conversation from '../chat/chat'
@Injectable()
export class ChatService {
    protected conversation = conversation

    constructor(){}

    startChat(welcomeMsg : string, userPhone : string, projectId : number, projectIdSDA : number) : conversation.Chat {
        return this.conversation.startChat(welcomeMsg, userPhone, projectId, projectIdSDA)
    }

    findChat(userPhone : string): (conversation.Chat | boolean){
        return this.conversation.findChat(userPhone)
    }

    findAllChat() {
        return this.conversation.findAllChat()        
    }

    endChat(userPhone : string) : string {
        return this.conversation.endChat(userPhone)
    }
}
