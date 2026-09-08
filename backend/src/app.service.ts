import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return { status: 'ok', service: 'jogger-photo-hub-api', time: new Date().toISOString() };
  }
}
