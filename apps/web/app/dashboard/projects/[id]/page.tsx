"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Project, UserRole, ProjectTask, TaskType, ProgressLog, Purchase, ProjectMilestone } from "@erp/shared";
import { auth, storage } from "@/lib/firebase/clientApp";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/useToast";
import { Plus, Check, Clock, AlertTriangle, Trash2, Edit, ClipboardCheck, Activity, Upload, X, Calendar, DollarSign, BarChart3 } from "lucide-react";
import { HealthDonutChart, MilestoneMarker, ProjectHealthIndicator, StatusBadge } from "@/components/ui/start-project-components";

export default function ProjectGanttPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using use() hook or useEffect. Next.js 15+ recommends unwrapping.
    // For simplicity, let's use the hook use() if available, or just await it effectively via useEffect if type is Promise.
    // Since this is a client component, `(await params).id` works inside useEffect but simpler to use React.use() if enabled or just treat it as `React.use(params)`.
    // However, to be safe across Next.js versions, let's just use `use(params)` inside the component.
    const resolvedParams = use(params);
    const projectId = resolvedParams.id;

    const { user, role, loading } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
    const [health, setHealth] = useState<{
        progressPercentage: number;
        budgetHealth: 'GOOD' | 'WARNING' | 'CRITICAL';
        scheduleHealth: 'ON_TIME' | 'AT_RISK' | 'DELAYED';
        tasksCompleted: number;
        tasksTotal: number;
    } | null>(null);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Modal & Form State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTask, setNewTask] = useState<Partial<ProjectTask>>({
        title: '',
        type: TaskType.ITEM,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        order: 0,
        parentId: null
    });
    const [editingTask, setEditingTask] = useState<string | null>(null);

    // Timeline Offset State
    const [chartStartOffset, setChartStartOffset] = useState<string>(new Date().toISOString().split('T')[0] || '');

    // S-Curve Visibility
    const [showSCurve, setShowSCurve] = useState(false);

    const dayWidth = 40; // Each day will be 40px wide for clarity

    // Progress Logging State
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<ProjectTask | null>(null);
    const [newProgressLog, setNewProgressLog] = useState<any>({
        progressPercentage: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [selectedTaskForGallery, setSelectedTaskForGallery] = useState<ProjectTask | null>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // File Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Interaction State for Drag & Resize
    const [interaction, setInteraction] = useState<{
        taskId: string;
        type: 'MOVE' | 'RESIZE_START' | 'RESIZE_END';
        initialX: number;
        initialStart: string;
        initialEnd: string;
    } | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    const updateTaskDates = async (taskId: string, start: string, end: string) => {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/projects/${projectId}/tasks/${taskId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ startDate: start, endDate: end }),
        });
        if (res.ok) fetchProjectData();
    };

    const handleInteractionStart = (e: React.MouseEvent, task: ProjectTask, type: 'MOVE' | 'RESIZE_START' | 'RESIZE_END') => {
        e.stopPropagation();
        setInteraction({
            taskId: task.id,
            type,
            initialX: e.clientX,
            initialStart: task.startDate,
            initialEnd: task.endDate
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!interaction) return;

            const deltaX = e.clientX - interaction.initialX;
            const deltaDays = Math.round(deltaX / 40); // 40 is dayWidth

            if (deltaDays === 0) return;

            const task = tasks.find(t => t.id === interaction.taskId);
            if (!task) return;

            let newStart = interaction.initialStart;
            let newEnd = interaction.initialEnd;

            const dStart = new Date(interaction.initialStart);
            const dEnd = new Date(interaction.initialEnd);

            if (interaction.type === 'MOVE') {
                dStart.setDate(dStart.getDate() + deltaDays);
                dEnd.setDate(dEnd.getDate() + deltaDays);
            } else if (interaction.type === 'RESIZE_START') {
                dStart.setDate(dStart.getDate() + deltaDays);
                if (dStart >= dEnd) dStart.setDate(dEnd.getDate() - 1);
            } else if (interaction.type === 'RESIZE_END') {
                dEnd.setDate(dEnd.getDate() + deltaDays);
                if (dEnd <= dStart) dEnd.setDate(dStart.getDate() + 1);
            }

            newStart = dStart.toISOString().split('T')[0] as string;
            newEnd = dEnd.toISOString().split('T')[0] as string;

            // Optimistic Update
            setTasks(prev => prev.map(t => t.id === interaction.taskId ? { ...t, startDate: newStart, endDate: newEnd } : t));
        };

        const handleMouseUp = () => {
            if (interaction) {
                const finalTask = tasks.find(t => t.id === interaction.taskId);
                if (finalTask) {
                    updateTaskDates(finalTask.id, finalTask.startDate, finalTask.endDate);
                }
                setInteraction(null);
            }
        };

        if (interaction) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interaction, tasks]);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
        if (role === UserRole.RRHH) {
            router.push("/dashboard/rrhh");
            return;
        }
        if (user && projectId) {
            fetchProjectData();
            fetchCatalog();
            fetchProgressLogs();
            fetchMilestones();
            fetchProjectHealth();
        }
    }, [user, loading, role, projectId, router]);

    const fetchProgressLogs = async () => {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/projects/${projectId}/progress-logs`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            setProgressLogs(data);
        }
    };

    const fetchMilestones = async () => {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/projects/${projectId}/milestones`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
            setMilestones(await res.json());
        }
    };

    const fetchProjectHealth = async () => {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/projects/${projectId}/health`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
            setHealth(await res.json());
        }
    };

    const handleSaveProgress = async () => {
        if (!selectedTaskForProgress) return;

        // Validation: Evidence required for progress > 0
        if (newProgressLog.progressPercentage > 0 && !imageFile) {
            showToast("Para reportar avance, es obligatorio adjuntar una foto como evidencia.", "warning");
            return;
        }

        try {
            const idToken = await auth.currentUser?.getIdToken();
            let photoUrls: string[] = [];

            if (imageFile) {
                setIsUploading(true);
                const storageRef = ref(storage, `progress_logs/${projectId}/${selectedTaskForProgress.id}/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                const downloadURL = await getDownloadURL(storageRef);
                photoUrls.push(downloadURL);
                setIsUploading(false);
            }

            const res = await fetch(`${API_URL}/projects/${projectId}/progress-logs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    ...newProgressLog,
                    taskId: selectedTaskForProgress.id,
                    projectId,
                    photoUrls
                }),
            });

            if (res.ok) {
                setIsProgressModalOpen(false);
                setImageFile(null); // Reset file
                fetchProjectData(); // Refresh tasks
                fetchProgressLogs(); // Refresh logs for S-Curve
                showToast("Avance registrado correctamente", "success");
            } else {
                showToast("Error al guardar el reporte", "error");
            }
        } catch (error) {
            console.error("Error saving progress:", error);
            setIsUploading(false);
            showToast("Error al subir la evidencia o guardar", "error");
        }
    };

    const fetchCatalog = async () => {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/activities`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) setCatalog(await res.json());
    };

    const fetchProjectData = async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const headers = { Authorization: `Bearer ${idToken}` };

            // Fetch Project Details
            const projectRes = await fetch(`${API_URL}/projects/${projectId}`, { headers });
            if (projectRes.ok) {
                const projectData = await projectRes.json();
                setProject(projectData);
            }

            // Fetch Tasks
            const tasksRes = await fetch(`${API_URL}/projects/${projectId}/tasks`, { headers });
            if (tasksRes.ok) {
                const tasksData: ProjectTask[] = await tasksRes.json();
                setTasks(tasksData);
                // Set order based on existing tasks count if new
                setNewTask(prev => ({ ...prev, order: tasksData.length + 1 }));
            }

            // Fetch Purchases
            const purchasesRes = await fetch(`${API_URL}/finance/purchases/project/${projectId}`, { headers });
            if (purchasesRes.ok) {
                setPurchases(await purchasesRes.json());
            }
        } catch (error) {
            console.error("Error fetching project data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const idToken = await auth.currentUser?.getIdToken();
        const method = editingTask ? "PATCH" : "POST";
        const url = editingTask
            ? `${API_URL}/projects/${projectId}/tasks/${editingTask}`
            : `${API_URL}/projects/${projectId}/tasks`;

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(newTask),
        });

        if (res.ok) {
            setIsTaskModalOpen(false);
            setEditingTask(null);
            setNewTask({
                title: '',
                type: TaskType.ITEM,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: 0,
                order: tasks.length + 1,
                parentId: null
            });
            fetchProjectData();
        }
    };

    const handleInstantAddSubtask = async (parentTask: ProjectTask) => {
        const idToken = await auth.currentUser?.getIdToken();
        const suggestedTitle = "Nueva Actividad";

        // Suggest a 7-day duration starting from the parent's start date
        const startDate = parentTask.startDate;
        const dEnd = new Date(startDate);
        dEnd.setDate(dEnd.getDate() + 7);
        const endDate = dEnd.toISOString().split('T')[0];

        const payload = {
            title: suggestedTitle,
            type: TaskType.ITEM,
            startDate,
            endDate,
            progress: 0,
            order: tasks.filter(t => t.parentId === parentTask.id).length + 1,
            parentId: parentTask.id
        };

        const res = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            fetchProjectData();
            // Optional: Automatically open edit modal for the newly created task
            // but let's stick to "just creates the row" as requested.
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;
        const idToken = await auth.currentUser?.getIdToken();
        await fetch(`${API_URL}/projects/${projectId}/tasks/${taskId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${idToken}` },
        });
        fetchProjectData();
    };

    const openEditModal = (task: ProjectTask) => {
        setNewTask({
            title: task.title,
            type: task.type,
            startDate: task.startDate,
            endDate: task.endDate,
            progress: task.progress,
            order: task.order,
            parentId: task.parentId
        });
        setEditingTask(task.id);
        setIsTaskModalOpen(true);
    };

    // Calculate chart boundaries - FIXED to start from user-selected offset
    const getChartBoundaries = () => {
        const fallbackDate = new Date().toISOString().split('T')[0] || '';
        const start = new Date(chartStartOffset || fallbackDate);
        start.setHours(0, 0, 0, 0);

        // We show a fixed window of 120 days starting from the offset
        const totalDays = 120;
        const end = new Date(start);
        end.setDate(start.getDate() + totalDays);

        return { start, end, totalDays };
    };

    const { start: chartStart, totalDays } = getChartBoundaries();

    const getTaskStyle = (task: ProjectTask) => {
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);

        // Calculate days from chart start (absolute px)
        const offset = (start.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

        return {
            left: `${offset * 40}px`,
            width: `${duration * 40}px`
        };
    };

    const generateTimelineHeader = () => {
        const months: { month: string, year: number, start: number, days: number }[] = [];
        const days: Date[] = [];
        const current = new Date(chartStart || new Date());

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(current);
            days.push(date);

            const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
            const year = date.getFullYear();

            const lastMonth = months.length > 0 ? months[months.length - 1] : null;
            if (!lastMonth || lastMonth.month !== monthName || lastMonth.year !== year) {
                months.push({ month: monthName, year, start: i, days: 1 });
            } else {
                lastMonth.days++;
            }
            current.setDate(current.getDate() + 1);
        }
        return { months, days };
    };

    const getHierarchicalTasks = (taskList: ProjectTask[], parentId: string | null = null, depth = 0): (ProjectTask & { depth: number })[] => {
        return taskList
            .filter(t => t.parentId === parentId)
            .sort((a, b) => a.order - b.order)
            .reduce((acc, task) => {
                return [...acc, { ...task, depth }, ...getHierarchicalTasks(taskList, task.id, depth + 1)];
            }, [] as (ProjectTask & { depth: number })[]);
    };

    const { months, days } = generateTimelineHeader();

    // TODAY marker calculation relative to the flexible start
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLeftPosition = (today.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24) * 40;

    const hierarchicalTasks = getHierarchicalTasks(tasks);

    // S-Curve Data Calculation
    const generateSCurveData = () => {
        const leafTasks = tasks.filter(t => t.type !== TaskType.AREA);
        if (leafTasks.length === 0) return [];

        return days.map((day, index) => {
            let totalPlanned = 0;
            let totalReal = 0;
            const dTime = day.getTime();
            const dStr: string = day.toISOString().split('T')[0] || '';

            leafTasks.forEach(task => {
                // Planned calculation
                const sTime = new Date(task.startDate).getTime();
                const eTime = new Date(task.endDate).getTime();
                const duration = Math.max(1, (eTime - sTime) / (1000 * 60 * 60 * 24) + 1);

                if (dTime < sTime) totalPlanned += 0;
                else if (dTime >= eTime) totalPlanned += 100;
                else {
                    const elapsed = (dTime - sTime) / (1000 * 60 * 60 * 24) + 1;
                    totalPlanned += (elapsed / duration) * 100;
                }

                // Real Calculation: Find the LATEST progress log for THIS task on or BEFORE this day
                const taskLogs = progressLogs
                    .filter(log => log.taskId === task.id && log.date <= dStr)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (taskLogs.length > 0 && taskLogs[0]) {
                    totalReal += taskLogs[0].progressPercentage;
                } else {
                    // If no logs, assume 0 for the start, but if it's currently marked as completed in state, 
                    // should we trust the task.progress? Usually S-Curve real is better built ONLY from logs.
                    totalReal += 0;
                }
            });

            return {
                day: dStr,
                planned: totalPlanned / leafTasks.length,
                real: totalReal / leafTasks.length,
                x: index * dayWidth
            };
        });
    };

    const sCurveData = generateSCurveData();

    const getTaskCost = (taskId: string) => {
        return purchases
            .filter(p => p.taskId === taskId)
            .reduce((sum, p) => sum + Number(p.amount), 0);
    };

    if (loading || loadingData) return (
        <div className="min-h-screen flex items-center justify-center bg-black animate-mesh">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-primary font-bold tracking-widest text-xs uppercase">Cargando Cronograma...</p>
            </div>
        </div>
    );

    if (!project) return <div className="text-white">Proyecto no encontrado</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex justify-between items-end border-b border-white/10 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <StatusBadge status={project.status} />
                    </div>
                    <h1 className="text-4xl title-gradient mb-2">{project.name}</h1>
                    <p className="text-gray-400 font-medium max-w-2xl">{project.description}</p>
                </div>

                <div className="flex bg-white/5 border border-white/5 p-4 rounded-xl items-center gap-8 backdrop-blur-sm">
                    {health && (
                        <>
                            <div className="flex items-center gap-4">
                                <HealthDonutChart percentage={health.progressPercentage} size={60} showLabel={false} />
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-white">{health.progressPercentage}%</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Avance Global</span>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div className="space-y-2">
                                <ProjectHealthIndicator
                                    type="SCHEDULE"
                                    status={health.scheduleHealth}
                                    value={health.scheduleHealth === 'ON_TIME' ? 'A tiempo' : health.scheduleHealth === 'AT_RISK' ? 'En riesgo' : 'Retrasado'}
                                />
                                {/* Budget Indicator placeholder - would need actual budget data passed or calculated */}
                            </div>
                        </>
                    )}
                </div>

                {(role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.COORDINADOR || role === UserRole.SUPERVISOR) && (
                    <button
                        onClick={() => {
                            setEditingTask(null);
                            setNewTask({
                                title: '',
                                type: TaskType.ITEM,
                                startDate: new Date().toISOString().split('T')[0],
                                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                progress: 0,
                                order: tasks.length + 1,
                                parentId: null
                            });
                            setIsTaskModalOpen(true);
                        }}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Tarea
                    </button>
                )}
            </header>

            {/* Gantt Area */}
            <div className="glass rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl flex flex-col h-[75vh]">
                <div className="p-4 bg-white/5 border-b border-white/5 flex flex-wrap gap-4 justify-between items-center z-20 relative">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cronograma de Ejecución</span>
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Inicio regleta:</span>
                            <input
                                type="date"
                                className="bg-transparent text-[11px] text-primary font-bold outline-none cursor-pointer"
                                value={chartStartOffset}
                                onChange={(e) => setChartStartOffset(e.target.value)}
                            />
                            <button
                                onClick={() => setChartStartOffset(new Date().toISOString().split('T')[0] || '')}
                                className="text-[9px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-gray-400 transition-colors"
                            >
                                Hoy
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-4 text-xs font-mono text-gray-500">
                        <button
                            onClick={() => setShowSCurve(!showSCurve)}
                            className={`px-3 py-1 rounded-full border transition-all flex items-center gap-2 ${showSCurve ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-500'}`}
                        >
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                            Curva S Planificada
                        </button>
                        <div className="flex flex-col text-right">
                            <span>Desde: {chartStart.toLocaleDateString()}</span>
                            <span>Días totales: {totalDays}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto relative custom-scrollbar">
                    <div className="relative" style={{ width: `${320 + days.length * dayWidth}px` }}>
                        {/* Header Row */}
                        <div className="flex bg-gray-900/90 backdrop-blur-sm sticky top-0 z-30 border-b border-white/10">
                            <div className="w-80 p-4 sticky left-0 bg-gray-900 border-r border-white/10 font-bold text-[10px] uppercase tracking-wider text-gray-400 z-40 flex items-end">
                                Actividad / Descripción
                            </div>
                            <div className="flex-1 border-white/10">
                                {/* Months Header */}
                                <div className="flex border-b border-white/5">
                                    {months.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className="border-r border-white/5 bg-white/5 py-1 px-2 text-[9px] font-bold uppercase tracking-widest text-primary truncate"
                                            style={{ width: `${m.days * dayWidth}px` }}
                                        >
                                            {m.month} {m.year}
                                        </div>
                                    ))}
                                </div>
                                {/* Days Header */}
                                <div className="flex h-8">
                                    {days.map((d, idx) => {
                                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex-shrink-0 border-r border-white/5 flex flex-col items-center justify-center text-[9px] font-mono ${isWeekend ? 'bg-white/5 text-gray-500' : 'text-gray-400'}`}
                                                style={{ width: `${dayWidth}px` }}
                                            >
                                                <span>{d.toLocaleDateString('es-ES', { weekday: 'narrow' })}</span>
                                                <span className="font-bold">{d.getDate()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Task Rows */}
                        <div className="relative min-h-[400px]">
                            {/* Vertical Grid Lines & Milestones */}
                            <div className="absolute inset-0 left-80 pointer-events-none z-10">
                                <div className="flex h-full relative">
                                    {days.map((_, i) => (
                                        <div
                                            key={i}
                                            className="border-r border-white/5 h-full flex-shrink-0"
                                            style={{ width: `${dayWidth}px` }}
                                        ></div>
                                    ))}

                                    {/* Milestones Markers */}
                                    {milestones.map(milestone => {
                                        const milestoneDate = new Date(milestone.startDate);
                                        const offsetDays = (milestoneDate.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24);

                                        // Only render if within view
                                        if (offsetDays < 0 || offsetDays > totalDays) return null;

                                        return (
                                            <div
                                                key={milestone.id}
                                                className="absolute top-0 bottom-0 z-20 pointer-events-auto"
                                                style={{ left: `${offsetDays * dayWidth}px` }}
                                            >
                                                <MilestoneMarker
                                                    date={milestone.startDate}
                                                    label={milestone.name}
                                                    isCompleted={milestone.status === 'COMPLETED'}
                                                    positionLeft={0} // Using absolute positioning of parent instead
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {hierarchicalTasks.map((task) => {
                                const style = getTaskStyle(task);
                                const isArea = task.type === TaskType.AREA;
                                return (
                                    <div key={task.id} className="flex border-b border-white/5 hover:bg-white/5 transition-colors group relative min-h-[44px]">
                                        {/* Sticky Task Info */}
                                        <div className="w-80 p-3 sticky left-0 bg-black/60 backdrop-blur-sm border-r border-white/10 z-20 flex justify-between items-center group-hover:bg-gray-900 transition-colors">
                                            <div className="min-w-0 pr-2" style={{ paddingLeft: `${task.depth * 1}rem` }}>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {task.depth > 0 && <span className="text-gray-700 font-mono text-[10px]">└</span>}
                                                    <span className={`font-bold text-xs truncate ${isArea ? 'text-blue-400 uppercase tracking-tighter' : 'text-gray-200'}`}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] font-mono">
                                                    <span className="text-gray-500 opacity-60">{task.progress}%</span>
                                                    <span className="text-gray-700 opacity-60">|</span>
                                                    {!isArea && getTaskCost(task.id) > 0 && (
                                                        <>
                                                            <span className="text-green-500 font-bold bg-green-500/10 px-1 rounded animate-in fade-in duration-500">
                                                                S/ {getTaskCost(task.id).toLocaleString()}
                                                            </span>
                                                            <span className="text-gray-700 opacity-60">|</span>
                                                        </>
                                                    )}
                                                    <span className="text-gray-500 opacity-60">{Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}d</span>
                                                </div>
                                            </div>
                                            {(role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.COORDINADOR || role === UserRole.SUPERVISOR) && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTaskForGallery(task);
                                                            setIsGalleryOpen(true);
                                                        }}
                                                        className="p-1.5 hover:bg-blue-500/20 rounded text-gray-500 hover:text-blue-400"
                                                        title="Ver Historial de Avances y Evidencias"
                                                    >
                                                        <Activity className="w-3 h-3" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleInstantAddSubtask(task)}
                                                        className="p-1.5 hover:bg-blue-500/20 rounded text-gray-500 hover:text-blue-400"
                                                        title="Agregar Sub-actividad (Instantáneo)"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>

                                                    {role === UserRole.SUPERVISOR && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTaskForProgress(task);
                                                                setNewProgressLog({
                                                                    progressPercentage: task.progress || 0,
                                                                    date: new Date().toISOString().split('T')[0],
                                                                    notes: ''
                                                                });
                                                                setIsProgressModalOpen(true);
                                                            }}
                                                            className="p-1.5 hover:bg-green-500/20 rounded text-gray-500 hover:text-green-400"
                                                            title="Registrar Avance Diario"
                                                        >
                                                            <ClipboardCheck className="w-3 h-3" />
                                                        </button>
                                                    )}

                                                    <button onClick={() => openEditModal(task)} className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white" title="Editar">
                                                        <Edit className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400" title="Eliminar">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chart Bar Area */}
                                        <div
                                            className="flex-1 relative h-[44px] flex items-center z-10 overflow-visible select-none"
                                            style={{ cursor: interaction?.taskId === task.id ? (interaction.type === 'MOVE' ? 'grabbing' : 'col-resize') : 'default' }}
                                        >
                                            {/* Today Marker Line (Only once, conceptually part of the grid) */}
                                            {todayLeftPosition >= 0 && todayLeftPosition <= days.length * dayWidth && (
                                                <div className="absolute top-0 bottom-0 w-px bg-red-500/50 z-0 pointer-events-none" style={{ left: `${todayLeftPosition}px` }}>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg shadow-red-500/20">HOY</div>
                                                </div>
                                            )}

                                            <div
                                                className={`rounded-full shadow-sm border overflow-hidden flex items-center px-1 absolute group/bar transition-all
                                                    ${isArea
                                                        ? 'bg-blue-500/10 border-blue-500/20 h-2 mt-2'
                                                        : task.progress === 100
                                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400/50 h-5 shadow-emerald-500/20'
                                                            : 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-400/50 h-5 shadow-amber-500/20'}`}
                                                style={{
                                                    left: style.left,
                                                    width: style.width,
                                                    minWidth: '20px',
                                                    transition: interaction?.taskId === task.id ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    cursor: (role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.COORDINADOR || role === UserRole.SUPERVISOR) ? 'grab' : 'default'
                                                }}
                                                onMouseDown={(e) => (role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.COORDINADOR || role === UserRole.SUPERVISOR) && handleInteractionStart(e, task, 'MOVE')}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Resize Handles */}
                                                {(role === UserRole.GERENTE || role === UserRole.PMO || role === UserRole.COORDINADOR || role === UserRole.SUPERVISOR) && !isArea && (
                                                    <>
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-20 rounded-l-full"
                                                            onMouseDown={(e) => handleInteractionStart(e, task, 'RESIZE_START')}
                                                        ></div>
                                                        <div
                                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-20 rounded-r-full"
                                                            onMouseDown={(e) => handleInteractionStart(e, task, 'RESIZE_END')}
                                                        ></div>
                                                    </>
                                                )}

                                                {/* Progress Fill */}
                                                {!isArea && (
                                                    <div className="absolute left-0 top-0 bottom-0 bg-white/30 pointer-events-none" style={{ width: `${task.progress}%` }}></div>
                                                )}

                                                {/* Label inside bar if wide enough */}
                                                {parseInt(style.width) > 40 && !isArea && (
                                                    <span className="text-[8px] font-black text-white/90 uppercase tracking-tighter truncate pointer-events-none ml-1 drop-shadow-md">
                                                        {task.progress}%
                                                    </span>
                                                )}

                                                {/* Tooltip on Hover */}
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity z-[100] pointer-events-none shadow-xl flex flex-col items-center">
                                                    <div className="font-bold text-white mb-0.5">{task.title}</div>
                                                    <div className="flex items-center gap-2 text-gray-400 font-mono text-[9px]">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.startDate).toLocaleDateString()} → {new Date(task.endDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {tasks.length === 0 && (
                        <div className="py-20 text-center text-gray-500 text-sm">
                            <p className="mb-2">Aún no hay actividades planificadas.</p>
                            <p className="text-xs text-gray-600">Utiliza el botón "Nueva Tarea" para comenzar.</p>
                        </div>
                    )}
                </div>
                {/* Footer Legend */}
                <div className="p-3 bg-black/40 border-t border-white/5 flex gap-6 text-[10px] uppercase font-bold text-gray-500 justify-end">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary/60"></div> En Progreso</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Completado</div>
                </div>
            </div>

            {/* S-Curve Dedicated Section */}
            <div className="glass rounded-[2rem] p-8 border border-white/5 shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Curva S de Ejecución</h3>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-blue-500 rounded-full opacity-50"></div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Planificado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ejecutado (Real)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg flex flex-col items-center">
                            <span className="text-[9px] text-primary font-bold uppercase">Meta Plan:</span>
                            <span className="text-lg font-mono font-bold text-white">
                                {Math.round(sCurveData[Math.max(0, Math.round(todayLeftPosition / dayWidth))]?.planned || 0)}%
                            </span>
                        </div>
                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg flex flex-col items-center shadow-lg shadow-green-500/5">
                            <span className="text-[9px] text-green-400 font-bold uppercase">Avance Real:</span>
                            <span className="text-lg font-mono font-bold text-white">
                                {Math.round(sCurveData[Math.max(0, Math.round(todayLeftPosition / dayWidth))]?.real || 0)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-64 w-full relative group">
                    {/* Y-Axis Labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-[9px] font-mono text-gray-600 border-r border-white/5 pr-2 pointer-events-none">
                        <span>100%</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>25%</span>
                        <span>0%</span>
                    </div>

                    <div className="absolute inset-0 ml-10 overflow-hidden">
                        <svg className="w-full h-full" overflow="visible" preserveAspectRatio="none" viewBox={`0 0 ${days.length * dayWidth} 200`}>
                            <defs>
                                <linearGradient id="scurveFillPlanned" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.05" />
                                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="scurveFillReal" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Horizontal grid lines */}
                            {[0, 50, 100, 150, 200].map(val => (
                                <line key={val} x1="0" y1={val} x2={days.length * dayWidth} y2={val} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                            ))}

                            {/* Today Line */}
                            {todayLeftPosition >= 0 && (
                                <line x1={todayLeftPosition} y1="0" x2={todayLeftPosition} y2="200" stroke="#ef4444" strokeOpacity="0.3" strokeDasharray="4 2" />
                            )}

                            {/* Planned S-Curve Path */}
                            <path
                                d={`M ${sCurveData.map(d => `${d.x},${200 - (d.planned * 2)}`).join(' L ')} L ${sCurveData[sCurveData.length - 1]?.x},200 L 0,200 Z`}
                                fill="url(#scurveFillPlanned)"
                                className="transition-all duration-700"
                            />
                            <path
                                d={`M ${sCurveData.map(d => `${d.x},${200 - (d.planned * 2)}`).join(' L ')}`}
                                fill="none"
                                stroke="#D4AF37"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                strokeOpacity="0.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-700"
                            />

                            {/* Real S-Curve Path */}
                            <path
                                d={`M ${sCurveData.map(d => `${d.x},${200 - (d.real * 2)}`).join(' L ')} L ${sCurveData[sCurveData.length - 1]?.x},200 L 0,200 Z`}
                                fill="url(#scurveFillReal)"
                                className="transition-all duration-700"
                            />
                            <path
                                d={`M ${sCurveData.map(d => `${d.x},${200 - (d.real * 2)}`).join(' L ')}`}
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all duration-700"
                            />

                            {/* Interaction point (Real) */}
                            {todayLeftPosition >= 0 && (
                                <g>
                                    <circle
                                        cx={todayLeftPosition}
                                        cy={200 - (sCurveData[Math.round(todayLeftPosition / dayWidth)]?.real || 0) * 2}
                                        r="5"
                                        fill="#22c55e"
                                        className="animate-pulse"
                                    />
                                    <circle
                                        cx={todayLeftPosition}
                                        cy={200 - (sCurveData[Math.round(todayLeftPosition / dayWidth)]?.planned || 0) * 2}
                                        r="3"
                                        fill="#3b82f6"
                                        fillOpacity="0.5"
                                    />
                                </g>
                            )}
                        </svg>
                    </div>
                </div>

                {/* X-Axis labels (Samples) */}
                <div className="flex justify-between items-center ml-10 text-[8px] font-mono text-gray-600 uppercase pt-2 border-t border-white/5">
                    {months.map((m, i) => (
                        <span key={i}>{m.month} {m.year}</span>
                    ))}
                </div>
            </div>

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                    <div className="glass-card w-full max-w-lg p-8 rounded-[2rem] border border-white/10 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                        <form onSubmit={handleSaveTask} className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Plantilla del Catálogo</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                                            onChange={(e) => {
                                                const act = catalog.find(a => a.id === e.target.value);
                                                if (act) {
                                                    setNewTask({
                                                        ...newTask,
                                                        title: act.name,
                                                        description: act.description
                                                    });
                                                }
                                            }}
                                        >
                                            <option value="" className="bg-gray-950">Seleccionar plantilla...</option>
                                            {catalog.map(act => (
                                                <option key={act.id} value={act.id} className="bg-gray-950">{act.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Tarea Padre (Jerarquía)</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                                            value={newTask.parentId || ""}
                                            onChange={(e) => setNewTask({ ...newTask, parentId: e.target.value || null })}
                                        >
                                            <option value="" className="bg-gray-950">--- Sin Padre (Raíz) ---</option>
                                            {tasks.filter(t => t.id !== editingTask).map(t => (
                                                <option key={t.id} value={t.id} className="bg-gray-950">{t.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Título de la Actividad</label>
                                    <input
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white font-medium"
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="Ej. Cimentación Fase 1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Categoría / Tipo</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                                            value={newTask.type}
                                            onChange={(e) => setNewTask({ ...newTask, type: e.target.value as TaskType })}
                                        >
                                            <option value={TaskType.AREA} className="bg-gray-950">AREA (Contenedor)</option>
                                            <option value={TaskType.ITEM} className="bg-gray-950">ITEM (Tarea)</option>
                                            <option value={TaskType.ACTIVITY} className="bg-gray-950">ACTIVIDAD</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Inicio</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white font-medium appearance-none"
                                            value={newTask.startDate}
                                            onChange={e => setNewTask({ ...newTask, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Fin</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white font-medium appearance-none"
                                            value={newTask.endDate}
                                            onChange={e => setNewTask({ ...newTask, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Progreso ({newTask.progress || 0}%)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        value={newTask.progress || 0}
                                        onChange={e => setNewTask({ ...newTask, progress: parseInt(e.target.value) })}
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                                        <span>0%</span>
                                        <span>50%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-white/5">
                                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 py-3 text-gray-500 hover:text-white font-bold transition-all text-xs uppercase tracking-widest">Cancelar</button>
                                <button type="submit" className="flex-1 btn-primary py-3 text-xs font-bold uppercase tracking-widest">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Progress Logging Modal */}
            {isProgressModalOpen && selectedTaskForProgress && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200">
                    <div className="bg-gray-950/50 border border-white/10 rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-2xl overflow-hidden glass">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] pointer-events-none -z-10"></div>

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tighter">Registrar Avance</h2>
                                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Reporte de Campo Diario
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Actividad</span>
                                    <span className="text-white font-bold">{selectedTaskForProgress.title}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Actual</span>
                                    <span className="text-blue-400 font-mono font-bold">{selectedTaskForProgress.progress}%</span>
                                </div>
                            </div>

                            {/* Mobile-Friendly Quick Access Buttons */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Progreso Rápido</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[25, 50, 75, 100].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setNewProgressLog({ ...newProgressLog, progressPercentage: val })}
                                            className={`py-3 rounded-xl border text-xs font-bold transition-all ${newProgressLog.progressPercentage === val ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            {val}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Fecha</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all text-white font-medium"
                                        value={newProgressLog.date}
                                        onChange={e => setNewProgressLog({ ...newProgressLog, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Ajuste Manual (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all text-white font-medium"
                                        value={newProgressLog.progressPercentage}
                                        onChange={e => setNewProgressLog({ ...newProgressLog, progressPercentage: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {/* Multimedia Evidence Upload */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                                    Evidencia Fotográfica {newProgressLog.progressPercentage > 0 && <span className="text-red-500">*</span>}
                                </label>
                                <div className="flex gap-4">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setImageFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className={`w-24 h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${imageFile
                                                ? 'border-green-500 bg-green-500/10'
                                                : 'border-white/10 bg-white/5 hover:border-green-500/50 hover:text-green-400 text-gray-500'
                                                }`}
                                        >
                                            {imageFile ? (
                                                <>
                                                    <Check className="w-6 h-6 text-green-500" />
                                                    <span className="text-[8px] font-bold text-green-500 uppercase">Listo</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[8px] font-bold uppercase">Subir Foto</span>
                                                </>
                                            )}
                                        </label>
                                        {imageFile && (
                                            <button
                                                onClick={() => setImageFile(null)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        {imageFile ? (
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${URL.createObjectURL(imageFile)})` }}></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{imageFile.name}</p>
                                                    <p className="text-[10px] text-gray-500">{(imageFile.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center text-[10px] text-gray-600 font-bold uppercase italic tracking-tighter text-center">
                                                Es obligatorio subir una foto para validar cualquier reporte de avance positivo.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Notas de Campo</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all text-white font-medium min-h-[80px] text-sm"
                                    placeholder="Describe lo ejecutado hoy..."
                                    value={newProgressLog.notes}
                                    onChange={e => setNewProgressLog({ ...newProgressLog, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setIsProgressModalOpen(false)} className="flex-1 py-4 text-gray-500 hover:text-white font-bold transition-all text-xs uppercase tracking-widest">Descartar</button>
                                <button
                                    onClick={handleSaveProgress}
                                    disabled={isUploading}
                                    className={`flex-[2] bg-green-600 hover:bg-green-500 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 ${isUploading ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            Subiendo...
                                        </>
                                    ) : (
                                        'Enviar Reporte'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Evidence & Logs Gallery Modal */}
            {isGalleryOpen && selectedTaskForGallery && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[120] animate-in fade-in duration-300">
                    <div className="bg-gray-950 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-3xl overflow-hidden glass">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedTaskForGallery.title}</h2>
                                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Historial de Ejecución y Evidencias</p>
                            </div>
                            <button onClick={() => setIsGalleryOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {progressLogs.filter(log => log.taskId === selectedTaskForGallery.id).length === 0 ? (
                                <div className="py-20 text-center text-gray-600 italic text-sm">No se han registrado reportes para esta actividad.</div>
                            ) : (
                                progressLogs
                                    .filter(log => log.taskId === selectedTaskForGallery.id)
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((log) => (
                                        <div key={log.id} className="relative pl-8 border-l border-white/10 pb-8 last:pb-0">
                                            <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-black text-white/50 uppercase tracking-widest font-mono">
                                                        {new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">
                                                        AVANCE: {log.progressPercentage}%
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-300 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/5 italic">
                                                    "{log.notes || 'Sin observaciones registradas'}"
                                                </p>

                                                {/* Multimedia Section Placeholder */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="aspect-square bg-white/5 rounded-xl border border-dashed border-white/10 flex items-center justify-center group overflow-hidden relative">
                                                        <Activity className="w-6 h-6 text-gray-800 opacity-20" />
                                                        <span className="absolute bottom-2 text-[8px] font-bold text-gray-700 uppercase">Sin Imagen</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>

                        <div className="p-6 bg-white/5 border-t border-white/10 flex justify-center">
                            <button onClick={() => setIsGalleryOpen(false)} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                Cerrar Visor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
