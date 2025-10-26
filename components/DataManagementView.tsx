import React, { useState, useEffect } from 'react';
import { KnowledgeBaseEntry } from '../types';
import { getKnowledgeBase, saveKnowledgeBase } from '../utils/knowledgeBase';
import { DatabaseIcon, TrashIcon, EditIcon, SaveIcon, CancelIcon } from './Icons';

const DataManagementView: React.FC = () => {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [newInformation, setNewInformation] = useState('');
  const [filter, setFilter] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState('');
  const [editingInformation, setEditingInformation] = useState('');

  useEffect(() => {
    setEntries(getKnowledgeBase());
  }, []);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newInformation.trim()) return;

    const newEntry: KnowledgeBaseEntry = {
      id: `custom-${Date.now()}`,
      topic: newTopic.trim(),
      information: newInformation.trim(),
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    saveKnowledgeBase(updatedEntries);
    setNewTopic('');
    setNewInformation('');
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
        const updatedEntries = entries.filter(entry => entry.id !== id);
        setEntries(updatedEntries);
        saveKnowledgeBase(updatedEntries);
    }
  };

  const handleEditStart = (entry: KnowledgeBaseEntry) => {
    setEditingEntryId(entry.id);
    setEditingTopic(entry.topic);
    setEditingInformation(entry.information);
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingTopic('');
    setEditingInformation('');
  };

  const handleUpdateEntry = (id: string) => {
    if (!editingTopic.trim() || !editingInformation.trim()) return;

    const updatedEntries = entries.map(entry =>
      entry.id === id
        ? { ...entry, topic: editingTopic.trim(), information: editingInformation.trim() }
        : entry
    );
    setEntries(updatedEntries);
    saveKnowledgeBase(updatedEntries);
    handleCancelEdit(); // Reset editing state
  };


  const filteredEntries = entries.filter(
    entry =>
      entry.topic.toLowerCase().includes(filter.toLowerCase()) ||
      entry.information.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl w-full h-full flex flex-col animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-300 flex items-center justify-center">
        <DatabaseIcon className="w-8 h-8 mr-3"/>
        Knowledge Base Management
      </h2>
      
      {/* Add New Entry Form */}
      <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-semibold mb-3 text-blue-200">Add New Information</h3>
        <form onSubmit={handleAddEntry} className="space-y-4">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Topic (e.g., 'Library Hours')"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white"
            required
            disabled={!!editingEntryId}
          />
          <textarea
            value={newInformation}
            onChange={(e) => setNewInformation(e.target.value)}
            placeholder="Information (e.g., '7:30 AM to 4:00 PM on school days.')"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white"
            rows={3}
            required
            disabled={!!editingEntryId}
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!!editingEntryId}>
            Add Entry
          </button>
        </form>
      </div>

      {/* Existing Entries List */}
      <div className="flex-grow flex flex-col min-h-0">
        <h3 className="text-xl font-semibold mb-3 text-blue-200">Current Knowledge</h3>
        <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search entries..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white mb-4"
        />
        <div className="flex-grow bg-gray-900/50 p-2 rounded-md overflow-y-auto">
            {filteredEntries.length > 0 ? (
                <ul className="space-y-3 p-2">
                    {filteredEntries.map(entry => (
                    <li key={entry.id} className="bg-gray-700 p-4 rounded-lg flex flex-col gap-4 transition-all duration-300">
                        {editingEntryId === entry.id ? (
                            // Editing View
                            <div className="flex flex-col gap-3 w-full">
                                <input
                                    type="text"
                                    value={editingTopic}
                                    onChange={(e) => setEditingTopic(e.target.value)}
                                    className="w-full p-2 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white font-bold"
                                />
                                <textarea
                                    value={editingInformation}
                                    onChange={(e) => setEditingInformation(e.target.value)}
                                    className="w-full p-2 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white"
                                    rows={3}
                                />
                                <div className="flex justify-end items-center gap-2">
                                    <button onClick={() => handleUpdateEntry(entry.id)} className="text-green-400 hover:text-green-300 transition-colors p-2 rounded-full hover:bg-gray-600" title="Save">
                                        <SaveIcon />
                                    </button>
                                    <button onClick={handleCancelEdit} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-600" title="Cancel">
                                        <CancelIcon />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Display View
                            <div className="flex justify-between items-start gap-4 w-full">
                                <div>
                                    <p className="font-bold text-blue-300">{entry.topic}</p>
                                    <p className="text-gray-300">{entry.information}</p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-1">
                                    <button onClick={() => handleEditStart(entry)} disabled={!!editingEntryId} className="text-gray-400 hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Edit">
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => handleDeleteEntry(entry.id)} disabled={!!editingEntryId} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Delete">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No entries found. Add some information to teach the bot!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DataManagementView;