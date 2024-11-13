import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatService } from 'src/chat/chat.service';
import { CurrentStep } from 'src/chat/chat';
import { infoTKT, JiraService } from 'src/jira/jira.service';

@Injectable()
export class WebhookService {

    private groupOptionsSlot: number[] = []
    private requestOptionsSlot: {id: string, name: string, issueTypeId: string, groupId: number, canCreate: boolean}[] = []
    private requestFieldsSlot: any[] = []
    private validatedFields: {fieldId : string, value: string | {}}[] = []
    private tkt : infoTKT

    constructor(
        private readonly configServ : ConfigService,
        private readonly chatServ : ChatService,
        private readonly jiraServ : JiraService
    ){}

    private validateMail(mail: string) {
        const mailPattern = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
        return mailPattern.test(mail);
    }

    async sendMessage(to : string, msg : string){
        try {
            const URL : string = `${this.configServ.get('WSP_URI')}${this.configServ.get('WSP_PHONENUM')}/messages`;
            let chat = this.chatServ.findChat(to)
            let answer : string = '...'

            if(typeof chat === "boolean") {
                chat = this.chatServ.startChat(msg, to, 1, 23)
            }

            switch(chat.getCurrentStep){
                case CurrentStep.welcome:
                    chat.currentStep = CurrentStep.identify
                    answer = "Hola! Soy el agente virtual de la mesa de ayuda, te voy acompañar en la generación de un ticket." + '\n' +  
                        "Voy a necesitar que escribas tu correo electronico correspondiente a la empresa en donde trabajas" + '\n' + 
                        "Ejemplo: tucorreo@email.com" + '\n' +
                        "¡Ten en cuenta que validaremos el formato del mismo, asi que antes de enviarlo revisa bien tu correo!"
                        // Politica de privacidad (link)
                    break
                case CurrentStep.identify:
                    // Enviar numero de telefono a la db -> mail del usuario
                    if(chat.accountId === undefined || null || "") {
                        if(msg.trim() === "") {
                            answer = `Mensaje vacio. Por favor vuelva a intentarlo`
                            break
                        }
                        if(!this.validateMail(msg.trim())) {
                            answer = "El formato del correo electronico NO es valido, por favor vuelva a intentarlo."
                            break
                        }
                        const verifyUser = await this.jiraServ.verifyUser(msg.toLowerCase().trim())
                        if(!verifyUser.status) {
                            answer = "No se logro verificar su identidad, por favor vuelva intentarlo."
                            break
                        }
                        chat.accountId = verifyUser.body
                        chat.email = msg.trim()
                        answer = "Identidad verificada." + '\n'
                    }
                    const issuesGroups = await this.jiraServ.getIssuesGroups(chat.projectId)
                    if(!issuesGroups.status) {
                        answer += "Fallo al obtener los grupos, por favor vuelva a intentarlo"
                        break
                    }
                    if(typeof issuesGroups.body === 'string') {
                        // Matar la operación?
                        answer += "No se encontraron grupos, comuniquese con soporte tecnico."
                        break
                    }
                    const groupOptions = issuesGroups.body.map((issuesGroup: {id: string, name: string}, index) => {
                        this.groupOptionsSlot.push(parseInt(issuesGroup.id))
                        return `${index+1} . ${issuesGroup?.name}`
                    }).join('\n')
                    chat.currentStep = CurrentStep.selectGroup
                    answer += "Genial, ahora te comparto una lista de opciones, decime el número que se ajuste tu problema." 
                        + '\n' + groupOptions
                    break
                case CurrentStep.selectGroup:
                    if(isNaN(parseInt(msg))) {
                        answer = "El mensaje a enviar debe ser de valor numerico, por favor vuelva a intentarlo."
                        break
                    }
                    const groupId = this.groupOptionsSlot[(parseInt(msg)-1)]
                    if(!groupId) {
                        answer = "Opcion no encontrada, por favor vuelva a intentarlo."
                        break
                    }
                    const issuesRequests = await this.jiraServ.getIssuesRequests(chat.projectId, groupId)
                    if(!issuesRequests.status) {
                        answer = "Fallo al obtener las solicitudes, por favor vuelva a intentarlo."
                        break
                    }
                    if(typeof issuesRequests.body === 'string') {
                        // Matar la operación?
                        answer = "No se encontraron solicitudes, comuniquese con soporte tecnico."
                        break
                    }
                    chat.optionGroup = groupId
                    const requestOptions = issuesRequests.body.map((issuesRequest: {id: string, name: string, issueTypeId: string, groupId: number, canCreate: boolean}, index) => {
                        this.requestOptionsSlot.push(issuesRequest)
                        return `${index+1} . ${issuesRequest?.name}`
                    }).join('\n')
                    chat.currentStep = CurrentStep.selectRequest
                    answer = "Genial, ahora te comparto una lista de opciones, decime el número que se ajuste a la solicitud que quieras realizar." 
                        + '\n' + requestOptions
                    break
                case CurrentStep.selectRequest:
                    if(isNaN(parseInt(msg))) {
                        answer = "El mensaje a enviar debe ser de valor numerico, por favor vuelva a intentarlo."
                        break
                    }
                    const request = this.requestOptionsSlot[(parseInt(msg)-1)]
                    if(!request) {
                        answer = "Opcion no encontrada, por favor vuelva a intentarlo."
                        break
                    }
                    const requestId = parseInt(request.id)
                    const issuesRequestsFields = await this.jiraServ.getIssuesRequestsFields(chat.projectId, requestId)
                    if(!issuesRequestsFields.status) {
                        answer = "Fallo al obtener las solicitudes, por favor vuelva a intentar"
                        break
                    }
                    if(typeof issuesRequestsFields.body === 'string') {
                        // Matar la operación?
                        answer = "No se encontraron campos en esta solicitud, comuniquese con soporte tecnico."
                        break
                    }
                    chat.optionRequest = requestId
                    chat.issueTypeId = parseInt(request.issueTypeId)
                    this.requestFieldsSlot = issuesRequestsFields.body
                    chat.currentStep = CurrentStep.fillOptions
                    answer = "Genial, ahora te compartire una serie de campos que deberas completar.\n" 
                case CurrentStep.fillOptions:
                    let field: any
                    if(chat.getCountOptionsFields === -1) {
                        chat.countOptionsFields = chat.getCountOptionsFields + 1
                        field = this.requestFieldsSlot[chat.getCountOptionsFields]
                        chat.optionsFields = field?.validValues.split(',').map((value: string) => {return value.toLowerCase().trim()})
                        answer += `A continuación, escriba la respuesta para el siguiente campo -> ${field?.name}.${field?.validValues === "" ? "" : `\n Opciones: ${field?.validValues}`}`
                        break
                    }
                    field = this.requestFieldsSlot[chat.getCountOptionsFields]
                    if(msg.trim() === "") {
                        answer = 'Mensaje vacio. Por favor vuelva a intentarlo'
                        break
                    }
                    if(field?.validValues !== "" && !chat.getOptionsFields.includes(msg.toLowerCase().trim())){
                        answer = 'Opcion incorrecta, vuelve a intentarlo.'
                        break
                    }

                    chat.countOptionsFields = chat.getCountOptionsFields + 1
                    chat.optionsFields = []
                    this.validatedFields.push({
                            fieldId: field.fieldId,
                            value: field.fieldId !== "description"
                                ? msg.trim()
                                : {
                                    "type": "doc",
                                    "version": 1,
                                    "content": [{
                                      "type": "paragraph",
                                      "content": [{
                                        "text": msg,
                                        "type": "text"
                                      }]
                                    }]
                                }
                        })

                    if(!this.requestFieldsSlot[chat.getCountOptionsFields]){
                        chat.currentStep = CurrentStep.returnTkt
                    }
                    else {
                        field = this.requestFieldsSlot[chat.getCountOptionsFields]
                        chat.optionsFields = field?.validValues.split(',').map((value: string) => {return value.toLowerCase().trim()})
                        answer = `A continuación, escriba la respuesta para el siguiente campo -> ${field?.name}.${field?.validValues === "" ? "" : `\n Opciones: ${field?.validValues}`}`
                        break
                    }
                case CurrentStep.returnTkt:
                    this.tkt = {
                        accountId: chat.getAccountId,
                        projectId: chat._projectId,
                        issueTypeId: chat.getIssueTypeId,
                        requestId: chat.getOptionRequest,
                        fields: this.validatedFields
                    }
                    const response = await this.jiraServ.createTKT(this.tkt)
                    console.log(response)
                    break
            }

            const data = {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "text",
                "text": {"body": answer}
            };
            // console.log('DATAsending: ', data, this.configServ.get('WSP_PHONENUM'));

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
