import { useState, useEffect } from 'react';
import { DocumentType } from '../lib/claude';

export interface DocumentRecord {
  id: string;
  fileName: string;
  docType: DocumentType;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  base64Data: string;
  extractedData: any;
  linkedRecordId?: string;
  linkedModule?: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('traces_documents');
    if (stored) {
      setDocuments(JSON.parse(stored));
    }
  }, []);

  const addDocument = (doc: Omit<DocumentRecord, 'id' | 'uploadDate'>) => {
    const newDoc: DocumentRecord = {
      ...doc,
      id: Math.random().toString(36).substr(2, 9),
      uploadDate: new Date().toISOString(),
    };
    
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('traces_documents', JSON.stringify(updated));
    return newDoc;
  };

  const deleteDocument = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem('traces_documents', JSON.stringify(updated));
  };

  return { documents, addDocument, deleteDocument };
}
