// src/hooks/useTransactions.ts
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { Tx } from "../lib/ai";

export function useTransactions(uid?: string) {
  const [txs, setTxs] = useState<Tx[]>([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, `users/${uid}/transactions`), orderBy("date", "desc"));
    return onSnapshot(q, snap => setTxs(snap.docs.map(d => d.data() as Tx)));
  }, [uid]);
  return txs;
}
