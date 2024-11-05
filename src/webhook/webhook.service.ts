import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { sendMessage } from './defaultMessages/defaultMessage';
import { ChatService } from 'src/chat/chat.service';
import { Chat, CurrentStep } from 'src/chat/chat';
import { infoTKT, JiraService } from 'src/jira/jira.service';

function validateMail(mail: string) {
    const mailPattern = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
    return mailPattern.test(mail);
}

@Injectable()
export class WebhookService {

    private groupOptionsSlot: number[] = []
    private requestOptionsSlot: {id: string, name: string, issueTypeId: string, groupId: number, canCreate: boolean}[] = []
    private requestFieldsSlot: {fieldId: string, name: string, required: boolean, validValues: string}[] = []
    private tkt : infoTKT

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
                    if(chat.accountId === undefined || null) {
                        if(msg.trim() === "") {
                            answer = `Mensaje vacio. Por favor vuelva a intentarlo`
                            break
                        }
                        if(!validateMail(msg.trim())) {
                            answer = "El formato del correo electronico NO es valido, por favor vuelva a intentarlo."
                            break
                        }
                        const verifyUser = await this.jiraServ.verifyUser(msg.trim())
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
                        answer += "Fallo al obtener los grupos."
                        break
                    }
                    if(typeof issuesGroups.body === 'string') {
                        // Matar la operación?
                        answer += issuesGroups.body
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
                        answer = "El mensaje a enviar debe ser de valor numerico, por favor vuelva a intentar."
                        break
                    }
                    if(!this.groupOptionsSlot[(parseInt(msg)-1)]) {
                        answer = "Opcion no encontrada, por favor vuelva a intentarlo."
                        break
                    }
                    const issuesRequests = await this.jiraServ.getIssuesRequests(chat.projectId, this.groupOptionsSlot[(parseInt(msg)-1)])
                    if(!issuesRequests.status) {
                        answer = "Fallo al obtener las solicitudes, por favor vuelva a intentarlo."
                        break
                    }
                    if(typeof issuesRequests.body === 'string') {
                        // Matar la operación?
                        answer = issuesRequests.body
                        break
                    }
                    chat.optionGroup = this.groupOptionsSlot[(parseInt(msg)-1)]
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
                        answer = "El mensaje a enviar debe ser de valor numerico, por favor vuelva a intentar."
                        break
                    }
                    if(!this.requestOptionsSlot[(parseInt(msg)-1)]) {
                        answer = "Opcion no encontrada, por favor vuelva a intentarlo."
                        break
                    }
                    const issuesRequestsFields = await this.jiraServ.getIssuesRequestsFields(chat.projectId, parseInt(this.requestOptionsSlot[(parseInt(msg)-1)].id))
                    if(!issuesRequestsFields.status) {
                        answer = "Fallo al obtener las solicitudes, por favor vuelva a intentar"
                        break
                    }
                    if(typeof issuesRequestsFields.body === 'string') {
                        // Matar la operación?
                        answer = issuesRequestsFields.body
                        break
                    }
                    chat.optionRequest = parseInt(this.requestOptionsSlot[(parseInt(msg)-1)].id)
                    chat.issueTypeId = parseInt(this.requestOptionsSlot[(parseInt(msg)-1)].issueTypeId)
                    const requestFieldOptions = issuesRequestsFields.body.map((issuesRequestField: {fieldId: string, name: string, required: boolean, validValues: string}) => {
                        this.requestFieldsSlot.push(issuesRequestField)
                        return `+ Campo: ${issuesRequestField?.name}` +'\n'+
                            `  Requerido: ${!issuesRequestField.required ? 'NO' : 'SI'}` +
                            `${issuesRequestField.validValues === "" ? "" : "\n  Valores: " + issuesRequestField.validValues}`  
                    }).join('\n')
                    chat.currentStep = CurrentStep.fillOptions
                    answer = "Genial, ahora te comparto una serie de campos de deberas completar:." 
                        + '\n' + requestFieldOptions +'\n'+
                        'Ejemplo:\ncampo: valor, campo_siguiente: valor\n ... Asi sucesivamente hasta completar los campos. Tener en cuenta que aquellos campos que no son requeridos no es necesario que los completen, por otro lado, aquellos campos con valores preimpuestos deberan ser completados con los mismos y no con otros.'
                    break
                case CurrentStep.fillOptions:
                    // CAMPO POR CAMPO - Ignorar 'requerido'
                    if(msg.trim() === "") {
                        answer = `Mensaje vacio. Por favor vuelva a intentarlo`
                        break
                    }
                    let validated = true
                    const validatedFields: {fieldId: string, value: string}[] = []
                    const fields = msg.split(',').map((field) => {
                        let arr = field.split(':')
                        return { key: arr[0].toLowerCase().trim(), value: arr[1].toLowerCase().trim() }
                    })
                    for (let i = 0; i < fields.length; i++) {
                        const foundField = this.requestFieldsSlot.find(rfs => {
                            if(rfs.required && rfs.name.toLowerCase() !== fields[i].key) {
                                answer = `El campo ${rfs.name} es requerido!`
                                return null
                            }
                            if(rfs.name.toLowerCase() !== fields[i].key) {
                                answer = `El campo ${fields[i].key} no se ha encontrado!`
                                return null
                            }
                            return rfs
                        })
                        if(typeof foundField === null) {
                            validated = false
                            break
                        }
                        if(foundField.validValues.trim() !== "") {
                            const includeValue = foundField.validValues.split(',').find(value => value.toLowerCase().trim() === fields[i].value)
                            if(includeValue === undefined || null) {
                                validated = false
                                answer = `El valor del campo ${foundField.name} no es valido.`
                                break
                            }
                        }
                        validatedFields.push({fieldId: foundField.fieldId, value: fields[i].value})
                    }
                    if(!validated) {
                        break
                    }
                    this.tkt = {
                        accountId: chat.getAccountId,
                        projectId: chat._projectId,
                        issueTypeId: chat.getIssueTypeId,
                        requestId: chat.getOptionRequest,
                        fields: validatedFields
                    }
                    chat.currentStep = CurrentStep.returnTkt
                case CurrentStep.returnTkt:
                    const response = await this.jiraServ.createTKT(this.tkt)
                    console.log(response)
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

