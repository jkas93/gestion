import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { RRHHModule } from './rrhh/rrhh.module';
import { ActivitiesModule } from './activities/activities.module';
import { ProgressLogsModule } from './progress-logs/progress-logs.module';
import { StatsModule } from './stats/stats.module';
import { FinanceModule } from './finance/finance.module';
import { MaterialsModule } from './materials/materials.module';
import { MaterialRequestsModule } from './material-requests/material-requests.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseModule,
    UsersModule,
    ProjectsModule,
    RRHHModule,
    ActivitiesModule,
    ProgressLogsModule,
    StatsModule,
    FinanceModule,
    MaterialsModule,
    MaterialRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
