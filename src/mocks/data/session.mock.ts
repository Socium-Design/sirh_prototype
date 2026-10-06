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

export const SESSION_ENTERPRISES = [
  { value: 'sn', company: 'Socium Enterprises', subsidiary: 'Sénégal', count: '1/12' },
  { value: 'ci', company: 'Socium Enterprises', subsidiary: "Côte d'Ivoire", count: '2/12' },
  { value: 'fr', company: 'Socium Enterprises', subsidiary: 'France', count: '3/12' },
];

export const SESSION_LANGUAGES = [
  { value: 'fr', label: 'FR' },
  { value: 'en', label: 'EN' },
];
