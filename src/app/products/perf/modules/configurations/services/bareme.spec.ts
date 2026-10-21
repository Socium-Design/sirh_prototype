import { DEFINITIONS_NOTES } from '../../../../../../mocks/data/baremes-notes.mock';
import type { BaremeNote } from '../models/bareme.model';
import { baremeValide, erreurDenominateur, estDesactive, formaterDateModification, maintenantIsoLocal, noteSurBareme } from './bareme';

describe('Barèmes des notes', () => {
  const definition = (id: string) => DEFINITIONS_NOTES.find((d) => d.id === id)!;
  const bareme = (changes: Partial<BaremeNote> = {}): BaremeNote => ({
    id: 'objectif', actif: true, denominateur: 20, decimales: 2, appliquerAuxFinalisees: false, ...changes,
  });

  describe('pourcentage → barème', () => {
    it('82 % sur 20 avec 2 décimales = « 16,40 » (virgule décimale)', () => {
      expect(noteSurBareme(82, 20, 2)).toBe('16,40');
    });

    it('respecte le nombre de décimales, arrondi au plus proche', () => {
      expect(noteSurBareme(82, 20, 0)).toBe('16');
      expect(noteSurBareme(82, 20, 1)).toBe('16,4');
      expect(noteSurBareme(73.4, 5, 2)).toBe('3,67');
      expect(noteSurBareme(73.4, 5, 1)).toBe('3,7');
      expect(noteSurBareme(82, 100, 2)).toBe('82,00');
      expect(noteSurBareme(0, 20, 2)).toBe('0,00');
      expect(noteSurBareme(100, 1000, 0)).toBe((1000).toLocaleString('fr-FR'));
    });
  });

  describe('validation du dénominateur', () => {
    it('accepte un entier de 1 à 1000', () => {
      for (const v of [1, 5, 20, 999, 1000]) expect(erreurDenominateur(v)).withContext(`${v}`).toBeNull();
    });

    it('refuse vide, 0, négatif, décimal et au-delà de 1000', () => {
      expect(erreurDenominateur(null)).toBe('Le dénominateur est obligatoire.');
      expect(erreurDenominateur(Number.NaN)).toBe('Le dénominateur est obligatoire.');
      for (const v of [0, -5, 2.5, 1001]) expect(erreurDenominateur(v)).withContext(`${v}`).toBe('Saisissez un entier entre 1 et 1000.');
    });
  });

  describe('cartes désactivées', () => {
    it('seules les notes objectif et compétence, interrupteur coupé, sont désactivées', () => {
      expect(estDesactive(definition('objectif'), bareme({ actif: false }))).toBeTrue();
      expect(estDesactive(definition('competence'), bareme({ id: 'competence', actif: false }))).toBeTrue();
      expect(estDesactive(definition('objectif'), bareme({ actif: true }))).toBeFalse();
      // « Visible sur l'évaluation » coupé : la carte reste modifiable.
      expect(estDesactive(definition('finale'), bareme({ id: 'finale', actif: false }))).toBeFalse();
    });

    it('une carte désactivée n’est pas validée, une carte active l’est', () => {
      expect(baremeValide(definition('objectif'), bareme({ actif: false, denominateur: null }))).toBeTrue();
      expect(baremeValide(definition('objectif'), bareme({ actif: true, denominateur: null }))).toBeFalse();
      expect(baremeValide(definition('finale'), bareme({ id: 'finale', actif: false, denominateur: 0 }))).toBeFalse();
    });

    it('les barèmes objectif et compétence ont une mention « affichés sur 100 »', () => {
      expect(definition('objectif').mentionDesactive).toBe('Barème désactivé : objectifs affichés sur 100');
      expect(definition('competence').mentionDesactive).toBe('Barème désactivé : compétences affichées sur 100');
    });
  });

  it('dates de dernière modification', () => {
    expect(formaterDateModification('2026-08-20T11:00')).toBe('20/08/2026 11:00');
    expect(maintenantIsoLocal(new Date(2026, 9, 21, 9, 5))).toBe('2026-10-21T09:05');
  });
});
