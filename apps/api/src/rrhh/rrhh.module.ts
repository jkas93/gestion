import { Module } from '@nestjs/common';
import { RRHHService } from './rrhh.service';
import { RRHHController } from './rrhh.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
    imports: [FirebaseModule],
    controllers: [RRHHController],
    providers: [RRHHService],
})
export class RRHHModule { }
