import React, { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Plus, Trash2, CheckSquare, Square, X } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  done: boolean;
}

export default function StickyNote() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('sticky_note_tasks');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', text: 'Follow the plan', done: false },
      { id: '2', text: 'No revenge trading', done: false },
    ];
  });
  const [newTask, setNewTask] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const x = useMotionValue(20);
  const y = useMotionValue(100);

  useEffect(() => {
    setIsClient(true);
    const savedPos = localStorage.getItem('sticky_note_position');
    if (savedPos) {
      const pos = JSON.parse(savedPos);
      x.set(pos.x);
      y.set(pos.y);
    }
    const savedVisibility = localStorage.getItem('sticky_note_visible');
    if (savedVisibility !== null) {
      setIsVisible(JSON.parse(savedVisibility));
    }
  }, [x, y]);

  useEffect(() => {
    localStorage.setItem('sticky_note_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sticky_note_visible', JSON.stringify(isVisible));
  }, [isVisible]);

  useEffect(() => {
    const handleShow = () => setIsVisible(true);
    window.addEventListener('show_sticky_note', handleShow);
    return () => window.removeEventListener('show_sticky_note', handleShow);
  }, []);

  const addTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask.trim(), done: false }]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  if (!isClient || !isVisible) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={() => {
        localStorage.setItem('sticky_note_position', JSON.stringify({ x: x.get(), y: y.get() }));
      }}
      className="fixed z-[100] w-64 text-black flex flex-col font-sans top-0 left-0"
      style={{ 
        minHeight: '220px', 
        x, 
        y,
        filter: 'drop-shadow(4px 6px 12px rgba(0,0,0,0.4))'
      }}
    >
      <div 
        className="relative flex-1 flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#efdd58', // Less bright realistic yellow
          clipPath: 'polygon(32px 0, 100% 0, 100% 100%, 0 100%, 0 32px)',
          borderRadius: '2px 2px 8px 2px'
        }}
      >
        {/* Top left folded corner */}
        <div 
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, transparent 50%, #d8c64d 50%, #b8a63b 100%)',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            borderBottomRightRadius: '4px'
          }}
        />

        {/* Draggable header area (invisible but functional) */}
        <div className="absolute top-0 left-0 w-full h-10 cursor-grab active:cursor-grabbing z-20" />

        {/* Realistic Red Push Pin */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center drop-shadow-md">
          {/* Pin head */}
          <div className="w-4 h-4 bg-red-600 rounded-full border border-red-800 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),inset_1px_1px_4px_rgba(255,255,255,0.6)] relative z-10">
            {/* Highlight */}
            <div className="absolute top-[2px] left-[2px] w-1.5 h-1.5 bg-white/60 rounded-full" />
          </div>
          {/* Pin needle visible part */}
          <div className="w-[1.5px] h-3 bg-gray-400 -mt-1 shadow-sm" />
        </div>

        {/* Close button */}
        <button 
          onClick={() => setIsVisible(false)} 
          className="absolute top-2 right-2 z-30 p-1 opacity-40 hover:opacity-100 transition-opacity rounded-full hover:bg-black/5"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="p-4 pt-10 flex-1 flex flex-col gap-2 relative z-10 cursor-default">
          <ul className="space-y-1.5 flex-1 mt-1">
            {tasks.map(task => (
              <li key={task.id} className="flex items-start gap-2 text-sm group min-h-[24px]">
                <button onClick={() => toggleTask(task.id)} className="mt-0.5 opacity-60 hover:opacity-100 shrink-0">
                  {task.done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
                <span className={`flex-1 break-words font-medium pt-0.5 leading-relaxed ${task.done ? 'line-through opacity-40' : 'opacity-90'}`} style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' }}>
                  {task.text}
                </span>
                <button 
                  onClick={() => removeTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-700 transition-opacity shrink-0 pt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={addTask} className="mt-2 flex items-center gap-1">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add goal..."
              className="flex-1 bg-transparent border-none outline-none px-1 py-1 text-sm text-black placeholder:text-black/40 focus:bg-white/20 rounded transition-colors"
              style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' }}
            />
            <button type="submit" className="p-1 opacity-50 hover:opacity-100 text-black rounded transition-colors hover:bg-black/10">
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
