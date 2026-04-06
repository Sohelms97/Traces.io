import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

export interface DocumentRecord {
  id: string;
  fileName: string;
  docType: string;
  fileSize: number;
  uploadDate: any;
  uploadedBy: string;
  base64Data: string;
  extractedData: any;
  linkedRecordId?: string;
  linkedModule?: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('uploadDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          uploadDate: data.uploadDate?.toDate?.()?.toISOString() || new Date().toISOString()
        } as DocumentRecord;
      });
      setDocuments(docs);
    });

    return () => unsubscribe();
  }, []);

  const addDocument = async (docData: Omit<DocumentRecord, 'id' | 'uploadDate'>) => {
    try {
      const newDoc = {
        ...docData,
        uploadDate: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'documents'), newDoc);
      return { ...newDoc, id: docRef.id };
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return { documents, addDocument, deleteDocument };
}
