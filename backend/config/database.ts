import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, query, where, limit, addDoc, updateDoc, setDoc, serverTimestamp, orderBy, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";
import path from "path";

// Load Firebase Config
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Initialize Firebase Client SDK (works in Node.js)
const app = initializeApp(firebaseConfig);

// Export Firestore instance
const firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const db = {
  collection: (path: string) => {
    const colRef = collection(firestoreInstance, path);
    return {
      where: (field: string, op: any, value: any) => {
        let q = query(colRef, where(field, op, value));
        const wrapQuery = (currentQ: any) => ({
          limit: (n: number) => wrapQuery(query(currentQ, limit(n))),
          orderBy: (field: string, dir: "asc" | "desc" = "asc") => wrapQuery(query(currentQ, orderBy(field, dir))),
          get: async () => {
            const snap = await getDocs(currentQ);
            return {
              empty: snap.empty,
              docs: snap.docs.map(d => ({
                id: d.id,
                data: () => d.data(),
                exists: d.exists()
              }))
            };
          }
        });
        return wrapQuery(q);
      },
      orderBy: (field: string, dir: "asc" | "desc" = "asc") => {
        let q = query(colRef, orderBy(field, dir));
        const wrapQuery = (currentQ: any) => ({
          limit: (n: number) => wrapQuery(query(currentQ, limit(n))),
          where: (field: string, op: any, value: any) => wrapQuery(query(currentQ, where(field, op, value))),
          get: async () => {
            const snap = await getDocs(currentQ);
            return {
              empty: snap.empty,
              docs: snap.docs.map(d => ({
                id: d.id,
                data: () => d.data(),
                exists: d.exists()
              }))
            };
          }
        });
        return wrapQuery(q);
      },
      limit: (n: number) => {
        let q = query(colRef, limit(n));
        const wrapQuery = (currentQ: any) => ({
          orderBy: (field: string, dir: "asc" | "desc" = "asc") => wrapQuery(query(currentQ, orderBy(field, dir))),
          where: (field: string, op: any, value: any) => wrapQuery(query(currentQ, where(field, op, value))),
          get: async () => {
            const snap = await getDocs(currentQ);
            return {
              empty: snap.empty,
              docs: snap.docs.map(d => ({
                id: d.id,
                data: () => d.data(),
                exists: d.exists()
              }))
            };
          }
        });
        return wrapQuery(q);
      },
      get: async () => {
        const snap = await getDocs(colRef);
        return {
          empty: snap.empty,
          docs: snap.docs.map(d => ({
            id: d.id,
            data: () => d.data(),
            exists: d.exists()
          }))
        };
      },
      add: async (data: any) => {
        const docRef = await addDoc(colRef, data);
        return { id: docRef.id };
      },
      doc: (id: string) => {
        const docRef = doc(firestoreInstance, path, id);
        return {
          get: async () => {
            const d = await getDoc(docRef);
            return {
              id: d.id,
              data: () => d.data(),
              exists: d.exists()
            };
          },
          update: (data: any) => updateDoc(docRef, data),
          set: (data: any) => setDoc(docRef, data),
          delete: () => deleteDoc(docRef)
        };
      }
    };
  }
};

export const auth = getAuth(app);
export { signInWithEmailAndPassword };

export const FieldValue = {
  serverTimestamp: () => serverTimestamp()
};

console.log("Firebase Client SDK Bridge initialized for Backend");
