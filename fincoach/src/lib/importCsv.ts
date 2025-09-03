// src/lib/importCsv.ts
import Papa from "papaparse";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

// CSV headers expected: date,amount,merchant,category,source,memo
export async function importCsv(uid: string, file: File, addImportRecord?: (fileName: string, fileSize: number, transactionCount: number) => Promise<void>) {
  const col = collection(db, `users/${uid}/transactions`);
  return new Promise<void>((resolve, reject) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (res) => {
        const transactions = res.data as any[];
        let transactionCount = 0;
        
        for (const row of transactions) {
          await addDoc(col, {
            date: row.date, amount: +row.amount,
            merchant: row.merchant, category: row.category || "Uncategorized",
            source: row.source || "Checking", memo: row.memo || ""
          });
          transactionCount++;
        }
        
        // Record the import if callback is provided
        if (addImportRecord) {
          try {
            await addImportRecord(file.name, file.size, transactionCount);
          } catch (error) {
            console.error("Error recording import:", error);
            // Don't fail the import if recording fails
          }
        }
        
        resolve();
      },
      error: reject,
    });
  });
}
