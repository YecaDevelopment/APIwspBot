import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { sendMessage } from './defaultMessages/defaultMessage';
import { ChatService } from 'src/chat/chat.service';
import { Chat, CurrentStep } from 'src/chat/chat';
import { JiraService } from 'src/jira/jira.service';

function validateMail(mail: string) {
    const mailPattern = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
    return mailPattern.test(mail);
}

@Injectable()
export class WebhookService {

    private groupOptionsSlot: number[] = []
    private requestOptionsSlot: number[] = []
    private requestFieldsOptionsSlot: number[] = []

    constructor(
        private readonly configServ : ConfigService,
        private readonly chatServ : ChatService,
        private readonly jiraServ : JiraService
    ){}

    async sendMessage(to : string, msg : string){
        try {
            const URL : string = `${this.configServ.get('WSP_URI')}${this.configServ.get('WSP_PHONENUM')}/messages`;
            let chat = this.chatServ.findChat(to)
            let answer : string = '...'

            if(typeof chat === "boolean") {
                chat = this.chatServ.startChat('hola', to, 1, 23)
                console.log(chat._currentStep)
            }

            switch(chat.getCurrentStep){
                case CurrentStep.welcome:
                    chat.currentStep = CurrentStep.identify
                    answer = "Hola! Soy el agente virtual de la mesa de ayuda, te voy acompañar en la generación de un ticket." + '\n' +  
                        "Voy a necesitar que escribas tu correo electronico correspondiente a la empresa en donde trabajas" + '\n' + 
                        "Ejemplo: tucorreo@email.com" + '\n' +
                        "¡Ten en cuenta que validaremos el formato del mismo, asi que antes de enviarlo revisa bien tu correo!"
                    break
                case CurrentStep.identify:
                    if(chat.accountId === null || chat.accountId === undefined) {
                        if(!validateMail(msg)) {
                            answer = "El formato del correo electronico NO es valido, por favor vuelva a intentarlo."
                            break
                        }
                        const verifyUser = await this.jiraServ.verifyUser(msg)
                        if(!verifyUser.status) {
                            answer = "No se logro verificar su identidad, por favor vuelva intentarlo."
                            break
                        }
                        chat.accountId = verifyUser.body
                    }
                    const issuesGroups = await this.jiraServ.getIssuesGroups(chat.projectId)
                    if(!issuesGroups.status) {
                        answer = "Fallo al obtener los grupos"
                        break
                    }
                    if(typeof issuesGroups.body === 'string') {
                        // Matar la operación?
                        answer = issuesGroups.body
                        break
                    }
                    const groupOptions = issuesGroups.body.map((issuesGroup: {id: string, name: string}, index) => {
                        this.groupOptionsSlot.push(parseInt(issuesGroup.id))
                        return `${index+1} . ${issuesGroup?.name}`
                    }).join('\n')
                    chat.currentStep = CurrentStep.selectGroup
                    answer = "Identidad verificada" + '\n' +
                        "Genial, ahora te comparto una lista de opciones, decime el número que se ajuste tu problema." 
                        + '\n' + groupOptions
                    break
                case CurrentStep.selectGroup:
                    if(isNaN(parseInt(msg))) {
                        answer = "El mensaje a enviar debe ser de valor numerico, por favor vuelva a intentar."
                        break
                    }
                    if(!this.groupOptionsSlot.findIndex(groupOption => groupOption === parseInt(msg)-1)) {
                        answer = "Opcion no encontrada, por favor vuelva a intentarlo"
                        break
                    }
                    const issuesRequests = await this.jiraServ.getIssuesRequests(chat.projectId, this.groupOptionsSlot[(parseInt(msg)-1)])
                    if(!issuesRequests.status) {
                        answer = "Fallo al obtener las solicitudes"
                        break
                    }
                    if(typeof issuesRequests.body === 'string') {
                        // Matar la operación?
                        answer = issuesRequests.body
                        break
                    }
                    chat.optionGroup = this.groupOptionsSlot[(parseInt(msg)-1)]
                    const requestOptions = issuesRequests.body.map((issuesRequest: {id: string, name: string}, index) => {
                        this.requestOptionsSlot.push(parseInt(issuesRequest.id))
                        return `${index+1} . ${issuesRequest?.name}`
                    }).join('\n')
                    chat.currentStep = CurrentStep.selectRequest
                    answer = "Genial, ahora te comparto una lista de opciones, decime el número que se ajuste a la solicitud que quieras realizar." 
                        + '\n' + requestOptions
                    break
                case CurrentStep.selectRequest:
                    if(isNaN(parseInt(msg))) {
                        answer = "El mensaje a enviar debe ser de valor numerico, por favor vuelva a intentar."
                        break
                    }
                    if(!this.requestOptionsSlot.findIndex(groupOption => groupOption === parseInt(msg)-1)) {
                        answer = "Opcion no encontrada, por favor vuelva a intentarlo"
                        break
                    }
                    const issuesRequestsFields = await this.jiraServ.getIssuesRequestsFields(chat.projectId, this.requestOptionsSlot[(parseInt(msg)-1)])
                    if(!issuesRequestsFields.status) {
                        answer = "Fallo al obtener las solicitudes"
                        break
                    }
                    if(typeof issuesRequestsFields.body === 'string') {
                        // Matar la operación?
                        answer = issuesRequestsFields.body
                        break
                    }
                    chat.optionRequest = this.requestOptionsSlot[(parseInt(msg)-1)]
                    const requestFieldOptions = issuesRequestsFields.body.map((issuesRequestField: {fieldId: string, name: string, required: boolean, validValues: string}) => {
                        return `- Nombre del campo: ${issuesRequestField?.name}\n   Es requerido: ${issuesRequestField.required ? 'No' : 'Si'}\n   ${issuesRequestField.validValues === "" ? "" : "Valores: " + issuesRequestField.validValues}`
                    }).join('\n')
                    chat.currentStep = CurrentStep.fillOptions
                    answer = "Genial, ahora te comparto una serie de campos de deberas completar:." 
                        + '\n' + requestFieldOptions
                    break
            }

            const data = {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "text",
                "text": {"body": answer}
            };
            console.log('DATAsending: ', data, this.configServ.get('WSP_PHONENUM'));

            // const response = await axios.post(URL, data, {
            //     headers: {
            //         Authorization: `Bearer ${this.configServ.get('WSP_PERMAACCTOKEN')}`,
            //         'Content-Type': 'application/json'
            //     },
            // })
            // console.log(response);

            return { data } // , response
        }
        catch (error) { return {status: 'FAIL webhookSERV', error}}
    }
}

