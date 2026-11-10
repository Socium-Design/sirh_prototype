import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OPTIONS_ENTREPRISE } from '../../../../../../mocks/data/options-entreprise.mock';
import { messagePrerequis, prerequisManquants } from './options-entreprise';
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

  /** Ouvre la page de Teranga Logistique. À appeler dans `fakeAsync`. */
  const creer = () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'ent-1' })) } },
      ],
    });
    fixture = TestBed.createComponent(OptionsEntreprisePageComponent);
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };
  beforeEach(fakeAsync(() => creer()));

  it('en-tête : titre, entreprise, résumé, fil d’Ariane et dernière modification', () => {
    expect(el().querySelector('h1')!.textContent).toContain('Fonctionnalités et options');
    expect(el().textContent).toContain('Teranga Logistique');
    expect(el().textContent).toContain('13 options activées, dont 4 payantes');
    expect(el().querySelector('soc-breadcrumb')!.textContent).toContain('Entreprises');
    expect(el().querySelector('[data-testid="derniere-modification"]')!.textContent).toContain('Mariama Ndiaye le 14/10/2026');
  });

  it('compteurs « activées / total » par produit, « Tous les produits » en premier', () => {
    const items = [...el().querySelectorAll('soc-labs-nav-list button')].map((b) => b.querySelector('span.truncate')!.textContent!.trim());
    expect(items).toEqual(['Tous les produits', 'Workspace', 'Recrutement', 'Workflow', 'Performance', 'Doc', 'Payroll']);
    expect(nav('Tous les produits').querySelector('[data-part="count"]')!.textContent!.trim()).toBe('13 / 65');
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

  it('filtres rapides : Payantes, Customisations, Nouveautés, Activées', () => {
    filtre('Payantes').click();
    fixture.detectChanges();
    const tags = [...el().querySelectorAll('[data-part="tags"]')].map((t) => t.textContent!.trim());
    expect(tags.every((t) => t.includes('Payant'))).toBeTrue();
    filtre('Customisations').click();
    fixture.detectChanges();
    expect(lignes()).toBe(2);
    expect(el().querySelector('[data-testid="explication-filtre"]')).toBeNull();
    filtre('Nouveautés').click();
    fixture.detectChanges();
    expect(el().querySelectorAll('[data-testid="badge-nouveau"]').length).toBe(3);
    expect(lignes()).toBe(3);
    expect(el().querySelector('[data-testid="explication-filtre"]')!.textContent!.trim()).toBe('Options ajoutées ces 30 derniers jours.');
    filtre('Activées').click();
    fixture.detectChanges();
    expect(lignes()).toBe(13);
    expect(el().querySelector('[data-testid="explication-filtre"]')).toBeNull();
  });

  it('badge « Nouveau · {date} » focalisable, avec infobulle « Ajoutée le … À vérifier … »', () => {
    expect(el().querySelector('[data-testid="filtres"]')!.textContent).not.toContain('Nouvelles');
    const row = ligne('performance-objectifs-strategiques-de-l-entreprise');
    const badge = row.querySelector('[data-testid="badge-nouveau"]') as HTMLElement;
    expect(badge.querySelector('soc-tag')!.textContent!.trim()).toBe('Nouveau · 15 oct.');
    expect(badge.tabIndex).toBe(0);
    badge.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    const id = row.querySelector('soc-tooltip')!.getAttribute('aria-describedby')!;
    const infobulle = document.getElementById(id)!.textContent!.replace(/\s+/g, ' ').trim();
    expect(infobulle).toBe("Ajoutée le 15 octobre 2026. À vérifier : si elle est standard, vous pouvez l'activer pour ce client.");
    expect(badge.querySelector('.sr-only')!.textContent).toContain('Ajoutée le 15 octobre 2026.');
    expect(ligne('workspace-intranet').querySelector('[data-testid="badge-nouveau"]')).toBeNull();
  });

  it('recherche par début de mot dans le libellé et la description, sans accents ni casse ; état vide', () => {
    rechercher('habilitation');
    expect(lignes()).toBe(1);
    rechercher("dates d'expiration");
    expect(ligne('performance-gestion-des-habilitations')).not.toBeNull();
    rechercher('FORMATION');
    expect(ligne('performance-module-formations')).not.toBeNull();
    expect(ligne('workspace-intranet')).toBeNull(); // « information » ne commence pas par « formation »
    rechercher('etape mat');
    expect(ligne('workspace-parcours-d-integration-onboarding--etape-materiel')).not.toBeNull();
    expect(ligne('workspace-parcours-d-integration-onboarding')).not.toBeNull();
    expect(ligne('workspace-parcours-d-integration-onboarding--etape-documents')).toBeNull();
    rechercher('ganigramme');
    expect(ligne('workspace-organigramme')).toBeNull();
    rechercher('zzz');
    expect(el().querySelector('[data-testid="vide"]')!.textContent).toContain('Aucune option ne correspond à votre recherche.');
  });

  it('aucune variante : ni sélecteur ni paramètre, la vue liste seule', () => {
    expect(el().querySelector('[data-testid="variante"]')).toBeNull();
    expect(el().querySelector('soc-labs-pill-toggle')).toBeNull();
    expect(el().querySelector('soc-labs-nav-list')).not.toBeNull();
  });

  it('tags d’offre avec texte : Payant, Standard, Customisation client', () => {
    expect(ligne('workspace-module-offboarding').querySelector('[data-part="tags"]')!.textContent).toContain('Payant');
    expect(ligne('workspace-organigramme').querySelector('soc-labs-tag')!.textContent!.trim()).toBe('Standard');
    expect(ligne('workspace-lien-entre-formations-et-competences').querySelector('[data-part="tags"]')!.textContent).toContain(
      'Customisation client',
    );
  });

  it('inventaire Sales : chaque option a son tag d’offre, sous-options comprises', () => {
    const rangees = [...el().querySelectorAll('soc-labs-option-row[data-option]')];
    expect(rangees.length).toBe(65);
    for (const rangee of rangees) {
      const tags = rangee.querySelector(':scope > [data-part="row"] [data-part="tags"]')?.textContent ?? '';
      expect(/Payant|Standard/.test(tags)).withContext(rangee.getAttribute('data-option')!).toBeTrue();
    }
  });

  it('« Customisation client » s’ajoute au tag d’offre', () => {
    for (const id of ['workspace-lien-entre-formations-et-competences', 'performance-lien-entre-formations-et-competences']) {
      const tags = ligne(id).querySelector(':scope > [data-part="row"] [data-part="tags"]')!.textContent!.replace(/\s+/g, ' ');
      expect(tags).withContext(id).toContain('Payant');
      expect(tags).withContext(id).toContain('Customisation client');
    }
    expect(el().querySelectorAll('soc-tag').length).toBeGreaterThan(0);
    expect([...el().querySelectorAll('soc-tag')].filter((t) => t.textContent!.includes('Customisation client')).length).toBe(2);
  });

  it('étape d’un parcours : tag « Payant », rattachée à son parent, activée sans confirmation', fakeAsync(() => {
    const etape = 'workspace-parcours-d-integration-onboarding--etape-evaluations';
    expect(ligne('workspace-parcours-d-integration-onboarding').contains(ligne(etape))).toBeTrue();
    expect(ligne(etape).querySelector(':scope > [data-part="row"] [data-part="tags"]')!.textContent).toContain('Payant');
    interrupteur(etape).click();
    fixture.detectChanges();
    expect(ligne(etape).querySelector('[data-part="confirm"]')).toBeNull();
    expect(barre()).toBe('1 modification non enregistrée');
    expect(el().textContent).toContain('14 options activées, dont 4 payantes');
    flush();
  }));

  it('panneau d’une étape : son offre, sans « Suit l’option parente »', () => {
    const etape = 'workspace-parcours-de-depart-offboarding--etape-documents';
    (ligne(etape).querySelector('[data-part="label"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialogue = el().querySelector('soc-drawer [role="dialog"]') ?? document.querySelector('[role="dialog"][aria-modal]');
    const texte = dialogue!.textContent!.replace(/\s+/g, ' ');
    expect(texte).toContain('Payant');
    expect(texte).not.toContain('Suit l');
    expect(texte).toContain('Parcours de départ (offboarding)');
  });

  describe('prérequis des étapes (avertir sans bloquer)', () => {
    const DOC_ONB = 'workspace-parcours-d-integration-onboarding--etape-documents';
    const DOC_OFF = 'workspace-parcours-de-depart-offboarding--etape-documents';
    const FORMATIONS = 'workspace-parcours-d-integration-onboarding--etape-formations';
    const EVALUATIONS = 'workspace-parcours-d-integration-onboarding--etape-evaluations';
    const alerte = (id: string) =>
      ligne(id).querySelector(':scope > [data-part="row"] [data-testid="alerte-prerequis"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const confirmer = (id: string) => {
      (ligne(id).querySelector('[data-part="confirm-ok"]') as HTMLButtonElement).click();
      fixture.detectChanges();
    };

    it('Teranga (sans module Doc) : alerte sur les deux étapes Documents, citant module et option', () => {
      const attendu = "Nécessite le module Doc et l'option « Demandes de documents », non activés pour cette entreprise. Vérifiez avec les Sales.";
      expect(alerte(DOC_ONB)).toBe(attendu);
      expect(alerte(DOC_OFF)).toBe(attendu);
      expect(ligne(DOC_ONB).querySelector('soc-message')!.getAttribute('status')).toBe('warning');
    });

    it('aucune alerte quand tous les prérequis sont activés (Évaluations, Formations), ni sur le parent', () => {
      expect(alerte(EVALUATIONS)).toBeNull();
      expect(alerte(FORMATIONS)).toBeNull();
      expect(alerte('workspace-parcours-d-integration-onboarding')).toBeNull();
      expect(el().querySelectorAll('[data-testid="alerte-prerequis"]').length).toBe(2);
    });

    it('l’étape reste cochable malgré l’alerte', () => {
      expect(interrupteur(DOC_ONB).disabled).toBeFalse();
      interrupteur(DOC_ONB).click();
      fixture.detectChanges();
      expect(interrupteur(DOC_ONB).getAttribute('aria-checked')).toBe('false');
      expect(barre()).toBe('1 modification non enregistrée');
      expect(alerte(DOC_ONB)).not.toBeNull();
    });

    it('en direct : décocher l’option Formations fait apparaître l’alerte, la recocher la retire', () => {
      interrupteur('performance-module-formations').click();
      fixture.detectChanges();
      expect(alerte(FORMATIONS)).toBe("Nécessite l'option « Module Formations », non activée pour cette entreprise. Vérifiez avec les Sales.");
      interrupteur('performance-module-formations').click();
      fixture.detectChanges();
      confirmer('performance-module-formations');
      expect(alerte(FORMATIONS)).toBeNull();
    });

    it('en direct : cocher « Demandes de documents » ne laisse que le module manquant', () => {
      interrupteur('doc-demandes-de-documents').click();
      fixture.detectChanges();
      confirmer('doc-demandes-de-documents');
      expect(alerte(DOC_ONB)).toBe('Nécessite le module Doc, non activé pour cette entreprise. Vérifiez avec les Sales.');
    });

    it('même alerte dans le panneau latéral de l’étape ; aucune pour une étape sans manque', () => {
      const ouvrir = (id: string) => {
        (ligne(id).querySelector('[data-part="label"]') as HTMLButtonElement).click();
        fixture.detectChanges();
      };
      const panneau = () => document.querySelector('[data-testid="alerte-prerequis-detail"]');
      ouvrir(DOC_OFF);
      expect(panneau()!.textContent!.replace(/\s+/g, ' ').trim()).toBe(alerte(DOC_OFF)!);
      ouvrir(EVALUATIONS);
      expect(panneau()).toBeNull();
    });
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

  it('clic sur le libellé : panneau latéral avec description, offre, produit, sous-options, « Ajoutée le {date} »', () => {
    (ligne('workspace-parcours-d-integration-onboarding').querySelector('[data-part="label"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const drawer = el().querySelector('soc-drawer') as HTMLElement;
    const texte = (drawer.querySelector('[role="dialog"]') ?? document.querySelector('[role="dialog"][aria-modal]'))!.textContent!;
    expect(texte).toContain("Parcours d'intégration (onboarding)");
    expect(texte).toContain('Payant');
    expect(texte).toContain('Workspace');
    expect(texte).toContain('Étape Documents (activée)');
    expect(texte).not.toContain('Mise en ligne');
    expect(texte.replace(/\s+/g, ' ')).toContain('Ajoutée le 19 juin 2023');
  });

  it('icônes de produit du kit en pastille « sélectionnée » (barre de produits) dans la navigation et les en-têtes de groupe, masquées aux lecteurs d’écran', () => {
    const icone = (racine: Element) => racine.querySelector('soc-app-icon-glyph');
    expect(nav('Tous les produits').querySelector('[data-part="icon"]')!.childElementCount).toBe(0);
    for (const libelle of ['Workspace', 'Recrutement', 'Workflow', 'Performance', 'Doc', 'Payroll']) {
      const bouton = nav(libelle);
      expect(icone(bouton)?.querySelector('svg')).withContext(libelle).not.toBeNull();
      expect(bouton.querySelector('[data-part="icon"]')!.getAttribute('aria-hidden')).toBe('true');
      expect(bouton.querySelector('[data-part="icon"]')!.className).withContext(libelle).toContain('appicon-bg-selected');
      expect(icone(bouton)!.querySelector('[class*="appicon-icon-accent"]')).withContext(libelle).not.toBeNull();
    }
    const titres = [...el().querySelectorAll('.options__titre-groupe')];
    expect(titres.length).toBe(6);
    for (const titre of titres) {
      expect(icone(titre)!.getAttribute('aria-hidden')).withContext(titre.textContent!).toBe('true');
      expect(icone(titre)!.querySelector('svg')).not.toBeNull();
      expect(icone(titre)!.querySelector('[class*="appicon-icon-selected"]')).withContext(titre.textContent!).not.toBeNull();
    }
    expect(titres[0].textContent!.replace(/\s+/g, ' ').trim()).toBe('Workspace 6 / 23 activées');
  });
});

describe('Prérequis des options : formulation et calcul', () => {
  it('cite exactement ce qui manque, avec l’accord', () => {
    expect(messagePrerequis(['Perf'], [])).toBe('Nécessite le module Perf, non activé pour cette entreprise. Vérifiez avec les Sales.');
    expect(messagePrerequis([], ['Module Formations'])).toBe(
      "Nécessite l'option « Module Formations », non activée pour cette entreprise. Vérifiez avec les Sales.",
    );
    expect(messagePrerequis(['Perf'], ['Module Formations'])).toBe(
      "Nécessite le module Perf et l'option « Module Formations », non activés pour cette entreprise. Vérifiez avec les Sales.",
    );
    expect(messagePrerequis([], [])).toBeNull();
  });

  it('Sahel Énergie (sans module Perf) : Évaluations et Formations', () => {
    const option = (id: string) => OPTIONS_ENTREPRISE.find((o) => o.id === id)!;
    const actives = new Set<string>();
    const manques = (id: string) => prerequisManquants(option(id), ['CO', 'WO'], OPTIONS_ENTREPRISE, actives);
    expect(manques('workspace-parcours-d-integration-onboarding--etape-evaluations')).toEqual({ modules: ['PE'], options: [] });
    const formations = manques('workspace-parcours-d-integration-onboarding--etape-formations');
    expect(formations.modules).toEqual(['PE']);
    expect(formations.options.map((o) => o.id)).toEqual(['performance-module-formations']);
  });
});
