import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const DataSyncContext = createContext();

export const useDataSync = () => useContext(DataSyncContext);

export const DataSyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper to safely access localStorage
  const safeLocalStorage = {
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error("LocalStorage access denied or failed:", e);
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error("LocalStorage write failed (Quota exceeded or denied):", e);
            return false;
        }
    }
  };

  /**
   * saveData
   * - Accepts a single object or an array of objects.
   * - Performs an upsert (merge) for existing items (by id) instead of replacing them.
   * - Preserves fields that are not provided by the caller (e.g. date) to avoid accidental loss.
   */
  const saveData = (table, data) => {
    try {
      const existingDataStr = safeLocalStorage.getItem(table);
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
      const dataArray = Array.isArray(data) ? data : [data];

      let updatedData = Array.isArray(existingData) ? [...existingData] : [];

      dataArray.forEach(item => {
        if (!item || !item.id) {
          // Defensive: warn and skip items without id (caller should provide id)
          console.warn(`[DataSync] saveData called with item missing id for table "${table}"`, item);
          return;
        }

        const existingIndex = updatedData.findIndex(existing => existing.id === item.id);

        if (existingIndex > -1) {
          // MERGE instead of replace: preserve fields that aren't provided by `item`
          updatedData[existingIndex] = { ...updatedData[existingIndex], ...item };
        } else {
          // New item: push as-is
          updatedData.push(item);
        }
      });

      const success = safeLocalStorage.setItem(table, JSON.stringify(updatedData));
      if (!success) {
        throw new Error("Storage quota exceeded or access denied.");
      }

      // Dispatch a storage event so other tabs/components listening update.
      // Note: Real storage events aren't fired in same tab by setItem, so dispatch a custom event.
      try { window.dispatchEvent(new Event('storage')); } catch (e) { /* ignore */ }

      return Promise.resolve();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        variant: 'destructive',
        title: '❌ Erro ao Salvar',
        description: 'Não foi possível salvar os dados localmente.'
      });
      return Promise.reject(error);
    }
  };

  const deleteData = (table, id) => {
    try {
      const existingDataStr = safeLocalStorage.getItem(table);
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
      const updatedData = existingData.filter(item => item.id !== id);

      const success = safeLocalStorage.setItem(table, JSON.stringify(updatedData));
      if (!success) {
          throw new Error("Storage write failed during deletion.");
      }

      try { window.dispatchEvent(new Event('storage')); } catch (e) { /* ignore */ }

      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        variant: 'destructive',
        title: '❌ Erro ao Excluir',
        description: 'Não foi possível excluir os dados.'
      });
      return Promise.reject(error);
    }
  };

  const getData = (table, filters = {}) => {
    try {
      const dataStr = safeLocalStorage.getItem(table);
      let data = dataStr ? JSON.parse(dataStr) : [];

      // Apply filters if provided
      if (Object.keys(filters).length > 0) {
        data = data.filter(item => {
          return Object.entries(filters).every(([key, value]) => item[key] === value);
        });
      }

      return Promise.resolve(data);
    } catch (error) {
      console.error('Error getting data:', error);
      return Promise.reject(error);
    }
  };

  return (
    <DataSyncContext.Provider value={{ isOnline, saveData, deleteData, getData }}>
      {children}
    </DataSyncContext.Provider>
  );
};