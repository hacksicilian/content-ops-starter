'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase/client';
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, formatDate } from '@/lib/utils';
import type { Task, TaskStatus, User, Deployment } from '@/types';
import { TaskModal } from './TaskModal';

interface Props {
    tasks: Task[];
    users: Pick<User, 'id' | 'name' | 'role'>[];
    deployments: Pick<Deployment, 'id' | 'site_code' | 'site_name'>[];
}

const COLUMNS: { id: TaskStatus; title: string; color: string; headerBg: string }[] = [
    { id: 'TODO',        title: 'Por Hacer',   color: 'border-gray-300',  headerBg: 'bg-gray-100' },
    { id: 'IN_PROGRESS', title: 'En Progreso', color: 'border-blue-300',  headerBg: 'bg-blue-50' },
    { id: 'BLOCKED',     title: 'Bloqueado',   color: 'border-red-300',   headerBg: 'bg-red-50' },
    { id: 'DONE',        title: 'Completado',  color: 'border-green-300', headerBg: 'bg-green-50' }
];

export function KanbanClient({ tasks: initial, users, deployments }: Props) {
    const [tasks, setTasks] = useState<Task[]>(initial);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Task | null>(null);
    const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO');

    const tasksByStatus = COLUMNS.reduce<Record<TaskStatus, Task[]>>((acc, col) => {
        acc[col.id] = tasks.filter(t => t.status === col.id).sort((a, b) => a.sort_order - b.sort_order);
        return acc;
    }, {} as Record<TaskStatus, Task[]>);

    const onDragEnd = useCallback(async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as TaskStatus;
        const task = tasks.find(t => t.id === draggableId);
        if (!task) return;

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus, sort_order: destination.index } : t));

        const supabase = createClient();
        await supabase
            .from('tasks')
            .update({ status: newStatus, sort_order: destination.index, updated_at: new Date().toISOString() })
            .eq('id', draggableId);
    }, [tasks]);

    const handleSave = async (data: any) => {
        const supabase = createClient();

        if (editing) {
            const { data: updated } = await supabase
                .from('tasks')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', editing.id)
                .select('*, assigned_user:users!assigned_to(id, name), deployment:deployments!deployment_id(id, site_code, site_name)')
                .single();
            if (updated) setTasks(prev => prev.map(t => t.id === editing.id ? updated as any : t));
        } else {
            const { data: created } = await supabase
                .from('tasks')
                .insert({ ...data, sort_order: tasksByStatus[data.status || 'TODO'].length })
                .select('*, assigned_user:users!assigned_to(id, name), deployment:deployments!deployment_id(id, site_code, site_name)')
                .single();
            if (created) setTasks(prev => [...prev, created as any]);
        }

        setModalOpen(false);
        setEditing(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta tarea?')) return;
        const supabase = createClient();
        await supabase.from('tasks').delete().eq('id', id);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const openNew = (status: TaskStatus) => {
        setEditing(null);
        setDefaultStatus(status);
        setModalOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm text-gray-500">
                    {COLUMNS.map(col => (
                        <span key={col.id}>
                            <span className="font-medium text-gray-700">{tasksByStatus[col.id].length}</span> {TASK_STATUS_CONFIG[col.id].label}
                        </span>
                    ))}
                </div>
                <button onClick={() => openNew('TODO')} className="btn-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Tarea
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-4 gap-4 min-w-[900px]">
                    {COLUMNS.map(col => (
                        <div key={col.id} className={`flex flex-col rounded-xl border-2 ${col.color} bg-gray-50 min-h-[600px]`}>
                            {/* Column header */}
                            <div className={`px-4 py-3 rounded-t-xl ${col.headerBg} flex items-center justify-between`}>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-gray-800">{col.title}</span>
                                    <span className="w-5 h-5 rounded-full bg-white bg-opacity-70 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {tasksByStatus[col.id].length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => openNew(col.id)}
                                    className="w-6 h-6 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
                                    title="Agregar tarea"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>

                            {/* Droppable area */}
                            <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 p-3 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50' : ''}`}
                                    >
                                        {tasksByStatus[col.id].map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg rotate-1 border-indigo-300' : ''}`}
                                                    >
                                                        <KanbanCard
                                                            task={task}
                                                            onEdit={() => { setEditing(task); setModalOpen(true); }}
                                                            onDelete={() => handleDelete(task.id)}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {tasksByStatus[col.id].length === 0 && !snapshot.isDraggingOver && (
                                            <div className="text-center py-8 text-gray-400 text-xs">
                                                Sin tareas
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {modalOpen && (
                <TaskModal
                    task={editing}
                    defaultStatus={defaultStatus}
                    users={users}
                    deployments={deployments}
                    onSave={handleSave}
                    onClose={() => { setModalOpen(false); setEditing(null); }}
                />
            )}
        </div>
    );
}

function KanbanCard({ task, onEdit, onDelete }: { task: Task; onEdit: () => void; onDelete: () => void }) {
    const priority = PRIORITY_CONFIG[task.priority];

    return (
        <div>
            {/* Priority bar */}
            <div className={`h-1 rounded-full mb-2 ${task.priority === 'CRITICAL' ? 'bg-red-500' : task.priority === 'HIGH' ? 'bg-orange-400' : task.priority === 'MEDIUM' ? 'bg-yellow-400' : 'bg-gray-300'}`} />

            <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</h4>
                <div className="flex gap-1 flex-shrink-0">
                    <button onClick={onEdit} className="p-0.5 text-gray-400 hover:text-gray-600">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button onClick={onDelete} className="p-0.5 text-gray-400 hover:text-red-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {task.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            )}

            {/* Deployment tag */}
            {(task as any).deployment && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {(task as any).deployment.site_code}
                </div>
            )}

            <div className="flex items-center justify-between mt-2">
                <span className={`badge text-xs ${priority.bg} ${priority.color}`}>{priority.label}</span>
                <div className="flex items-center gap-2">
                    {task.due_date && (
                        <span className={`text-xs ${new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            {formatDate(task.due_date)}
                        </span>
                    )}
                    {(task as any).assigned_user && (
                        <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-medium text-indigo-700" title={(task as any).assigned_user.name}>
                            {(task as any).assigned_user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
