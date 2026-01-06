import { create } from 'zustand';
import { Task } from '../../interfaces/taskInterface';

interface TaskStore {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTaskState: (id: number, data: Partial<Task>) => void;
    removeTask: (id: number) => void;
}

const useTaskStore = create<TaskStore>((set) => ({
    tasks: [],
    setTasks: (tasks) => set({ tasks }),
    addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
    updateTaskState: (id, data) =>
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
    removeTask: (id) =>
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
        })),
}));

export default useTaskStore;
