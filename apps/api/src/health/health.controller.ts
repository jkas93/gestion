import { Controller, Get } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Controller('health')
export class HealthController {
    constructor(private readonly firebaseService: FirebaseService) { }

    @Get()
    getHealth() {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime)}s`,
            uptimeMs: Math.floor(uptime * 1000),
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
            },
            node: process.version,
            pid: process.pid,
        };
    }

    @Get('firebase')
    getFirebaseHealth() {
        const isInitialized = this.firebaseService.isInitialized();
        const initTime = this.firebaseService.getInitializationTime();

        return {
            status: isInitialized ? 'ok' : 'error',
            initialized: isInitialized,
            initializationTime: initTime ? `${initTime}ms` : 'N/A',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('detailed')
    getDetailedHealth() {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            system: {
                uptime: `${Math.floor(uptime)}s`,
                uptimeMs: Math.floor(uptime * 1000),
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                pid: process.pid,
            },
            memory: {
                rss: {
                    bytes: memoryUsage.rss,
                    mb: Math.round(memoryUsage.rss / 1024 / 1024),
                },
                heapTotal: {
                    bytes: memoryUsage.heapTotal,
                    mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                },
                heapUsed: {
                    bytes: memoryUsage.heapUsed,
                    mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                },
                external: {
                    bytes: memoryUsage.external,
                    mb: Math.round(memoryUsage.external / 1024 / 1024),
                },
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
            },
            firebase: {
                initialized: this.firebaseService.isInitialized(),
                initializationTime: this.firebaseService.getInitializationTime(),
            },
        };
    }
}
