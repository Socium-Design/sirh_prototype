import { TestBed } from '@angular/core/testing';
import type { Objectif } from '../models/objectif.model';
import { OrganisationService } from './organisation.service';
import { equipe, progressionObjectif, resoudrePopulation, sousStructures, statutObjectif } from './objectifs-regles';

describe('Objectifs — règles', () => {
  let organisation: OrganisationService;
  const ids = (liste: Array<{ id: string }>) => liste.map((c) => c.id).sort((a, b) => Number(a) - Number(b));
  const population = (mode: 'personne' | 'structure' | 'poste', selection: string[]) =>
    resoudrePopulation({ mode, ids: selection }, organisation.collaborateurs(), organisation.structures());

  beforeEach(() => (organisation = TestBed.inject(OrganisationService)));

  describe('périmètre', () => {
    it("exclut le Service Contrôle de gestion (hors scope) : 20 collaborateurs visibles sur 23", () => {
      expect(organisation.tous().length).toBe(23);
      expect(organisation.collaborateurs().length).toBe(20);
      expect(ids(organisation.collaborateurs())).not.toContain('7');
      expect(organisation.collaborateurs().some((c) => c.structureId === 'daf-cdg')).toBeFalse();
    });

    it('calcule la ligne hiérarchique : N-1 seuls, ou N-1, N-2…', () => {
      expect(ids(equipe(organisation.collaborateurs(), '8', false))).toEqual(['2', '10', '16']);
      expect(ids(equipe(organisation.collaborateurs(), '8', true))).toEqual(['2', '10', '13', '16', '18']);
    });
  });

  describe('population — personne nommée', () => {
    it('retient les personnes choisies, jamais une personne hors périmètre', () => {
      expect(ids(population('personne', ['1', '7']))).toEqual(['1']);
    });

    it('ne cible personne sans sélection', () => {
      expect(population('personne', [])).toEqual([]);
    });
  });

  describe('population — structure', () => {
    it('inclut les sous-structures', () => {
      expect([...sousStructures(organisation.structures(), 'dsi')].sort()).toEqual(['dsi', 'dsi-dev', 'dsi-produit']);
      expect(ids(population('structure', ['dsi']))).toEqual(['1', '4', '6', '9', '12', '14', '17', '20', '22']);
    });

    it("n'ajoute pas les employés hors périmètre d'une structure partiellement visible", () => {
      expect(ids(population('structure', ['daf']))).toEqual(['3', '11', '19']);
    });

    it('cible une sous-structure seule, sans doublon quand on choisit aussi sa structure mère', () => {
      expect(ids(population('structure', ['drh-paie']))).toEqual(['5', '13', '21']);
      expect(population('structure', ['drh', 'drh-paie']).length).toBe(8);
    });
  });

  describe('population — poste', () => {
    it('cible les titulaires des postes choisis', () => {
      expect(ids(population('poste', ['comptable', 'gest-paie']))).toEqual(['3', '5', '11', '13', '19', '21']);
    });

    it('ne cible personne pour un poste vacant ou tenu uniquement hors périmètre', () => {
      expect(population('poste', ['architecte-cloud'])).toEqual([]);
      expect(population('poste', ['analyste-financier'])).toEqual([]);
    });
  });

  describe('statut et progression', () => {
    const base: Objectif = {
      id: 'x', titre: 'X', description: '', elementMesure: '', employeId: '1', debut: '2026-01-01', fin: '2026-12-31', type: 'QUALITATIVE',
      progression: 60, ponderation: 1, aEvaluer: true, origine: 'Objectif libre', etat: 'actif', historique: [],
    };

    it('déduit le statut de la période', () => {
      expect(statutObjectif(base, '2026-10-09')).toBe('En cours');
      expect(statutObjectif({ debut: '2026-01-01', fin: '2026-03-31' }, '2026-10-09')).toBe('Passé');
      expect(statutObjectif({ debut: '2026-11-01', fin: '2026-12-31' }, '2026-10-09')).toBe('À venir');
    });

    it('calcule la progression : saisie, quantitative (peut dépasser 100), ou moyenne pondérée des sous-objectifs', () => {
      expect(progressionObjectif(base)).toBe(60);
      expect(progressionObjectif({ ...base, type: 'QUANTITATIVE', valeurCible: 30, valeurCourante: 47.21 })).toBe(157.37);
      const enfants = [{ ...base, progression: 100, ponderation: 1 }, { ...base, progression: 0, ponderation: 2 }];
      expect(progressionObjectif(base, enfants)).toBe(33.33);
    });
  });
});
