import { KnowledgeBaseEntry } from '../types';
import { defaultKnowledgeBase, KNOWLEDGE_BASE_VERSION } from '../data/defaultKnowledgeBase';

const DATA_STORAGE_KEY = 'schoolKnowledgeBase_data';
const VERSION_STORAGE_KEY = 'schoolKnowledgeBase_version';

// Function to get the knowledge base from localStorage
export const getKnowledgeBase = (): KnowledgeBaseEntry[] => {
  try {
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    
    // If version mismatch, or no version found, reset to new default data.
    // This ensures that updates to the default knowledge base are always reflected.
    if (storedVersion !== KNOWLEDGE_BASE_VERSION) {
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(defaultKnowledgeBase));
      localStorage.setItem(VERSION_STORAGE_KEY, KNOWLEDGE_BASE_VERSION);
      return defaultKnowledgeBase;
    }

    // If version matches, use the user's stored data.
    const storedData = localStorage.getItem(DATA_STORAGE_KEY);
    // Fallback to default if stored data is somehow missing.
    return storedData ? JSON.parse(storedData) : defaultKnowledgeBase; 

  } catch (error) {
    console.error('Failed to retrieve or parse knowledge base:', error);
    // Return default as a fallback in case of any errors.
    return defaultKnowledgeBase;
  }
};

// Function to save the knowledge base to localStorage
export const saveKnowledgeBase = (entries: KnowledgeBaseEntry[]): void => {
  try {
    // Only save the data. The version is tied to the default dataset and updated in getKnowledgeBase.
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(entries));
  } catch (error)
 {
    console.error('Failed to save knowledge base:', error);
  }
};