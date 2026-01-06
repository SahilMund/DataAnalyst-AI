import { TaskCreateRequest, TaskUpdateRequest, TasksResponse } from "../../interfaces/taskInterface";
import { ApiResponse } from "../../interfaces/globalInterfaces";
import { del, get, post, put } from "./apiClient";

const TASK_BASE = "/tasks/v1";

export const getTasks = async (): Promise<ApiResponse<TasksResponse>> => {
    return await get(`${TASK_BASE}/get-tasks`);
};

export const createTask = async (data: TaskCreateRequest): Promise<ApiResponse<{ task_id: number }>> => {
    return await post(`${TASK_BASE}/create-task`, data);
};

export const updateTask = async ({ id, data }: { id: number, data: TaskUpdateRequest }): Promise<ApiResponse<any>> => {
    return await put(`${TASK_BASE}/update-task/${id}`, data);
};

export const deleteTask = async (id: number): Promise<ApiResponse<any>> => {
    return await del(`${TASK_BASE}/delete-task/${id}`);
};
