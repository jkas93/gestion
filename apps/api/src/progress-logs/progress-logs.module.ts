import { Module } from '@nestjs/common';
import { ProgressLogsController } from './progress-logs.controller';
import { ProgressLogsService } from './progress-logs.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
    imports: [FirebaseModule],
    controllers: [ProgressLogsController],
    providers: [ProgressLogsService],
    exports: [ProgressLogsService],
})
export class ProgressLogsModule { }
