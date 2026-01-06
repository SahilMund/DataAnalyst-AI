export interface Task {
    id: number;
    title: string;
    description?: string;
    status: 'pending' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    data_source_id?: number | null;
    created_at: string;
}

export interface TaskCreateRequest {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    data_source_id?: number | null;
}

export interface TaskUpdateRequest {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    data_source_id?: number | null;
}

export interface TasksResponse {
    tasks: Task[];
}
