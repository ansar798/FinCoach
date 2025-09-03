// src/hooks/useImportHistory.ts
import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export interface ImportRecord {
  id: string;
  fileName: string;
  fileSize: number;
  importDate: Date;
  transactionCount: number;
  userId: string;
}

export function useImportHistory(uid?: string) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setImports([]);
      setLoading(false);
      return;
    }

    const importsRef = collection(db, `users/${uid}/imports`);
    const q = query(importsRef, orderBy("importDate", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const importRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        importDate: doc.data().importDate.toDate()
      })) as ImportRecord[];
      
      setImports(importRecords);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching import history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const addImportRecord = async (fileName: string, fileSize: number, transactionCount: number) => {
    if (!uid) return;

    try {
      const importsRef = collection(db, `users/${uid}/imports`);
      await addDoc(importsRef, {
        fileName,
        fileSize,
        importDate: new Date(),
        transactionCount,
        userId: uid
      });
    } catch (error) {
      console.error("Error adding import record:", error);
      throw error;
    }
  };

  return { imports, loading, addImportRecord };
}
