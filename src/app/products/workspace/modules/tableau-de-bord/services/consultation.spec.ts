import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { POPULATIONS } from '../../../../../../mocks/data/populations.mock';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { employesDuPerimetre, tableauxAccessibles } from './consultation';

describe('consultation', () => {
  const absatou = EMPLOYES.find((e) => e.email === 'absatou.diallo@socium.link')!;

  it('admin RH : tous les tableaux actifs, jamais les inactifs ni les archivés', () => {
    expect(tableauxAccessibles(TABLEAUX_DE_BORD, POPULATIONS, 'admin-rh', absatou, EMPLOYES).map((t) => t.id)).toEqual(['tdb-1', 'tdb-3']);
  });

  it('manager : seulement les tableaux actifs dont la population le couvre', () => {
    // Absatou Diallo : RH, Paris, France → couverte par « Filiales hors Sénégal », pas par « Équipe Sénégal ».
    expect(tableauxAccessibles(TABLEAUX_DE_BORD, POPULATIONS, 'manager', absatou, EMPLOYES).map((t) => t.id)).toEqual(['tdb-3']);
    expect(tableauxAccessibles(TABLEAUX_DE_BORD, POPULATIONS, 'manager', undefined, EMPLOYES)).toEqual([]);
  });

  it('périmètre : une filiale ou toutes (vue consolidée)', () => {
    expect(employesDuPerimetre(EMPLOYES, 'France').every((e) => e.filiale === 'France')).toBeTrue();
    expect(employesDuPerimetre(EMPLOYES, null).length).toBe(EMPLOYES.length);
  });
});
