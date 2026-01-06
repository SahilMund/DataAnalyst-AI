import React, { useState, useEffect, useRef } from 'react';
import { BiPlus, BiTrash, BiCheck, BiTime, BiArchive, BiPaperPlane, BiBot, BiUser } from 'react-icons/bi';
import { useGetTasks, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '../hooks/useTasks';
import { useGetDataSourcesMutation } from '../hooks/useDataSet';
import { useStreamChat, useInitiateConversationMutation } from '../hooks/useChat';
import dataSetStore from '../zustand/stores/dataSetStore';
import { Task, TaskCreateRequest } from '../interfaces/taskInterface';
import { toast } from 'react-toastify';

const Todos: React.FC = () => {
    // Task CRUD
    const { data: tasks, isLoading, refetch: refetchTasks } = useGetTasks();
    const { mutate: createTask } = useCreateTaskMutation();
    const { mutate: updateTask } = useUpdateTaskMutation();
    const { mutate: deleteTask } = useDeleteTaskMutation();
    const { mutate: getDataSources } = useGetDataSourcesMutation();
    const dataSets = dataSetStore((state) => state.dataSets);

    // Chat State
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Task Logic
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isAdding, setIsAdding] = useState(false);
    const [newTask, setNewTask] = useState<{ title: string, description: string, data_source_id: number | null | undefined }>({ title: '', description: '', data_source_id: undefined });

    const { mutate: initiateConversation } = useInitiateConversationMutation(
        (id) => {
            console.log("Chat initiated with ID:", id);
            setConversationId(id);
        },
        () => {
            console.error("Failed to initiate chat conversation");
            toast.error("AI Assistant failed to initialize. Natural language commands may not work.");
        }
    );

    const { mutate: sendMessage } = useStreamChat({
        onStreamData: (data: any[]) => {
            data.forEach(chunk => {
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant') {
                        return [...prev.slice(0, -1), { ...last, content: last.content + (chunk.answer || chunk.error || '') }];
                    }
                    return [...prev, { role: 'assistant', content: chunk.answer || chunk.error || '' }];
                });
            });
        },
        onSuccess: () => {
            setIsStreaming(false);
            console.log("Message sent successfully, refetching tasks...");
            refetchTasks();
        },
        onError: (err) => {
            setIsStreaming(false);
            console.error("Chat Stream Error:", err);
            toast.error("Failed to get AI response");
        }
    });

    useEffect(() => {
        if (!dataSets) getDataSources();
        initiateConversation({ data_source_id: 0, title: "Task Assistant Chat" }); // 0 for global task chat
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        if (!conversationId) {
            toast.warn("Assistant is still initializing. Please wait...");
            return;
        }

        const msg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setIsStreaming(true);

        sendMessage({
            question: msg,
            conversaction_id: conversationId,
            dataset_id: 0,
            selected_tables: [],
            type: 'task',
            llm_model: 'llama-3.3-70b-versatile'
        });
    };

    const handleCreate = () => {
        if (!newTask.title) {
            toast.warn("Please enter a task title");
            return;
        }

        const taskData: TaskCreateRequest = {
            ...newTask,
            data_source_id: newTask.data_source_id ?? null
        };

        console.log("Creating task with data:", taskData);
        createTask(taskData, {
            onSuccess: () => {
                toast.success('Task created successfully');
                setIsAdding(false);
                setNewTask({ title: '', description: '', data_source_id: undefined });
                refetchTasks();
            },
            onError: (err: any) => {
                console.error("Task Creation Error Detail:", err.response?.data || err);
                toast.error("Failed to create task via UI");
            }
        });
    };

    const toggleStatus = (task: Task) => {
        const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateTask({ id: task.id, data: { status: nextStatus } });
    };

    const filteredTasks = tasks?.filter(t => filterStatus === 'all' || t.status === filterStatus) || [];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-maroon-900 overflow-hidden">
            {/* Left Section: AI Assistant */}
            <div className="w-1/2 border-r border-blue-gray-100 dark:border-maroon-700 flex flex-col bg-white dark:bg-maroon-800">
                <div className="p-6 border-b border-blue-gray-100 dark:border-maroon-700 flex justify-between items-center bg-gray-50/30 dark:bg-maroon-900/30">
                    <div>
                        <h2 className="text-xl font-bold text-navy-800 dark:text-white">Assistant</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Natural Language CRUD</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-orange-500 animate-ping' : 'bg-green-500'}`}></span>
                        <span className="text-xs text-gray-400 font-medium">LUMIN AI</span>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col justify-center items-center text-center opacity-50 px-12">
                            <div className="w-16 h-16 bg-navy-50 dark:bg-maroon-700 rounded-3xl flex items-center justify-center mb-6 rotate-3">
                                <BiBot className="w-8 h-8 text-navy-600 dark:text-maroon-400" />
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">I can manage your tasks</h3>
                            <p className="text-sm">Try saying: "Create a task to analyze sales outliers" or "Remind me to check the database tomorrow"</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-navy-800 text-white' : 'bg-gray-100 dark:bg-maroon-700 text-navy-600 dark:text-white'}`}>
                                {m.role === 'user' ? <BiUser /> : <BiBot />}
                            </div>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-navy-800 text-white rounded-tr-none' : 'bg-gray-50 dark:bg-maroon-700/50 text-navy-900 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-maroon-600'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-white dark:bg-maroon-800 border-t border-gray-100 dark:border-maroon-700">
                    <div className="relative group">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Type a task command..."
                            className="w-full bg-gray-50 dark:bg-maroon-900 border border-gray-100 dark:border-maroon-700 rounded-2xl py-4 px-6 pr-14 shadow-inner focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all text-sm group-hover:border-navy-200"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isStreaming}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-navy-800 text-white rounded-xl flex items-center justify-center hover:bg-navy-900 transition-all active:scale-90 disabled:opacity-50"
                        >
                            <BiPaperPlane className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Section: Workspace */}
            <div className="w-1/2 flex flex-col overflow-hidden">
                <div className="p-6 flex justify-between items-center bg-white/50 dark:bg-maroon-900/50 backdrop-blur-md z-10">
                    <div>
                        <h1 className="text-2xl font-black text-navy-800 dark:text-white">Workspace</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Project Management</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex bg-white dark:bg-maroon-800 p-1 rounded-xl shadow-sm border border-blue-gray-50 dark:border-maroon-700">
                            {['all', 'pending', 'completed'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filterStatus === s ? 'bg-navy-800 text-white shadow-md' : 'text-gray-400 hover:text-navy-600'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-navy-800 text-white p-2.5 rounded-xl shadow-lg hover:shadow-navy-200 transition-all active:scale-95 border border-navy-700"
                        >
                            <BiPlus className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 pt-4">
                    {isAdding && (
                        <div className="bg-white dark:bg-maroon-800 p-6 rounded-[24px] shadow-xl border-2 border-navy-50 animate-in slide-in-from-top-4 duration-300">
                            <input
                                autoFocus
                                placeholder="What needs to be done?"
                                className="w-full text-lg font-bold focus:outline-none mb-2 dark:bg-maroon-800 dark:text-white"
                                value={newTask.title}
                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Add some context..."
                                className="w-full text-sm text-gray-500 focus:outline-none resize-none mb-4 dark:bg-maroon-800 h-20"
                                value={newTask.description}
                                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            />
                            <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-maroon-700">
                                <select
                                    className="text-xs font-bold bg-gray-50 dark:bg-maroon-900 px-3 py-2 rounded-xl focus:outline-none border border-gray-100 dark:border-maroon-700"
                                    value={newTask.data_source_id || ''}
                                    onChange={e => setNewTask({ ...newTask, data_source_id: e.target.value ? Number(e.target.value) : undefined })}
                                >
                                    <option value="">Link Dataset (Optional)</option>
                                    {dataSets?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                                    <button onClick={handleCreate} className="px-6 py-2 bg-navy-800 text-white text-sm font-bold rounded-xl shadow-md active:scale-95 transition-all">Save Task</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {filteredTasks.map(task => (
                        <div key={task.id} className="group bg-white dark:bg-maroon-800 p-5 rounded-[22px] shadow-sm border border-blue-gray-50 dark:border-maroon-700 hover:shadow-lg hover:border-navy-100 dark:hover:border-maroon-500 transition-all flex items-start gap-4">
                            <button
                                onClick={() => toggleStatus(task)}
                                className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-green-500 border-green-500 shadow-sm shadow-green-100' : 'border-gray-200 group-hover:border-navy-200'}`}
                            >
                                {task.status === 'completed' && <BiCheck className="text-white w-4 h-4" />}
                            </button>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold transition-all ${task.status === 'completed' ? 'text-gray-400 line-through decoration-2' : 'text-navy-900 dark:text-white'}`}>
                                        {task.title}
                                    </h3>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                                    >
                                        <BiTrash className="w-4 h-4" />
                                    </button>
                                </div>
                                {task.description && <p className="text-sm text-gray-500 mb-3">{task.description}</p>}

                                <div className="flex items-center gap-4 mt-2">
                                    {task.data_source_id && (
                                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                            <BiArchive className="w-3 h-3" />
                                            <span>{dataSets?.find(d => d.id === task.data_source_id)?.name || 'Dataset'}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                                        <BiTime className="w-3 h-3" />
                                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!isLoading && filteredTasks.length === 0 && !isAdding && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-maroon-800 rounded-full flex items-center justify-center mb-6 opacity-30">
                                <BiCheck className="w-10 h-10 border-gray-400" />
                            </div>
                            <p className="font-bold text-gray-300">All caught up!</p>
                            <p className="text-xs text-gray-400 mt-1">Start by adding a task via UI or AI.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Todos;
