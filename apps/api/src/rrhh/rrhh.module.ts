import { Module } from '@nestjs/common';
import { RRHHService } from './rrhh.service';
import { RRHHController } from './rrhh.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [FirebaseModule, MailModule],
    controllers: [RRHHController],
    providers: [RRHHService],
})
export class RRHHModule { }
