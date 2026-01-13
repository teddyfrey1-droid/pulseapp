// hooks/usePulseData.ts
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { Objective, User, Palier } from "@/lib/demo-data";
import { getPct, parseMoney } from "@/lib/logic";

export function usePulseData() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  useEffect(() => {
    // 1. Gestion de l'utilisateur connecté
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        onValue(userRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            // Adaptation des données utilisateur
            const adaptedUser: User = {
              id: firebaseUser.uid,
              name: val.name || "Utilisateur",
              email: val.email || firebaseUser.email || "",
              role: val.role === 'admin' ? 'admin' : 'employee',
              team: "Équipe", 
              contractHours: val.hours || 35,
              baseHours: 35
            };
            setCurrentUser(adaptedUser);
          }
        });
      } else {
        setCurrentUser(null);
      }
    });

    // 2. Récupération des Objectifs
    const objsRef = ref(db, "objectives");
    const unsubObjs = onValue(objsRef, (snapshot) => {
      const rawObjs = snapshot.val() || {};
      const adaptedObjectives: Objective[] = Object.keys(rawObjs).map((key) => {
        const o = rawObjs[key];
        
        // Calculs pour l'affichage
        const currentVal = parseFloat(o.current) || 0;
        const targetVal = parseFloat(o.target) || 0;
        const pct = getPct(currentVal, targetVal, o.isInverse);
        
        // Mapping des paliers
        const mappedPaliers: Palier[] = (o.paliers || []).map((p: any, index: number) => ({
          id: `p-${key}-${index}`,
          level: index + 1,
          name: `Palier ${index + 1}`,
          target: parseFloat(p.threshold),
          reward: parseMoney(p.prize),
          description: `Atteindre ${p.threshold}${o.isNumeric ? '' : '%'}`,
          unlocked: o.isNumeric ? currentVal >= p.threshold : pct >= p.threshold
        }));

        return {
          id: key,
          title: o.name,
          description: o.isPrimary ? "Objectif Prioritaire" : "Objectif Bonus",
          type: o.isPrimary ? "principal" : "secondary",
          progress: currentVal,
          target: targetVal,
          unit: o.isNumeric ? "" : "%",
          paliers: mappedPaliers,
          unlocked: o.published, 
          deadline: new Date(),
          reward: mappedPaliers.reduce((acc, p) => acc + p.reward, 0),
          isActive: o.published
        };
      });
      
      setObjectives(adaptedObjectives.filter(o => o.isActive));
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubObjs();
    };
  }, []);

  return { currentUser, objectives, loading };
}
