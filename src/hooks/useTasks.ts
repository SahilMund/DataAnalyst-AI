import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, deleteTask, getTasks, updateTask } from '../zustand/apis/taskApi';
import useTaskStore from '../zustand/stores/taskStore';
import { toast } from 'react-toastify';

export const useGetTasks = () => {
    const setTasks = useTaskStore((state) => state.setTasks);
    return useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const res = await getTasks();
            setTasks(res.data.tasks);
            return res.data.tasks;
        },
    });
};

export const useCreateTaskMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task created');
        },
        onError: () => toast.error('Failed to create task'),
    });
};

export const useUpdateTaskMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task updated');
        },
        onError: () => toast.error('Failed to update task'),
    });
};

export const useDeleteTaskMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task deleted');
        },
        onError: () => toast.error('Failed to delete task'),
    });
};
