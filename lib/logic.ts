// lib/logic.ts

// Fonction utilitaire pour parser les nombres (comme dans ton app.js)
export function parseMoney(s: any): number {
  return parseFloat(String(s).replace(/[^0-9.-]/g, '')) || 0;
}

// Calcul du pourcentage d'avancement
export function getPct(current: any, target: any, isInverse: boolean): number {
  let cv = parseFloat(String(current).replace(',', '.'));
  let tv = parseFloat(String(target).replace(',', '.'));
  
  if (isNaN(cv) || isNaN(tv)) return 0;
  
  if (isInverse) {
    if (cv > tv) return 0;
    if (cv <= tv) return 100;
    return 0;
  }
  
  if (!tv) return 0;
  return Math.min((cv / tv) * 100, 100);
}

// Vérifie si un objectif est "Gagné" (Validé)
export function isObjectiveUnlocked(obj: any): boolean {
  if (!obj) return false;
  
  const pct = getPct(obj.current, obj.target, obj.isInverse);
  
  if (obj.isFixed) {
    if (obj.isNumeric) return parseFloat(obj.current) >= obj.target;
    else return pct >= 100;
  } else {
    // Vérifie si le premier palier est atteint
    if (obj.paliers && obj.paliers[0]) {
      if (obj.isNumeric) return parseFloat(obj.current) >= obj.paliers[0].threshold;
      else return pct >= obj.paliers[0].threshold;
    }
  }
  return false;
}
