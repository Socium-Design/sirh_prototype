import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { FILTRES_GLOBAUX_PAR_DEFAUT, appliquerFiltresGlobaux, filtresEnConflit, filtresGlobauxParDefaut } from './filtres-globaux';

describe('filtres globaux', () => {
  it('par défaut : employés sortis et comptes désactivés exclus', () => {
    const retenus = appliquerFiltresGlobaux(EMPLOYES, FILTRES_GLOBAUX_PAR_DEFAUT);
    expect(retenus.length).toBe(18);
    expect(retenus.every((e) => e.statut === 'Actif' && e.statutCompte === 'Actif')).toBeTrue();
  });

  it('ET entre filtres, OU entre les valeurs cochées ; aucune valeur cochée = personne', () => {
    const tous = { ...filtresGlobauxParDefaut(), statutEmploye: ['Actif', 'Sorti'] as ('Actif' | 'Sorti')[], statutCompte: ['Actif', 'Désactivé'] as ('Actif' | 'Désactivé')[] };
    expect(appliquerFiltresGlobaux(EMPLOYES, tous).length).toBe(EMPLOYES.length);
    expect(appliquerFiltresGlobaux(EMPLOYES, { ...tous, statutEmploye: ['Sorti'] }).every((e) => e.statut === 'Inactif')).toBeTrue();
    expect(appliquerFiltresGlobaux(EMPLOYES, { ...tous, compteConfigure: ['Non'] }).every((e) => !e.compteConfigure)).toBeTrue();
    expect(appliquerFiltresGlobaux(EMPLOYES, { ...tous, statutPaie: ['Suspendu'] }).every((e) => e.statutPaie === 'Suspendu')).toBeTrue();
    expect(appliquerFiltresGlobaux(EMPLOYES, { ...tous, statutPaie: [] })).toEqual([]);
  });

  it('conflit : un filtre de carte « Statut » exclu par le statut de l’employé', () => {
    const defaut = filtresGlobauxParDefaut();
    expect(filtresEnConflit(['statut:Actif', 'statut:Inactif', 'site:Dakar'], defaut)).toEqual(['statut:Inactif']);
    expect(filtresEnConflit(['statut:Inactif'], { ...defaut, statutEmploye: ['Actif', 'Sorti'] })).toEqual([]);
    expect(filtresEnConflit(['statut:Actif'], { ...defaut, statutEmploye: ['Sorti'] })).toEqual(['statut:Actif']);
  });

  it('les valeurs par défaut sont copiées à chaque appel', () => {
    const a = filtresGlobauxParDefaut();
    a.statutEmploye.push('Sorti');
    expect(FILTRES_GLOBAUX_PAR_DEFAUT.statutEmploye).toEqual(['Actif']);
  });
});
