/** Utilisateur connecté, entreprises et langues du prototype (données fictives partagées par tous les produits). */
export interface SessionUserMock {
  name: string;
  email: string;
  avatarLabel: string;
}

export const SESSION_USER: SessionUserMock = {
  name: 'Absatou Diallo',
  email: 'absatou.diallo@socium.link',
  avatarLabel: 'AD',
};

/** Valeur de l'entreprise « vue consolidée » : toutes les filiales du groupe (holding). */
export const VUE_CONSOLIDEE = 'groupe';

/** Filiales accessibles à l'utilisateur (le libellé `subsidiary` est celui de la filiale des employés) + vue consolidée. */
export const SESSION_ENTERPRISES = [
  { value: 'sn', company: 'Socium Enterprises', subsidiary: 'Sénégal', count: '1/12' },
  { value: 'ci', company: 'Socium Enterprises', subsidiary: "Côte d'Ivoire", count: '2/12' },
  { value: 'fr', company: 'Socium Enterprises', subsidiary: 'France', count: '3/12' },
  { value: VUE_CONSOLIDEE, company: 'Socium Enterprises', subsidiary: 'Vue consolidée', count: '3 filiales' },
];

export const SESSION_LANGUAGES = [
  { value: 'fr', label: 'FR' },
  { value: 'en', label: 'EN' },
];
