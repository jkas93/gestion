import { Module } from '@nestjs/common';
import { MaterialRequestsService } from './material-requests.service';
import { MaterialRequestsController } from './material-requests.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
    imports: [FirebaseModule],
    controllers: [MaterialRequestsController],
    providers: [MaterialRequestsService],
    exports: [MaterialRequestsService],
})
export class MaterialRequestsModule { }
