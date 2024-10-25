import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { JiraService } from './jira.service';

@Controller('jira')
export class JiraController {

    constructor(private readonly jiraServ : JiraService ){}

    @Get('userdata')
    async getUserData(@Body() data, @Res() res : Response){
        try {
            const userData = await this.jiraServ.verifyUser(data.email)            
            return res.json(userData)
        } 
        catch (error) { return error}
    }

    @Get('groupdata')
    async getGroupData(@Body() data, @Res() res : Response){
        try {
            const groupData = await this.jiraServ.getIssuesGroups(data.project)
            return res.json(groupData)
        } 
        catch (error) { return error}
    }

    @Get('requestsdata')
    async getRequestsData(@Body() data, @Res() res : Response){
        try {
            const requestData = await this.jiraServ.getIssuesRequests(data.project, data.group)
            return res.json(requestData)
        } 
        catch (error) { return error}
    }

    @Get('requestfieldsdata')
    async getRequestFieldsData(@Body() data, @Res() res : Response){
        try {
            const requestFieldsData = await this.jiraServ.getIssuesRequestsFields(data.project, data.request)
            return res.json(requestFieldsData)
        } 
        catch (error) { return error}
    }

    @Post('createtkt')
    async createTKT(@Body() data, @Res() res : Response){
        try {
            const createTKT = await this.jiraServ.createTKT(data)
            return res.json(createTKT)
        } catch (error) { return error }
    }
}
