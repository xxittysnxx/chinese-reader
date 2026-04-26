import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function DictionaryModal({ isOpen, onClose, replacements, onSave }) {
  const [localReplacements, setLocalReplacements] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLocalReplacements([...replacements]);
    }
  }, [isOpen, replacements]);

  const handleAdd = () => {
    setLocalReplacements([...localReplacements, { from: '', to: '', isWord: false }]);
  };

  const handleRemove = (index) => {
    const newReps = [...localReplacements];
    newReps.splice(index, 1);
    setLocalReplacements(newReps);
  };

  const handleChange = (index, field, value) => {
    const newReps = [...localReplacements];
    newReps[index][field] = value;
    setLocalReplacements(newReps);
  };

  const handleSave = () => {
    // Filter out empty rules
    const validReps = localReplacements.filter(r => r.from.trim() !== '' && r.to.trim() !== '');
    onSave(validReps);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold">替換字典設定</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-4">
            設定完全相同的字串替換，例如將「又齊」替換為「博欽」。設定後將自動全篇更新。
          </p>

          <div className="space-y-4">
            {localReplacements.map((rule, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="原文"
                    value={rule.from}
                    onChange={(e) => handleChange(index, 'from', e.target.value)}
                    className="flex-1 min-w-0 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="text"
                    placeholder="替換為"
                    value={rule.to}
                    onChange={(e) => handleChange(index, 'to', e.target.value)}
                    className="flex-1 min-w-0 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={rule.isWord || false}
                    onChange={(e) => handleChange(index, 'isWord', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  僅替換獨立字詞 (透過智能分詞，避免誤判)
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={handleAdd}
            className="mt-4 w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            新增替換規則
          </button>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors shadow-md"
          >
            儲存並套用
          </button>
        </div>
      </div>
    </div>
  );
}
