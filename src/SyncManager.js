// Simple Sync Manager to handle offline requests
// In a real app, use IDB or more robust queue

const QUEUE_KEY = 'offline_queue';

export const getQueue = () => {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
};

export const addToQueue = (request) => {
    const queue = getQueue();
    queue.push({ ...request, id: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const clearQueue = () => {
    localStorage.setItem(QUEUE_KEY, '[]');
};

export const removeFromQueue = (id) => {
    const queue = getQueue();
    const newQueue = queue.filter(item => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
};
