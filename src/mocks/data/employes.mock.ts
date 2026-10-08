import type { Employe } from '../../app/products/workspace/modules/employes/models/employe.model';

const NOMS: Array<[string, string]> = [
  ['Diop', 'Awa'], ['Ndiaye', 'Moussa'], ['Fall', 'Aminata'], ['Sow', 'Cheikh'], ['Ba', 'Fatou'], ['Sarr', 'Ibrahima'],
  ['Gueye', 'Khady'], ['Diallo', 'Absatou'], ['Faye', 'Mamadou'], ['Thiam', 'Seynabou'], ['Sy', 'Ousmane'], ['Cissé', 'Mariama'],
  ['Mbaye', 'Pape'], ['Kane', 'Ndeye'], ['Niang', 'Abdoulaye'], ['Seck', 'Rokhaya'], ['Camara', 'Alioune'], ['Dione', 'Coumba'],
  ['Lô', 'Samba'], ['Wade', 'Astou'], ['Badji', 'Lamine'], ['Mendy', 'Sophie'], ['Toure', 'Boubacar'],
];
const POSTES: Array<[string, string]> = [
  ['Développeur Angular', 'Technologie'], ['Chargée de recrutement', 'Ressources humaines'], ['Comptable', 'Finance'],
  ['Chef de projet', 'Technologie'], ['Gestionnaire de paie', 'Ressources humaines'], ['Designer UX', 'Produit'],
  ['Analyste financier', 'Finance'], ['Responsable formation', 'Ressources humaines'],
];

/** Employés fictifs, partagés par tous les produits (Workspace, Perf, Job…). Ne jamais en inventer d'autres localement. */
export const EMPLOYES: Employe[] = NOMS.map(([nom, prenom], i) => ({
  id: String(i + 1),
  matricule: `EMP-${String(1001 + i)}`,
  nom,
  prenom,
  email: `${prenom}.${nom}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + '@socium.link',
  poste: POSTES[i % POSTES.length][0],
  departement: POSTES[i % POSTES.length][1],
  statut: i % 7 === 3 ? 'Inactif' : 'Actif',
  dateEntree: `${2018 + (i % 7)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
}));
