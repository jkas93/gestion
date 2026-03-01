
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../firebase/firebase.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@erp/shared';

describe('ProjectsService', () => {
    let service: ProjectsService;
    let firebaseService: FirebaseService;

    // Correctly structured mock for Firestore
    const mockFirestore = {
        collection: jest.fn(),
    };

    const mockFirebaseService = {
        getFirestore: jest.fn().mockReturnValue(mockFirestore),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectsService,
                { provide: FirebaseService, useValue: mockFirebaseService },
            ],
        }).compile();

        service = module.get<ProjectsService>(ProjectsService);
        firebaseService = module.get<FirebaseService>(FirebaseService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createMilestone', () => {
        it('should create a milestone successfully', async () => {
            const projectId = 'proj-1';
            const userId = 'user-1';
            const role = 'GERENTE'; // Has access

            // Mock findOne for permission check
            jest.spyOn(service, 'findOne').mockResolvedValue({ id: projectId } as any);

            const mockDocRef = { id: 'milestone-1', set: jest.fn().mockResolvedValue(undefined) };
            const mockCollection = { doc: jest.fn().mockReturnValue(mockDocRef) };

            // Setup chain: db.collection('projects').doc(id).collection('milestones').doc()
            mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockReturnValue(mockCollection),
                    get: jest.fn().mockResolvedValue({ // internal findOneRaw call inside findOne, if not cached
                        exists: true,
                        data: () => ({ id: projectId, coordinatorId: 'other' })
                    })
                })
            } as any);

            const result = await service.createMilestone(projectId, { title: 'M1' }, userId, role);

            expect(result).toBe('milestone-1');
            expect(service.findOne).toHaveBeenCalledWith(projectId, userId, role);
        });
    });

    describe('getProjectHealth', () => {
        it('should return health metrics', async () => {
            const projectId = 'proj-1';

            // Mock project data
            const mockProject = {
                id: projectId,
                name: 'Test Project',
                status: ProjectStatus.EN_PROGRESO,
                resources: {
                    budgetAllocated: 1000,
                    budgetSpent: 500
                },
                endDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(mockProject as any);

            // Mock tasks
            const mockTasks = [
                { data: () => ({ status: 'COMPLETED' }) },
                { data: () => ({ status: 'PENDING' }) }
            ];

            mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({ docs: mockTasks })
                    })
                })
            } as any);

            const result = await service.getProjectHealth(projectId, 'user-1', 'GERENTE');

            expect(result).toEqual({
                progressPercentage: 50,
                budgetHealth: 'GOOD', // 500/1000 = 50% < 80%
                scheduleHealth: 'ON_TIME',
                tasksCompleted: 1,
                tasksTotal: 2
            });
        });

        it('should return CRITICAL budget health', async () => {
            const projectId = 'proj-2';

            const mockProject = {
                id: projectId,
                name: 'Test Project 2',
                status: ProjectStatus.EN_PROGRESO,
                resources: {
                    budgetAllocated: 1000,
                    budgetSpent: 1200 // > 100%
                },
                endDate: new Date().toISOString()
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(mockProject as any);

            const mockTasks = [];
            (mockFirestore.collection() as any).doc().collection().get.mockResolvedValue({ docs: mockTasks });

            const result = await service.getProjectHealth(projectId, 'user-1', 'GERENTE');
            expect(result.budgetHealth).toBe('CRITICAL');
        });

        it('should return DELAYED schedule health', async () => {
            const projectId = 'proj-3';

            const mockProject = {
                id: projectId,
                name: 'Test Project 3',
                status: ProjectStatus.EN_PROGRESO,
                resources: undefined,
                endDate: new Date(Date.now() - 86400000).toISOString() // Yesterday (past due)
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(mockProject as any);

            const mockTasks = [
                { data: () => ({ status: 'IN_PROGRESS' }) }, // Not completed
                { data: () => ({ status: 'PENDING' }) }
            ];
            (mockFirestore.collection() as any).doc().collection().get.mockResolvedValue({ docs: mockTasks });

            const result = await service.getProjectHealth(projectId, 'user-1', 'GERENTE');
            expect(result.scheduleHealth).toBe('DELAYED');
            expect(result.progressPercentage).toBe(0);
        });
    });
});
