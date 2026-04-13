import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

export interface PublicStats {
  containersTraded: string;
  countriesSourced: string;
  productsTraced: string;
  activeInvestors: string;
  totalSales: string;
  grossProfit: string;
  activeShipments: string;
  marketReach: string;
  testimonial: string;
}

const defaultStats: PublicStats = {
  containersTraded: "38+",
  countriesSourced: "12+",
  productsTraced: "100%",
  activeInvestors: "50+",
  totalSales: "AED 10,395,310",
  grossProfit: "AED 271,224",
  activeShipments: "14 Containers",
  marketReach: "Asia & Middle East",
  testimonial: "The level of transparency provided by TRACES has completely transformed how we evaluate our investment performance in the food sector."
};

export function usePublicStats() {
  const [stats, setStats] = useState<PublicStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'public_stats'), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as PublicStats);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching public stats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stats, loading };
}
