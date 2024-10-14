import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('T&C')
  @Render('t&c')
  async getTYC() {
    try {return {message: 'Showing T&C'}} 
    catch (error) {return error}
  }

  @Get('POP')
  @Render('pop')
  async getPOP() {
    try {return {message: 'Showing POP'}} 
    catch (error) {return error}
  }

  @Get()
  async getHello() {
    try {return this.appService.getHello()} 
    catch (error) { return error }    
  }
}

