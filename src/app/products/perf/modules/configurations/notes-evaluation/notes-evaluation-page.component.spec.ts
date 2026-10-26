import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
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
  const ouverte = (note: string) => carte(note).getAttribute('data-expanded') === 'true';
  const resume = (note: string) => texte(carte(note).querySelector('[data-region="summary"]'));
  const badge = (note: string) => texte(carte(note).querySelector('[data-region="badge"]'));
  const chevron = (note: string) => carte(note).querySelector('[data-region="toggle"]') as HTMLButtonElement;
  const deplier = (note: string) => {
    chevron(note).click();
    fixture.detectChanges();
  };
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

  /** Les cartes sont fermées à l'arrivée : la plupart des tests travaillent cartes ouvertes. */
  const toutDeplier = () => {
    bouton('tout-deplier').click();
    fixture.detectChanges();
  };

  it('5 cartes « BARÈME » dans l’ordre, avec leur interrupteur et leur règle de calcul', () => {
    const cartes = [...el().querySelectorAll('soc-labs-settings-card[data-note]')];
    expect(cartes.map((c) => texte(c.querySelector('[data-region="title"]')))).toEqual([
      'Note finale', 'Note Potentiel', 'Note Performance', 'Note objectif', 'Note compétence',
    ]);
    expect(cartes.every((c) => texte(c.querySelector('[data-region="overline"]')) === 'BARÈME')).toBeTrue();
    expect(cartes.map((c) => texte(c.querySelector('[data-testid="interrupteur"]')))).toEqual([
      'Visible sur l’évaluation', "Visible par l'évalué", 'Visible sur l’évaluation', 'Activer le barème', 'Activer le barème',
    ]);
    expect(texte(carte('objectif').querySelector('[data-testid="regle"]'))).toContain('Règle de calcul');
  });

  it('règle de calcul des barèmes objectif et compétence : seulement la note de l’en-tête de section, notes individuelles inchangées', () => {
    expect(texte(carte('objectif').querySelector('[data-testid="regle"] p:last-child'))).toBe(
      'S’applique uniquement à la note affichée dans l’en-tête de la section Objectifs : la moyenne des objectifs et sous-objectifs de la section, pondérée par le poids de chaque objectif. Les notes de chaque objectif ne changent pas : un objectif qualitatif garde le dénominateur de ses paliers.',
    );
    expect(texte(carte('competence').querySelector('[data-testid="regle"] p:last-child'))).toBe(
      'S’applique uniquement à la note affichée dans l’en-tête de la section Compétences : la moyenne simple des compétences de la fiche de poste, hors compétences additionnelles. Les notes de chaque compétence ne changent pas.',
    );
  });

  it('cartes objectif et compétence : libellé du dénominateur', () => {
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
    toutDeplier();
    chip('finale', 10).click();
    fixture.detectChanges();
    expect(apercu('finale')).toContain('8,20 / 10');
    expect(chip('finale', 10).getAttribute('aria-pressed')).toBe('true');
    saisir('finale', '37');
    expect(apercu('finale')).toContain('30,34 / 37');
    expect(chip('finale', 10).getAttribute('aria-pressed')).toBe('false');
  });

  it('dénominateur hors bornes ou non entier : erreur, aperçu « — », Enregistrer désactivé', () => {
    toutDeplier();
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
    toutDeplier();
    expect(bouton('enregistrer').disabled).toBeFalse();
    interrupteur('objectif').click();
    fixture.detectChanges();
    expect(carte('objectif').querySelector('[data-region="body"]')!.hasAttribute('inert')).toBeFalse();
    expect(carte('objectif').querySelector('[data-region="disabled-note"]')).toBeNull();
    expect(apercu('objectif')).toContain('4,1 / 5');
  });

  it('Enregistrer → « Enregistré ✓ » et date mise à jour ; une modification suivante rend « Enregistrer »', fakeAsync(() => {
    toutDeplier();
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
    toutDeplier();
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

  describe('accordéon', () => {
    it('5 cartes repliables, toutes fermées à l’arrivée, avec le résumé du réglage', () => {
      const notes = ['finale', 'potentiel', 'performance', 'objectif', 'competence'];
      expect(notes.every((n) => !ouverte(n))).toBeTrue();
      expect(resume('finale')).toBe('/20 · 2 décimales · appliqué aux nouvelles évaluations uniquement');
      expect(resume('objectif')).toBe('Barème désactivé : affichage sur 100');
      expect(resume('competence')).toBe('Barème désactivé : affichage sur 100');
      expect(chevron('finale').getAttribute('aria-expanded')).toBe('false');
    });

    it('plusieurs cartes ouvertes à la fois ; le résumé suit le réglage', () => {
      deplier('finale');
      deplier('potentiel');
      expect(ouverte('finale') && ouverte('potentiel')).toBeTrue();
      chip('finale', 10).click();
      (carte('finale').querySelector('[data-testid="finalisees"] [role="switch"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      deplier('finale');
      expect(ouverte('finale')).toBeFalse();
      expect(resume('finale')).toBe('/10 · 2 décimales · appliqué aux évaluations finalisées');
    });

    it('« Tout déplier » puis « Tout replier »', () => {
      expect(texte(bouton('tout-deplier'))).toBe('Tout déplier');
      toutDeplier();
      expect(['finale', 'potentiel', 'performance', 'objectif', 'competence'].every(ouverte)).toBeTrue();
      expect(texte(bouton('tout-deplier'))).toBe('Tout replier');
      toutDeplier();
      expect(ouverte('finale')).toBeFalse();
      expect(texte(bouton('tout-deplier'))).toBe('Tout déplier');
    });

    it('l’interrupteur d’en-tête fonctionne carte fermée, sans la déplier', () => {
      interrupteur('objectif').click();
      fixture.detectChanges();
      expect(interrupteur('objectif').getAttribute('aria-checked')).toBe('true');
      expect(ouverte('objectif')).toBeFalse();
      expect(resume('objectif')).toBe('/5 · 1 décimale · appliqué aux nouvelles évaluations uniquement');
    });

    it('badge « Modifié » sur la carte changée, retiré par Annuler', () => {
      expect(badge('finale')).toBe('');
      interrupteur('finale').click();
      fixture.detectChanges();
      expect(badge('finale')).toBe('Modifié');
      expect(badge('potentiel')).toBe('');
      bouton('annuler').click();
      fixture.detectChanges();
      expect(badge('finale')).toBe('');
    });

    it('badge « Modifié » retiré par Enregistrer', fakeAsync(() => {
      interrupteur('performance').click();
      fixture.detectChanges();
      expect(badge('performance')).toBe('Modifié');
      bouton('enregistrer').click();
      tick(300);
      fixture.detectChanges();
      expect(badge('performance')).toBe('');
    }));

    it('valeur invalide : carte ouverte, badge « Erreur », impossible à refermer tant que l’erreur reste', () => {
      deplier('finale');
      saisir('finale', '0');
      expect(badge('finale')).toBe('Erreur');
      expect(chevron('finale').getAttribute('aria-disabled')).toBe('true');
      deplier('finale');
      expect(ouverte('finale')).toBeTrue();
      toutDeplier(); // « Tout replier » n'y peut rien non plus
      toutDeplier();
      expect(ouverte('finale')).toBeTrue();
      saisir('finale', '20');
      expect(badge('finale')).toBe('');
      deplier('finale');
      expect(ouverte('finale')).toBeFalse();
    });
  });

  describe('« Ce qui sera mis à jour » dans chaque carte', () => {
    const zone = (note: string) => carte(note).querySelector('[data-testid="impact"]') as HTMLElement;
    const boutonZone = (note: string) => zone(note).querySelector('button') as HTMLButtonElement;
    const lignes = (note: string) => [...zone(note).querySelectorAll('li')].map(texte);
    const ouvrirZone = (note: string) => {
      boutonZone(note).click();
      fixture.detectChanges();
    };

    it('plus de bloc autonome en bas de page', () => {
      expect(el().querySelector('[data-testid="mises-a-jour"]')).toBeNull();
      expect(texte(el())).not.toContain('Ce qui sera mis à jour automatiquement');
    });

    it('une zone par carte, sous la règle de calcul, fermée par défaut (bouton aria-expanded)', () => {
      toutDeplier();
      for (const note of ['finale', 'potentiel', 'performance', 'objectif', 'competence']) {
        const details = carte(note).querySelector('[data-region="details"]')!;
        expect(details.contains(zone(note))).withContext(note).toBeTrue();
        expect(carte(note).querySelector('[data-region="footnote"]')!.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(texte(boutonZone(note))).toBe('Ce qui sera mis à jour');
        expect(boutonZone(note).getAttribute('aria-expanded')).withContext(note).toBe('false');
        expect(zone(note).querySelector('li')).toBeNull();
      }
    });

    it('Note finale : les 3 lignes de l’ancien bloc, avec icône', () => {
      toutDeplier();
      ouvrirZone('finale');
      expect(boutonZone('finale').getAttribute('aria-expanded')).toBe('true');
      expect(lignes('finale')).toEqual([
        "Résultats d'évaluation — Notes affichées aux managers, employés et RH sur toutes les campagnes, y compris archivées.",
        "Tableaux de bord & KPI — Moyennes, comparatifs et graphiques recalculés sur la nouvelle échelle au moment de l'affichage.",
        'Exports Excel / PDF — Tout nouvel export utilise le dénominateur en vigueur au moment de la génération.',
      ]);
      expect([...zone('finale').querySelectorAll('li')].every((l) => !!l.querySelector('soc-labs-icon-tile svg'))).toBeTrue();
    });

    it('Note Performance, Note objectif, Note compétence', () => {
      toutDeplier();
      ouvrirZone('performance');
      expect(lignes('performance')).toEqual([
        "Résultats d'évaluation — Note Performance affichée aux managers, employés et RH",
        'Matrice 9-box — Axe Performance',
        'Exports Excel / PDF',
      ]);
      // Carte désactivée : la zone reste lisible et utilisable (hors du corps grisé).
      expect(zone('objectif').closest('[inert]')).toBeNull();
      ouvrirZone('objectif');
      expect(lignes('objectif')).toEqual([
        'En-tête de la section Objectifs — moyenne affichée dans ce barème',
        'Exports Excel / PDF — en-têtes de section',
      ]);
      ouvrirZone('competence');
      expect(lignes('competence')).toEqual([
        'En-tête de la section Compétences — moyenne affichée dans ce barème',
        'Exports Excel / PDF — en-têtes de section',
      ]);
    });
  });

  describe('confidentialité du potentiel (flag actif par défaut)', () => {
    const zone = () => carte('potentiel').querySelector('[data-testid="impact"]') as HTMLElement;
    const boutonZone = () => zone().querySelector('button') as HTMLButtonElement;
    const message = () => carte('potentiel').querySelector('[data-testid="message-confidentialite"]');
    const lignes = () => [...zone().querySelectorAll('li')].map(texte);
    const LIGNES_MASQUE = [
      'Question de type potentiel dans le formulaire',
      'En-tête et barre latérale des sections contenant du potentiel (moyenne)',
      'Écran de soumission',
      "Carte Note Potentiel du détail de l'évaluation",
      'Colonne Potentiel du profil employé',
      'Historique de la 9-box',
      'Grille 9-box (repère non placé)',
      "PDF de l'évaluation",
      'Export Excel (tiret « – »)',
    ];

    it('carte Potentiel masquée pour l’évalué par défaut, tag « Confidentialité du potentiel », résumé « Masquée pour l’évalué »', () => {
      expect(interrupteur('potentiel').getAttribute('aria-checked')).toBe('false');
      expect(texte(carte('potentiel').querySelector('[data-region="tags"]'))).toBe('Confidentialité du potentiel');
      expect(resume('potentiel')).toBe("Masquée pour l'évalué · /20 · 2 décimales");
      expect(el().querySelectorAll('[data-region="tags"]').length).toBe(1);
    });

    it('désactivée : barème toujours modifiable, message pour managers et RH', () => {
      deplier('potentiel');
      expect(carte('potentiel').querySelector('[data-region="body"]')!.hasAttribute('inert')).toBeFalse();
      expect(texte(message())).toBe("Les managers et les RH continuent de voir cette note. L'évalué voit un cadenas à la place.");
      chip('potentiel', 10).click();
      fixture.detectChanges();
      expect(apercu('potentiel')).toContain('8,20 / 10');
      expect(resume('potentiel')).toBe('');
      deplier('potentiel');
      expect(resume('potentiel')).toBe("Masquée pour l'évalué · /10 · 2 décimales");
    });

    it('zone : liste « Masqué pour l’évalué » (cadenas) puis la portée', () => {
      deplier('potentiel');
      boutonZone().click();
      fixture.detectChanges();
      expect(texte(zone().querySelector('[data-testid="impact-masque"]'))).toBe("Masqué pour l'évalué");
      expect(zone().querySelector('[data-testid="impact-masque"] svg')).not.toBeNull();
      expect(lignes()).toEqual(LIGNES_MASQUE);
      expect(texte(zone())).toContain("S'applique à toutes les évaluations, passées comprises.");
    });

    it('activée : message absent, zone « Note Potentiel affichée … », résumé habituel', () => {
      interrupteur('potentiel').click();
      fixture.detectChanges();
      expect(resume('potentiel')).toBe('/20 · 2 décimales · appliqué aux nouvelles évaluations uniquement');
      deplier('potentiel');
      expect(message()).toBeNull();
      boutonZone().click();
      fixture.detectChanges();
      expect(zone().querySelector('[data-testid="impact-masque"]')).toBeNull();
      expect(lignes()).toEqual([
        "Résultats d'évaluation — Note Potentiel affichée aux managers, employés et RH",
        'Matrice 9-box — Axe Potentiel',
        'Exports Excel / PDF',
      ]);
    });

    it('désactiver l’interrupteur ouvre la carte et la zone pour montrer l’impact', () => {
      interrupteur('potentiel').click(); // activée
      fixture.detectChanges();
      expect(ouverte('potentiel')).toBeFalse();
      expect(boutonZone().getAttribute('aria-expanded')).toBe('false');
      interrupteur('potentiel').click(); // désactivée
      fixture.detectChanges();
      expect(ouverte('potentiel')).toBeTrue();
      expect(boutonZone().getAttribute('aria-expanded')).toBe('true');
      expect(lignes()).toEqual(LIGNES_MASQUE);
    });

    it('les autres interrupteurs n’ouvrent pas la zone', () => {
      toutDeplier();
      interrupteur('finale').click();
      fixture.detectChanges();
      const boutonFinale = carte('finale').querySelector('[data-testid="impact"] button')!;
      expect(boutonFinale.getAttribute('aria-expanded')).toBe('false');
    });
  });
});

describe('NotesEvaluationPageComponent — flag « Confidentialité du potentiel » inactif', () => {
  let fixture: ComponentFixture<NotesEvaluationPageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const carte = () => el().querySelector('[data-note="potentiel"]') as HTMLElement;
  const texte = (e: Element | null) => e?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const interrupteur = () => carte().querySelector('[data-testid="interrupteur"] [role="switch"]') as HTMLButtonElement;
  const resume = () => texte(carte().querySelector('[data-region="summary"]'));
  const zone = () => carte().querySelector('[data-testid="impact"]') as HTMLElement;
  const LIGNES_ACTIVE = [
    "Résultats d'évaluation — Note Potentiel affichée aux managers, employés et RH",
    'Matrice 9-box — Axe Potentiel',
    'Exports Excel / PDF',
  ];

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: FeatureFlagsService, useValue: { actif: () => false, libelle: () => 'Confidentialité du potentiel' } }],
    });
    fixture = TestBed.createComponent(NotesEvaluationPageComponent);
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  }));

  it('ancien comportement : « Visible sur l’évaluation », activée par défaut, sans tag, résumé habituel', () => {
    expect(texte(carte().querySelector('[data-testid="interrupteur"]'))).toBe('Visible sur l’évaluation');
    expect(texte(el())).not.toContain("Visible par l'évalué");
    expect(interrupteur().getAttribute('aria-checked')).toBe('true');
    expect(carte().querySelector('[data-region="tags"]')).toBeNull();
    expect(resume()).toBe('/20 · 2 décimales · appliqué aux nouvelles évaluations uniquement');
  });

  it('interrupteur coupé : ni message, ni « Masquée pour l’évalué », ni cadenas ; la zone garde le contenu « activé » et reste fermée', () => {
    interrupteur().click();
    fixture.detectChanges();
    expect(interrupteur().getAttribute('aria-checked')).toBe('false');
    expect(resume()).toBe('/20 · 2 décimales · appliqué aux nouvelles évaluations uniquement');
    expect(carte().getAttribute('data-expanded')).toBe('false');
    expect(zone().querySelector('button')!.getAttribute('aria-expanded')).toBe('false');
    (carte().querySelector('[data-region="toggle"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(carte().querySelector('[data-testid="message-confidentialite"]')).toBeNull();
    zone().querySelector('button')!.click();
    fixture.detectChanges();
    expect(zone().querySelector('[data-testid="impact-masque"]')).toBeNull();
    expect([...zone().querySelectorAll('li')].map(texte)).toEqual(LIGNES_ACTIVE);
    expect(texte(zone())).not.toContain("S'applique à toutes les évaluations");
  });
});
