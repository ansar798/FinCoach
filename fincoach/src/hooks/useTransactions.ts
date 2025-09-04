// src/hooks/useTransactions.ts
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Tx } from "../lib/ai";

export function useTransactions(uid?: string) {
  const [txs, setTxs] = useState<(Tx & { id: string })[]>([]);
  
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, `users/${uid}/transactions`), orderBy("date", "desc"));
    return onSnapshot(q, snap => {
      const docs = snap.docs;
      setTxs(docs.map(d => ({ ...d.data() as Tx, id: d.id })));
    });
  }, [uid]);

  const updateTransaction = async (txId: string, updates: Partial<Tx>) => {
    if (!uid) throw new Error("User not authenticated");
    
    const docRef = doc(db, `users/${uid}/transactions`, txId);
    await updateDoc(docRef, updates);
  };

  return { txs, updateTransaction };
}
