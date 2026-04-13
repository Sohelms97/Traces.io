import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export function useCMS() {
  const [cmsData, setCmsData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cms'), (snapshot) => {
      const data: any = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data().data;
      });
      setCmsData(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching CMS data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { cmsData, loading };
}
