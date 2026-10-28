import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OptionsEntreprisePageComponent } from './options-entreprise-page.component';

describe('OptionsEntreprisePageComponent', () => {
  let fixture: ComponentFixture<OptionsEntreprisePageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const ligne = (id: string) => el().querySelector(`[data-option="${id}"]`) as HTMLElement;
  const interrupteur = (id: string) => ligne(id).querySelector(':scope > [data-part="row"] [role="switch"]') as HTMLButtonElement;
  const barre = () => el().querySelector('soc-labs-changes-bar [data-part="message"]')!.textContent!.trim();
  const groupes = () => [...el().querySelectorAll('[data-produit]')].map((g) => g.getAttribute('data-produit'));
  const lignes = () => el().querySelectorAll('soc-labs-option-row').length;
  const nav = (label: string) =>
    [...el().querySelectorAll('soc-labs-nav-list button')].find((b) => b.textContent!.includes(label)) as HTMLButtonElement;
  const filtre = (label: string) =>
    [...el().querySelectorAll('[data-testid="filtres"] button')].find((b) => b.textContent!.trim() === label) as HTMLButtonElement;
  const rechercher = (q: string) => {
    const input = el().querySelector('[data-testid="recherche"] input') as HTMLInputElement;
    input.value = q;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };
  const detect = () => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  };

  /** Ouvre la page de Teranga Logistique sur une variante (`?variante=…` ; absente = A). À appeler dans `fakeAsync`. */
  const creer = (variante?: string) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'ent-1' })),
            queryParamMap: of(convertToParamMap(variante ? { variante } : {})),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(OptionsEntreprisePageComponent);
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };
  const bouton = (root: Element, texte: string) =>
    [...root.querySelectorAll('button')].find((b) => b.textContent!.trim() === texte) as HTMLButtonElement;

  describe('variante par paramètre', () => {
    it('A par défaut (catalogue), B (offre) et Liste selon ?variante', fakeAsync(() => {
      creer();
      expect(el().querySelector('app-options-vue-catalogue')).not.toBeNull();
      expect(el().querySelector('[data-testid="variante"] [aria-checked="true"]')!.textContent!.trim()).toBe('A');
      TestBed.resetTestingModule();
      creer('b');
      expect(el().querySelector('app-options-vue-offre')).not.toBeNull();
      TestBed.resetTestingModule();
      creer('liste');
      expect(el().querySelector('app-options-vue-liste')).not.toBeNull();
      TestBed.resetTestingModule();
      creer('inconnue');
      expect(el().querySelector('app-options-vue-catalogue')).not.toBeNull();
    }));

    it('le sélecteur « Variante » change le paramètre de l’URL', fakeAsync(() => {
      creer();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const radios = [...el().querySelectorAll('[data-testid="variante"] [role="radio"]')] as HTMLElement[];
      expect(radios.map((r) => r.textContent!.trim())).toEqual(['A', 'B', 'Liste']);
      radios[1].click();
      expect(navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { variante: 'b' }, queryParamsHandling: 'merge' }));
    }));
  });

  describe('variante Liste', () => {
  beforeEach(fakeAsync(() => creer('liste')));

  it('en-tête : titre, entreprise, résumé, fil d’Ariane et dernière modification', () => {
    expect(el().querySelector('h1')!.textContent).toContain('Fonctionnalités et options');
    expect(el().textContent).toContain('Teranga Logistique');
    expect(el().textContent).toContain('13 options activées, dont 4 payantes');
    expect(el().querySelector('soc-breadcrumb')!.textContent).toContain('Entreprises');
    expect(el().querySelector('[data-testid="derniere-modification"]')!.textContent).toContain('Mariama Ndiaye le 14/10/2026');
  });

  it('compteurs « activées / total » par produit, « Tous les produits » en premier', () => {
    const items = [...el().querySelectorAll('soc-labs-nav-list button')].map((b) => b.querySelector('span')!.textContent!.trim());
    expect(items).toEqual(['Tous les produits', 'Workspace', 'Recrutement', 'Workflow', 'Performance', 'Doc', 'Payroll']);
    expect(nav('Tous les produits').querySelector('[data-part="count"]')!.textContent!.trim()).toBe('13 / 64');
    expect(nav('Workspace').querySelector('[data-part="count"]')!.textContent!.trim()).toBe('6 / 23');
    expect(nav('Workspace').textContent).toContain('6 activées sur 23');
  });

  it('navigation par produit : n’affiche que le groupe choisi', () => {
    expect(groupes()).toEqual(['workspace', 'recrutement', 'workflow', 'performance', 'doc', 'payroll']);
    nav('Payroll').click();
    fixture.detectChanges();
    expect(groupes()).toEqual(['payroll']);
    expect(nav('Payroll').getAttribute('aria-current')).toBe('true');
  });

  it('filtres rapides : Payantes, Customisations, Nouvelles, Activées', () => {
    filtre('Payantes').click();
    fixture.detectChanges();
    const tags = [...el().querySelectorAll('[data-part="tags"]')].map((t) => t.textContent!.trim());
    expect(tags.every((t) => t.includes('Payant'))).toBeTrue();
    filtre('Customisations').click();
    fixture.detectChanges();
    expect(lignes()).toBe(2);
    filtre('Nouvelles').click();
    fixture.detectChanges();
    expect([...el().querySelectorAll('[data-part="new"]')].length).toBe(3);
    expect(lignes()).toBe(3);
    filtre('Activées').click();
    fixture.detectChanges();
    expect(lignes()).toBe(13);
  });

  it('recherche dans le libellé et la description, sans accents ; état vide', () => {
    rechercher('habilitation');
    expect(lignes()).toBe(1);
    rechercher('organigramme');
    expect(ligne('workspace-organigramme')).not.toBeNull();
    rechercher("dates d'expiration");
    expect(ligne('performance-gestion-des-habilitations')).not.toBeNull();
    rechercher('etape materiel');
    expect(ligne('workspace-parcours-d-integration-onboarding--etape-materiel')).not.toBeNull();
    expect(ligne('workspace-parcours-d-integration-onboarding')).not.toBeNull();
    rechercher('zzz');
    expect(el().querySelector('[data-testid="vide"]')!.textContent).toContain('Aucune option ne correspond à votre recherche.');
  });

  it('tags d’offre avec texte : Payant, Standard, Customisation client', () => {
    expect(ligne('workspace-module-offboarding').querySelector('[data-part="tags"]')!.textContent).toContain('Payant');
    expect(ligne('workspace-organigramme').querySelector('soc-labs-tag')!.textContent!.trim()).toBe('Standard');
    expect(ligne('workspace-lien-entre-formations-et-competences').querySelector('[data-part="tags"]')!.textContent).toContain(
      'Customisation client',
    );
  });

  it('une option standard s’active directement', () => {
    interrupteur('workspace-plusieurs-comptes-bancaires-par-employe').click();
    fixture.detectChanges();
    expect(ligne('workspace-plusieurs-comptes-bancaires-par-employe').querySelector('[data-part="confirm"]')).toBeNull();
    expect(barre()).toBe('1 modification non enregistrée');
  });

  it('une option payante demande une confirmation dans la ligne', fakeAsync(() => {
    interrupteur('workspace-intranet').click();
    detect();
    const confirmation = ligne('workspace-intranet').querySelector('[data-part="confirm"]') as HTMLElement;
    expect(confirmation.textContent).toContain("Option payante : vérifiez qu'elle a été vendue au client.");
    expect(el().querySelector('soc-labs-changes-bar')!.getAttribute('data-state')).toBe('idle');
    (confirmation.querySelector('[data-part="confirm-ok"]') as HTMLButtonElement).click();
    detect();
    expect(interrupteur('workspace-intranet').getAttribute('aria-checked')).toBe('true');
    expect(barre()).toBe('1 modification non enregistrée');
    expect(el().textContent).toContain('14 options activées, dont 5 payantes');
  }));

  it('annuler la confirmation laisse l’option payante désactivée', fakeAsync(() => {
    interrupteur('workspace-intranet').click();
    detect();
    (ligne('workspace-intranet').querySelector('[data-part="confirm-cancel"]') as HTMLButtonElement).click();
    detect();
    expect(interrupteur('workspace-intranet').getAttribute('aria-checked')).toBe('false');
    expect(el().querySelector('soc-labs-changes-bar')!.getAttribute('data-state')).toBe('idle');
  }));

  it('sous-options imbriquées, désactivées tant que le parent est coupé', () => {
    const parent = 'workspace-parcours-de-depart-offboarding';
    const enfant = `${parent}--etape-reprise-du-materiel`;
    expect(ligne(parent).querySelector('[data-part="children"]')!.contains(ligne(enfant))).toBeTrue();
    expect(interrupteur(enfant).disabled).toBeTrue();
    expect(ligne(enfant).querySelector('[data-part="disabled-reason"]')!.textContent).toContain('Activez d’abord');
    const parentActif = 'workspace-parcours-d-integration-onboarding';
    expect(interrupteur(`${parentActif}--etape-documents`).disabled).toBeFalse();
    interrupteur(parentActif).click();
    fixture.detectChanges();
    expect(interrupteur(`${parentActif}--etape-documents`).disabled).toBeTrue();
    expect(interrupteur(`${parentActif}--etape-documents`).getAttribute('aria-checked')).toBe('false');
  });

  it('barre de modifications : Annuler revient à l’état enregistré', () => {
    interrupteur('workspace-organigramme').click();
    interrupteur('recrutement-cvtheque').click();
    fixture.detectChanges();
    expect(barre()).toBe('2 modifications non enregistrées');
    (el().querySelector('soc-labs-changes-bar [data-part="cancel"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('soc-labs-changes-bar')!.getAttribute('data-state')).toBe('idle');
    expect(interrupteur('workspace-organigramme').getAttribute('aria-checked')).toBe('true');
  });

  it('barre de modifications : Enregistrer affiche « Enregistré » et met à jour la dernière modification', fakeAsync(() => {
    interrupteur('workspace-organigramme').click();
    fixture.detectChanges();
    (el().querySelector('soc-labs-changes-bar [data-part="save"]') as HTMLButtonElement).click();
    tick(400);
    fixture.detectChanges();
    expect(barre()).toBe('Enregistré');
    const aujourdhui = new Date().toLocaleDateString('fr-FR');
    expect(el().querySelector('[data-testid="derniere-modification"]')!.textContent).toContain(`Absatou Diallo le ${aujourdhui}`);
    tick(4000);
    fixture.detectChanges();
    expect(el().querySelector('soc-labs-changes-bar')!.getAttribute('data-state')).toBe('idle');
    flush();
  }));

  it('clic sur le libellé : panneau latéral avec description, offre, produit, sous-options, mise en ligne', () => {
    (ligne('workspace-parcours-d-integration-onboarding').querySelector('[data-part="label"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const drawer = el().querySelector('soc-drawer') as HTMLElement;
    const texte = (drawer.querySelector('[role="dialog"]') ?? document.querySelector('[role="dialog"][aria-modal]'))!.textContent!;
    expect(texte).toContain("Parcours d'intégration (onboarding)");
    expect(texte).toContain('Payant');
    expect(texte).toContain('Workspace');
    expect(texte).toContain('Étape Documents (activée)');
    expect(texte).toContain('Mise en ligne');
  });
  });

  describe('variante A — catalogue', () => {
    beforeEach(fakeAsync(() => creer('a')));
    const carte = (produit: string) => el().querySelector(`.catalogue__carte[data-produit="${produit}"]`) as HTMLElement;
    const tuiles = (produit: string) => carte(produit).querySelectorAll('.catalogue__tuiles > soc-labs-option-row');
    const switchTuile = (id: string) => ligne(id).querySelector(':scope > [data-part="row"] [role="switch"]') as HTMLButtonElement;

    it('une carte par produit : nom, compteur, 4 tuiles puis « Tout voir »', () => {
      expect(groupes()).toEqual(['workspace', 'recrutement', 'workflow', 'performance', 'doc', 'payroll']);
      expect(carte('workspace').querySelector('soc-card')!.textContent).toContain('6 / 23 activées');
      expect(tuiles('workspace').length).toBe(4);
      const toutVoir = carte('workspace').querySelector('[data-testid="tout-voir"]') as HTMLButtonElement;
      expect(toutVoir.textContent!.trim()).toBe('Tout voir (16)');
      expect(toutVoir.getAttribute('aria-expanded')).toBe('false');
      toutVoir.click();
      fixture.detectChanges();
      expect(tuiles('workspace').length).toBe(16);
      expect(toutVoir.textContent!.trim()).toBe('Réduire');
      expect(carte('payroll').querySelector('[data-testid="tout-voir"]')).toBeNull();
    });

    it('options payantes mises en avant (pas seulement par le tag)', () => {
      expect(ligne('workspace-module-offboarding').getAttribute('data-appearance')).toBe('tile');
      expect(ligne('workspace-module-offboarding').hasAttribute('data-highlight')).toBeTrue();
      expect(ligne('workspace-generation-automatique-des-matricules').hasAttribute('data-highlight')).toBeFalse();
    });

    it('filtre « Payantes » : seules les tuiles payantes, les cartes sans résultat disparaissent', () => {
      filtre('Payantes').click();
      fixture.detectChanges();
      expect(groupes()).toEqual(['workspace', 'workflow', 'performance', 'doc']);
      const toutes = [...el().querySelectorAll('.catalogue__tuiles > soc-labs-option-row')];
      expect(toutes.length).toBe(19);
      expect(toutes.every((t) => t.hasAttribute('data-highlight'))).toBeTrue();
      filtre('Customisations').click();
      fixture.detectChanges();
      expect(groupes()).toEqual(['workspace', 'performance']);
      filtre('Nouvelles').click();
      fixture.detectChanges();
      expect(el().querySelectorAll('.catalogue__tuiles > soc-labs-option-row').length).toBe(3);
    });

    it('recherche dans toutes les cartes ; sous-options dépliées si elles correspondent ; état vide', () => {
      rechercher('étape matériel');
      expect(groupes()).toEqual(['workspace']);
      const parent = ligne('workspace-parcours-d-integration-onboarding');
      expect((parent.querySelector('[data-part="children"]') as HTMLElement).hidden).toBeFalse();
      rechercher('zzz');
      expect(el().querySelector('[data-testid="vide"]')!.textContent).toContain('Aucune option ne correspond à votre recherche.');
    });

    it('sous-options repliées sous leur tuile, désactivées si le parent est coupé', () => {
      (carte('workspace').querySelector('[data-testid="tout-voir"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      const parent = ligne('workspace-parcours-de-depart-offboarding');
      const toggle = parent.querySelector('[data-part="children-toggle"]') as HTMLButtonElement;
      expect(toggle.textContent!.trim()).toBe('Afficher les 3 sous-options');
      expect((parent.querySelector('[data-part="children"]') as HTMLElement).hidden).toBeTrue();
      toggle.click();
      fixture.detectChanges();
      expect((parent.querySelector('[data-part="children"]') as HTMLElement).hidden).toBeFalse();
      expect(interrupteur(`workspace-parcours-de-depart-offboarding--etape-documents`).disabled).toBeTrue();
    });

    it('option payante : confirmation dans la tuile, puis barre de modifications', fakeAsync(() => {
      switchTuile('workspace-module-offboarding').click();
      detect();
      const confirmation = ligne('workspace-module-offboarding').querySelector('[data-part="confirm"]') as HTMLElement;
      expect(confirmation.textContent).toContain("Option payante : vérifiez qu'elle a été vendue au client.");
      (confirmation.querySelector('[data-part="confirm-ok"]') as HTMLButtonElement).click();
      detect();
      expect(barre()).toBe('1 modification non enregistrée');
      expect(carte('workspace').querySelector('soc-card')!.textContent).toContain('7 / 23 activées');
      (el().querySelector('soc-labs-changes-bar [data-part="cancel"]') as HTMLButtonElement).click();
      detect();
      expect(switchTuile('workspace-module-offboarding').getAttribute('aria-checked')).toBe('false');
    }));

    it('clic sur une tuile (hors interrupteur) : panneau latéral', () => {
      (ligne('workspace-generation-automatique-des-matricules').querySelector('[data-part="description"]') as HTMLElement).click();
      fixture.detectChanges();
      expect(el().querySelector('soc-drawer')).not.toBeNull();
      expect(document.querySelector('[role="dialog"][aria-modal]')!.textContent).toContain('Génération automatique des matricules');
    });
  });

  describe('variante B — l’offre du client d’abord', () => {
    beforeEach(fakeAsync(() => creer('b')));
    const section = (id: string) => el().querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
    const puces = () => [...el().querySelectorAll('[data-testid="puces"] soc-labs-action-chip')].map((c) => c.getAttribute('data-option'));

    it('« Offre de … » : modules souscrits, options payantes activées en puces', () => {
      expect(section('offre')!.querySelector('h2')!.textContent).toContain('Offre de Teranga Logistique');
      const modules = section('offre')!.querySelector('[data-testid="modules"]')!.textContent!;
      for (const m of ['CO', 'Core RH (Workspace)', 'JO', 'PE', 'WO']) expect(modules).toContain(m);
      expect(section('offre')!.querySelector('[data-testid="nb-payantes"]')!.textContent).toContain('4');
      expect(puces()).toEqual([
        'workspace-parcours-d-integration-onboarding',
        'workflow-notes-de-frais',
        'performance-module-formations',
        'doc-signature-electronique-des-documents',
      ]);
    });

    it('sections dans l’ordre : payantes disponibles, standard (repliables, la première ouverte), customisations', () => {
      const titres = [...el().querySelectorAll('section > h2')].map((h) => h.textContent!.trim().replace(/\s+\d+$/, ''));
      expect(titres).toEqual(['Offre de Teranga Logistique', 'Options payantes disponibles', 'Options standard', 'Customisations client']);
      expect(section('section-payantes')!.querySelectorAll('soc-labs-option-row').length).toBe(15);
      const blocs = [...section('section-standard')!.querySelectorAll('soc-accordion')];
      expect(blocs.map((b) => b.getAttribute('data-produit'))).toEqual(['workspace', 'recrutement', 'workflow', 'performance', 'doc', 'payroll']);
      expect(blocs.map((b) => b.querySelector('[aria-expanded]')!.getAttribute('aria-expanded'))).toEqual(['true', 'false', 'false', 'false', 'false', 'false']);
      expect(section('section-customisations')!.textContent).toContain('Réglages propres à un client, à activer uniquement sur demande.');
      expect(section('section-customisations')!.querySelectorAll('soc-labs-option-row').length).toBe(2);
    });

    it('« Activer » une option payante : confirmation dans la ligne, puis l’option rejoint l’offre', fakeAsync(() => {
      const action = () => ligne('workspace-intranet').querySelector('[data-part="action"]') as HTMLButtonElement;
      expect(action().textContent!.trim()).toBe('Activer');
      action().click();
      detect();
      expect(ligne('workspace-intranet').querySelector('[data-part="confirm"]')!.textContent).toContain('vérifiez qu');
      expect(puces()).not.toContain('workspace-intranet');
      (ligne('workspace-intranet').querySelector('[data-part="confirm-ok"]') as HTMLButtonElement).click();
      detect();
      expect(puces()).toContain('workspace-intranet');
      expect(section('section-payantes')!.querySelector('[data-option="workspace-intranet"]')).toBeNull();
      expect(barre()).toBe('1 modification non enregistrée');
    }));

    it('« Désactiver » une puce : l’option revient dans les payantes disponibles', fakeAsync(() => {
      const puce = el().querySelector('soc-labs-action-chip[data-option="workflow-notes-de-frais"]')!;
      bouton(puce, 'Désactiver').click();
      detect();
      expect(puces()).not.toContain('workflow-notes-de-frais');
      expect(section('section-payantes')!.querySelector('[data-option="workflow-notes-de-frais"]')).not.toBeNull();
    }));

    it('les sous-options d’une option payante activée se règlent dans l’offre', () => {
      const bloc = section('offre')!.querySelector('[data-parent="workspace-parcours-d-integration-onboarding"]')!;
      expect(bloc.textContent).toContain('2 / 4 activées');
    });

    it('une option standard s’active directement', () => {
      const sw = ligne('workspace-organigramme').querySelector('[role="switch"]') as HTMLButtonElement;
      sw.click();
      fixture.detectChanges();
      expect(ligne('workspace-organigramme').querySelector('[data-part="confirm"]')).toBeNull();
      expect(barre()).toBe('1 modification non enregistrée');
    });

    it('la recherche filtre les trois sections (blocs ouverts) ; état vide', () => {
      rechercher('bilan');
      expect(section('section-payantes')).toBeNull();
      expect(section('section-customisations')).toBeNull();
      const blocs = [...section('section-standard')!.querySelectorAll('soc-accordion')];
      expect(blocs.map((b) => b.getAttribute('data-produit'))).toEqual(['workspace']);
      expect(blocs[0].querySelectorAll('soc-labs-option-row').length).toBe(2);
      rechercher('compétences');
      expect(section('section-customisations')!.querySelectorAll('soc-labs-option-row').length).toBe(2);
      rechercher('zzz');
      expect(section('section-standard')).toBeNull();
      expect(el().querySelector('[data-testid="vide"]')!.textContent).toContain('Aucune option ne correspond à votre recherche.');
    });
  });
});
