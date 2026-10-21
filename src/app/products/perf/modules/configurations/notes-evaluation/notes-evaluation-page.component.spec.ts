import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotesEvaluationPageComponent } from './notes-evaluation-page.component';

describe('NotesEvaluationPageComponent', () => {
  let fixture: ComponentFixture<NotesEvaluationPageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const carte = (note: string) => el().querySelector(`[data-note="${note}"]`) as HTMLElement;
  const texte = (e: Element | null) => e?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const apercu = (note: string) => texte(carte(note).querySelector('[data-testid="apercu"]'));
  const champ = (note: string) => carte(note).querySelector('[data-testid="denominateur"] input') as HTMLInputElement;
  const chip = (note: string, n: number) =>
    [...carte(note).querySelectorAll('soc-selectable-chips button')].find((b) => b.textContent?.trim() === `${n}`) as HTMLButtonElement;
  const interrupteur = (note: string) => carte(note).querySelector('[data-testid="interrupteur"] [role="switch"]') as HTMLButtonElement;
  const bouton = (id: string) => el().querySelector(`[data-testid="${id}"]`) as HTMLButtonElement;
  const saisir = (note: string, valeur: string) => {
    champ(note).value = valeur;
    champ(note).dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(NotesEvaluationPageComponent);
    fixture.detectChanges();
    tick(300); // le service simule 200 ms de latence réseau
    fixture.detectChanges();
  }));

  it('5 cartes « BARÈME » dans l’ordre, avec leur interrupteur et leur règle de calcul', () => {
    const cartes = [...el().querySelectorAll('soc-labs-settings-card[data-note]')];
    expect(cartes.map((c) => texte(c.querySelector('[data-region="title"]')))).toEqual([
      'Note finale', 'Note Potentiel', 'Note Performance', 'Note objectif', 'Note compétence',
    ]);
    expect(cartes.every((c) => texte(c.querySelector('[data-region="overline"]')) === 'BARÈME')).toBeTrue();
    expect(cartes.map((c) => texte(c.querySelector('[data-testid="interrupteur"]')))).toEqual([
      'Visible sur l’évaluation', 'Visible sur l’évaluation', 'Visible sur l’évaluation', 'Activer le barème', 'Activer le barème',
    ]);
    expect(texte(carte('objectif').querySelector('[data-testid="regle"]'))).toContain('Règle de calcul');
    expect(texte(carte('objectif').querySelector('[data-testid="regle"]'))).toContain('pondérée par le poids de chaque objectif');
    expect(texte(carte('objectif'))).toContain('Dénominateur de la note objectif');
    expect(texte(carte('competence'))).toContain('Dénominateur de la note compétence');
  });

  it('choix rapide 5 / 10 / 20 / 50 / 100, valeur enregistrée sélectionnée, aperçu « 16,40 / 20 »', () => {
    const choix = [...carte('finale').querySelectorAll('soc-selectable-chips button')];
    expect(choix.map((b) => b.textContent?.trim())).toEqual(['5', '10', '20', '50', '100']);
    expect(chip('finale', 20).getAttribute('aria-pressed')).toBe('true');
    expect(apercu('finale')).toBe('Un score évalué à 82 % s\'affichera : 16,40 / 20');
  });

  it('l’aperçu suit le choix rapide, la saisie et les décimales, en direct', () => {
    chip('finale', 10).click();
    fixture.detectChanges();
    expect(apercu('finale')).toContain('8,20 / 10');
    expect(chip('finale', 10).getAttribute('aria-pressed')).toBe('true');
    saisir('finale', '37');
    expect(apercu('finale')).toContain('30,34 / 37');
    expect(chip('finale', 10).getAttribute('aria-pressed')).toBe('false');
  });

  it('dénominateur hors bornes ou non entier : erreur, aperçu « — », Enregistrer désactivé', () => {
    for (const valeur of ['1001', '0', '-4', '2.5']) {
      saisir('finale', valeur);
      expect(texte(carte('finale'))).withContext(valeur).toContain('Saisissez un entier entre 1 et 1000.');
      expect(apercu('finale')).withContext(valeur).toContain('—');
      expect(bouton('enregistrer').disabled).withContext(valeur).toBeTrue();
    }
    saisir('finale', '');
    expect(texte(carte('finale'))).toContain('Le dénominateur est obligatoire.');
    saisir('finale', '1000');
    expect(bouton('enregistrer').disabled).toBeFalse();
  });

  it('notes objectif et compétence désactivées par défaut : grisées, inertes, « affichés sur 100 »', () => {
    for (const [note, mention] of [['objectif', 'objectifs affichés sur 100'], ['competence', 'compétences affichées sur 100']]) {
      expect(carte(note).querySelector('[data-region="body"]')!.hasAttribute('inert')).withContext(note).toBeTrue();
      expect(texte(carte(note).querySelector('[data-region="disabled-note"]'))).toBe(`Barème désactivé : ${mention}`);
      expect(interrupteur(note).getAttribute('aria-checked')).toBe('false');
    }
    for (const note of ['finale', 'potentiel', 'performance']) {
      expect(carte(note).querySelector('[data-region="body"]')!.hasAttribute('inert')).withContext(note).toBeFalse();
    }
  });

  it('« Activer le barème » rend la carte modifiable ; une carte désactivée n’est pas validée', () => {
    expect(bouton('enregistrer').disabled).toBeFalse();
    interrupteur('objectif').click();
    fixture.detectChanges();
    expect(carte('objectif').querySelector('[data-region="body"]')!.hasAttribute('inert')).toBeFalse();
    expect(carte('objectif').querySelector('[data-region="disabled-note"]')).toBeNull();
    expect(apercu('objectif')).toContain('4,1 / 5');
  });

  it('Enregistrer → « Enregistré ✓ » et date mise à jour ; une modification suivante rend « Enregistrer »', fakeAsync(() => {
    expect(texte(bouton('derniere-modification'))).toBe('Dernière modification par Admin Test Manu le 20/08/2026 11:00');
    chip('finale', 100).click();
    fixture.detectChanges();
    bouton('enregistrer').click();
    tick(300);
    fixture.detectChanges();
    expect(bouton('enregistrer').getAttribute('aria-label')).toBe('Enregistré ✓');
    expect(texte(bouton('derniere-modification'))).toMatch(/^Dernière modification par Absatou Diallo le \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(texte(bouton('derniere-modification'))).not.toContain('20/08/2026 11:00');
    chip('finale', 5).click();
    fixture.detectChanges();
    expect(texte(bouton('enregistrer'))).toBe('Enregistrer');
  }));

  it('Annuler restaure les dernières valeurs enregistrées', fakeAsync(() => {
    chip('finale', 50).click();
    interrupteur('objectif').click();
    fixture.detectChanges();
    bouton('enregistrer').click();
    tick(300);
    fixture.detectChanges();
    chip('finale', 5).click();
    interrupteur('objectif').click();
    saisir('potentiel', '7');
    bouton('annuler').click();
    fixture.detectChanges();
    expect(apercu('finale')).toContain('41,00 / 50');
    expect(interrupteur('objectif').getAttribute('aria-checked')).toBe('true');
    expect(apercu('potentiel')).toContain('16,40 / 20');
    expect(champ('potentiel').value).toBe('20');
  }));

  it('« Ce qui sera mis à jour automatiquement » : 3 lignes avec icône', () => {
    const bloc = el().querySelector('[data-testid="mises-a-jour"]')!;
    expect(texte(bloc.querySelector('[data-region="title"]'))).toBe('Ce qui sera mis à jour automatiquement');
    const lignes = [...bloc.querySelectorAll('li')];
    expect(lignes.length).toBe(3);
    expect(lignes.every((l) => !!l.querySelector('soc-labs-icon-tile svg'))).toBeTrue();
    expect(texte(lignes[0])).toBe("Résultats d'évaluation — Notes affichées aux managers, employés et RH sur toutes les campagnes, y compris archivées.");
    expect(texte(lignes[2])).toContain('Exports Excel / PDF — Tout nouvel export');
  });
});
