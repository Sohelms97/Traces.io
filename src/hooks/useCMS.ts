import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export function useCMS() {
  const [cmsData, setCmsData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to CMS collection
    const unsubCMS = onSnapshot(collection(db, 'cms'), (snapshot) => {
      const data: any = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data().data;
      });
      setCmsData(prev => ({ ...prev, ...data }));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching CMS data:", error);
    });

    // Listen to Products collection
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCmsData(prev => ({ ...prev, products }));
    }, (error) => {
      console.error("Error fetching products for CMS:", error);
    });

    return () => {
      unsubCMS();
      unsubProducts();
    };
  }, []);

  return { cmsData, loading };
}
