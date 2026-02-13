import { Module } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
    imports: [FirebaseModule],
    controllers: [MaterialsController],
    providers: [MaterialsService],
    exports: [MaterialsService],
})
export class MaterialsModule { }
