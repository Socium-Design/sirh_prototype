import type { Employe, Sexe } from '../../app/products/workspace/modules/employes/models/employe.model';

const NOMS: Array<[string, string, Sexe]> = [
  ['Diop', 'Awa', 'Femme'], ['Ndiaye', 'Moussa', 'Homme'], ['Fall', 'Aminata', 'Femme'], ['Sow', 'Cheikh', 'Homme'],
  ['Ba', 'Fatou', 'Femme'], ['Sarr', 'Ibrahima', 'Homme'], ['Gueye', 'Khady', 'Femme'], ['Diallo', 'Absatou', 'Femme'],
  ['Faye', 'Mamadou', 'Homme'], ['Thiam', 'Seynabou', 'Femme'], ['Sy', 'Ousmane', 'Homme'], ['Cissé', 'Mariama', 'Femme'],
  ['Mbaye', 'Pape', 'Homme'], ['Kane', 'Ndeye', 'Femme'], ['Niang', 'Abdoulaye', 'Homme'], ['Seck', 'Rokhaya', 'Femme'],
  ['Camara', 'Alioune', 'Homme'], ['Dione', 'Coumba', 'Femme'], ['Lô', 'Samba', 'Homme'], ['Wade', 'Astou', 'Femme'],
  ['Badji', 'Lamine', 'Homme'], ['Mendy', 'Sophie', 'Femme'], ['Toure', 'Boubacar', 'Homme'],
];
const POSTES: Array<[string, string]> = [
  ['Développeur Angular', 'Technologie'], ['Chargée de recrutement', 'Ressources humaines'], ['Comptable', 'Finance'],
  ['Chef de projet', 'Technologie'], ['Gestionnaire de paie', 'Ressources humaines'], ['Designer UX', 'Produit'],
  ['Analyste financier', 'Finance'], ['Responsable formation', 'Ressources humaines'],
];
const STRUCTURES: Record<string, string> = {
  Technologie: "Direction des systèmes d'information",
  Produit: "Direction des systèmes d'information",
  'Ressources humaines': 'Direction des ressources humaines',
  Finance: 'Direction administrative et financière',
};
/** Site → filiale (les filiales reprennent les entreprises de `session.mock.ts`). */
const SITES: Array<[string, string]> = [['Dakar', 'Sénégal'], ['Thiès', 'Sénégal'], ['Abidjan', "Côte d'Ivoire"], ['Paris', 'France']];
const CONTRATS = ['CDI', 'CDI', 'CDD', 'CDI', 'Stage', 'CDI', 'Prestataire'];

/** Date de référence des données fictives (calcul de l'ancienneté). */
export const DATE_DONNEES = '2026-10-09';

/** Tranche d'ancienneté à la date des données. */
export function trancheAnciennete(dateEntree: string, reference = DATE_DONNEES): string {
  const annees = (new Date(reference).getTime() - new Date(dateEntree).getTime()) / (365.25 * 24 * 3600 * 1000);
  if (annees < 1) return "Moins d'1 an";
  if (annees < 3) return '1 à 3 ans';
  if (annees < 5) return '3 à 5 ans';
  return 'Plus de 5 ans';
}

/** Employés fictifs, partagés par tous les produits (Workspace, Perf, Job…). Ne jamais en inventer d'autres localement. */
export const EMPLOYES: Employe[] = NOMS.map(([nom, prenom, sexe], i) => {
  const dateEntree = `${2018 + (i % 7)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`;
  return {
    id: String(i + 1),
    matricule: `EMP-${String(1001 + i)}`,
    nom,
    prenom,
    email: `${prenom}.${nom}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + '@socium.link',
    poste: POSTES[i % POSTES.length][0],
    departement: POSTES[i % POSTES.length][1],
    structure: STRUCTURES[POSTES[i % POSTES.length][1]],
    site: SITES[i % SITES.length][0],
    filiale: SITES[i % SITES.length][1],
    statut: i % 7 === 3 ? 'Inactif' : 'Actif',
    typeContrat: CONTRATS[i % CONTRATS.length],
    sexe,
    dateEntree,
    anciennete: trancheAnciennete(dateEntree),
  };
});
