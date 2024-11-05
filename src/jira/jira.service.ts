import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface requestOpt {
  id: string
  name: string
  issueTypeId: number
  groupId: number
  canCreate : boolean
}
interface fieldsOpt {
  fieldId: string
  name: string
  required: boolean
  validValues: []
}
export interface infoTKT {
  accountId: string
  projectId: number
  issueTypeId: number
  requestId: number
  fields: {fieldId : string, value: string}[]
}

@Injectable()
export class JiraService {

  constructor(private readonly configServ : ConfigService){}

  async verifyUser(userMail : string) : Promise<{status: boolean, body: string}> {
    try {
      const URL = `https://desarrolloyeca.atlassian.net/rest/api/3/user/search?query=${userMail}`
      const { data } = await axios.get(URL, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`julian.f.vega@gmail.com:${this.configServ.get('JIRA_TOKEN')}`).toString('base64')}`,
          'Accept': 'application/json'
        }})
      return data.length > 0 ? {status:true, body: data[0]?.accountId} : {status: false, body: 'USER NOT FOUND.'}
    } 
    catch (error) { return {status: false, body: 'USER NOT FOUND.'} }
  }

  async getIssuesGroups(projectId : number) : Promise<{status: Boolean, body: {}[] | string}> {
    try {
      const URL = `https://desarrolloyeca.atlassian.net/rest/servicedeskapi/servicedesk/${projectId}/requesttypegroup`
      const { data } = await axios.get(URL, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`julian.f.vega@gmail.com:${this.configServ.get('JIRA_TOKEN')}`).toString('base64')}`,
          'Accept': 'application/json'
        }})
      return data.values.length > 0 ? {status: true, body: data.values} : {status: true, body: 'GROUPSOPTIONS NOT FOUND'}
    } 
    catch (error) { return {status: false, body: 'GROUPSOPTIONS NOT FOUND'} }
  }

  async getIssuesRequests(projectId : number, groupId : number) : Promise<{status: Boolean, body: {}[] | string}> {
    try {
      const URL = `https://desarrolloyeca.atlassian.net/rest/servicedeskapi/servicedesk/${projectId}/requesttype`
      const { data } = await axios.get(URL, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`julian.f.vega@gmail.com:${this.configServ.get('JIRA_TOKEN')}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      })
      //devuelve siempre porque no se puede filtar request por group
      if(data.values.length > 0){
        let options : requestOpt[] = []
        data.values.map(elem => options.push({
            id: elem.id,
            name: elem.name,
            issueTypeId: elem.issueTypeId,
            groupId: parseInt(elem.groupIds[0]),
            canCreate: elem.canCreateRequest
        }))
        options = options.filter(elem => elem.groupId === groupId)
        return {status: true, body: options}
      }else {return {status: true, body: 'REQUESTOPTIONS NOT FOUND'}}
    } 
    catch (error) { return {status: false, body: 'REQUESTOPTIONS NOT FOUND'} }
  }

  async getIssuesRequestsFields(projectId : number, requestId : number) : Promise<{status: Boolean, body: {}[] | string}> {
    try {
      const URL = `https://desarrolloyeca.atlassian.net/rest/servicedeskapi/servicedesk/${projectId}/requesttype/${requestId}/field`
      const { data } = await axios.get(URL, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`julian.f.vega@gmail.com:${this.configServ.get('JIRA_TOKEN')}`).toString('base64')}`,
          'Accept': 'application/json'
        }})
        
      if(data.requestTypeFields?.length > 0){        
        let options : fieldsOpt[] = []
        data.requestTypeFields.map(elem => options.push({
          fieldId: elem.fieldId, 
          name: elem.name, 
          required: elem.required, 
          validValues: elem.validValues.map(elem => elem.label).join(', ')})
        )

        return {status: true, body: options}
      }else {return {status: true, body: 'FIELDSOPTIONS NOT FOUND'}}
    } 
    catch (error) { return {status: false, body: 'FIELDSOPTIONS NOT FOUND'}}
  }

  async createTKT(infoTkt : infoTKT){
    try {
      const URL = `https://desarrolloyeca.atlassian.net/rest/api/${infoTkt.projectId}/issue`

      const dynamicFields = infoTkt.fields.reduce((acc, elem) => {
        acc[elem.fieldId] = elem.value;
        return acc;
      }, {});

      const body = {
        "fields": {
          "reporter": {"id": infoTkt.accountId},
          "project": {"id": infoTkt.projectId},
          "issuetype": {"id": infoTkt.issueTypeId.toString()},
          "customfield_10010": infoTkt.requestId.toString(),
          // "summary": "TESTING with BACKEND",
          // "description": {
          //   "type": "doc",
          //   "version": 1,
          //   "content": [{
          //     "type": "paragraph",
          //     "content": [{
          //       "text": "I generated this TKT with method in bot",
          //       "type": "text"
          //     }]
          //   }]
          // },
          ...dynamicFields
        },
        "update": {},
      }

      const { data } = await axios.post(URL, body, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`julian.f.vega@gmail.com:${this.configServ.get('JIRA_TOKEN')}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }})
      
      return data
    } 
    catch (error) { return error }
  }
}
