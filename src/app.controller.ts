import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('T&C')
  async getTYC(@Res() res : Response) {
    try {return res.render('t&c')} 
    catch (error) {return error}
  }

  @Get('POP')
  async getPOP(@Res() res : Response) {
    try {return res.render('pop')} 
    catch (error) {return error}
  }

  @Get('')
  async getHome(@Res() res : Response) {
    try {return res.render('index')} 
    catch (error) {return error}
  }

}

