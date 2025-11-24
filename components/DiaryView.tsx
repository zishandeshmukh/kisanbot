
import React, { useEffect, useState } from 'react';
import { DiaryEntry } from '../types';
import { getDiaryEntries, addDiaryEntry, deleteDiaryEntry } from '../services/diaryService';

interface Props {
  t: any;
}

export const DiaryView: React.FC<Props> = ({ t }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setEntries(getDiaryEntries());
  }, []);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const entry = addDiaryEntry({
      type: 'note',
      title: 'Farmer Note',
      description: newNote
    });
    setEntries([entry, ...entries]);
    setNewNote('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
      const updated = deleteDiaryEntry(id);
      setEntries(updated);
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'disease': return '🦠';
          case 'water': return '💧';
          case 'fertilizer': return '💊';
          case 'note': return '📝';
          default: return '📅';
      }
  };

  return (
    <div className="p-4 pb-24 animate-fade-in">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.diaryTitle}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.diarySubtitle}</p>
          </div>
          <button 
             onClick={() => setIsAdding(!isAdding)}
             className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-all active:scale-95"
          >
             {isAdding ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             )}
          </button>
       </div>

       {/* Add Note Form */}
       {isAdding && (
           <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md mb-6 animate-slide-up border border-green-100 dark:border-green-900">
               <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-green-500 text-sm dark:text-white mb-3 min-h-[100px]"
               />
               <button onClick={handleAddNote} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl">{t.addNote}</button>
           </div>
       )}

       {/* Timeline */}
       <div className="space-y-6 relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-4 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>

          {entries.map((entry) => (
             <div key={entry.id} className="relative z-10 pl-16">
                 {/* Icon Bubble */}
                 <div className={`absolute left-2 top-0 w-9 h-9 rounded-full border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center text-lg shadow-sm ${
                     entry.type === 'disease' ? 'bg-red-100' :
                     entry.type === 'water' ? 'bg-blue-100' :
                     'bg-gray-100 dark:bg-gray-700'
                 }`}>
                     {getIcon(entry.type)}
                 </div>

                 <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
                     <button onClick={() => handleDelete(entry.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {new Date(entry.timestamp).toLocaleDateString()} • {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                     <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base mt-1">{entry.title}</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{entry.description}</p>
                     
                     {entry.image && (
                         <div className="mt-3 rounded-xl overflow-hidden h-32 w-full border border-gray-100 dark:border-gray-700">
                             <img src={`data:image/jpeg;base64,${entry.image}`} alt="Log" className="w-full h-full object-cover" />
                         </div>
                     )}
                 </div>
             </div>
          ))}
          
          {entries.length === 0 && (
              <div className="text-center py-10 pl-0">
                  <p className="text-gray-400 text-sm italic">No entries yet. Start analyzing or add a note!</p>
              </div>
          )}
       </div>
    </div>
  );
};
