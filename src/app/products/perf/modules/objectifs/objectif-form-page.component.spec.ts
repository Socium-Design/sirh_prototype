import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { SocLabsPopulationPicker } from '../../../../shared/labs/labs';
import { ObjectifFormPageComponent } from './objectif-form-page.component';
import { ObjectifsService } from './services/objectifs.service';

describe('ObjectifFormPageComponent', () => {
  let fixture: ComponentFixture<ObjectifFormPageComponent>;
  let router: Router;
  let service: ObjectifsService;
  const el = () => fixture.nativeElement as HTMLElement;
  const picker = () => fixture.debugElement.query(By.directive(SocLabsPopulationPicker)).componentInstance as SocLabsPopulationPicker;
  const onglets = () => [...el().querySelectorAll('[data-testid="population"] [role="tab"]')] as HTMLButtonElement[];
  const personnes = () => [...el().querySelectorAll('[data-person]')].map((li) => li.querySelector('soc-avatar')!.textContent!.replace(/\s+/g, ' ').trim());
  const compteur = () => el().querySelector('[data-count]')?.textContent?.trim();
  const bouton = () => el().querySelector('[data-testid="valider"]') as HTMLButtonElement;
  // Le formulaire réactif est protégé : les tests le remplissent comme le ferait la saisie.
  const form = () => (fixture.componentInstance as unknown as { form: FormGroup }).form;

  function creer(mode: 'creation' | 'modification', params: Record<string, string> = {}, query: Record<string, string> = {}): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { mode }, paramMap: convertToParamMap(params), queryParamMap: convertToParamMap(query) } } },
      ],
    });
    router = TestBed.inject(Router);
    service = TestBed.inject(ObjectifsService);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(ObjectifFormPageComponent);
    fixture.detectChanges();
  }

  function choisir(ids: string[]): void {
    picker().value.set(ids);
    fixture.detectChanges();
  }

  function remplir(): void {
    form().patchValue({ titre: 'Réussir la migration', periode: { debut: '2026-11-01', fin: '2026-12-31' }, type: 'QUALITATIVE' });
    fixture.detectChanges();
  }

  describe('création — Population concernée', () => {
    beforeEach(() => creer('creation'));

    it('affiche le titre de la prod et les trois onglets seulement, « Personne nommée » par défaut', () => {
      expect(el().querySelector('h1')!.textContent).toContain("Création d'un objectif");
      expect(onglets().map((o) => o.textContent!.trim())).toEqual(['Personne nommée', 'Structure', 'Poste']);
      expect(onglets()[0].getAttribute('aria-selected')).toBe('true');
      expect(el().textContent).not.toContain('Tous les employés');
      expect(el().textContent).not.toContain('Par e-mail');
      expect(el().textContent).toContain('Cette liste affiche tous les employés de votre scope ainsi que ceux rattachés à votre ligne hiérarchique (N-1, N-2…).');
    });

    it('Personne nommée : liste les employés choisis (initiales, nom, structure) et ne propose aucun employé hors périmètre', () => {
      const options = picker().modes()[0].options.map((o) => o.value);
      expect(options.length).toBe(20);
      expect(options).not.toContain('7');
      choisir(['1', '12']);
      expect(compteur()).toBe('2 employé(s) concerné(s)');
      expect(personnes()).toEqual(['AD Awa Diop Pôle Développement', 'MC Mariama Cissé Pôle Développement']);
    });

    it('Structure : inclut les sous-structures et jamais les employés hors périmètre', () => {
      onglets()[1].click();
      fixture.detectChanges();
      expect(el().textContent).toContain('Les sous-structures sont incluses.');
      const structures = picker().modes()[1].options.map((o) => o.value);
      expect(structures).toContain('daf');
      expect(structures).not.toContain('daf-cdg'); // aucun employé visible : pas proposé
      choisir(['daf']);
      expect(compteur()).toBe('3 employé(s) concerné(s)');
      expect(personnes().every((p) => p.endsWith('Service Comptabilité'))).toBeTrue();
      expect(personnes().join()).not.toContain('Khady Gueye');
    });

    it('Poste : un poste vacant ne donne personne et bloque la création', () => {
      remplir();
      onglets()[2].click();
      fixture.detectChanges();
      choisir(['architecte-cloud']);
      expect(compteur()).toBe('0 employé(s) concerné(s)');
      expect(el().querySelector('[data-empty]')!.textContent!.trim()).toBe('Aucun employé ne correspond à cette sélection.');
      expect(bouton().disabled).toBeTrue();
      choisir(['comptable']);
      expect(compteur()).toBe('3 employé(s) concerné(s)');
      expect(bouton().disabled).toBeFalse();
    });

    it("changer d'onglet vide la sélection : un seul mode à la fois", () => {
      choisir(['1']);
      expect(compteur()).toBe('1 employé(s) concerné(s)');
      onglets()[1].click();
      fixture.detectChanges();
      expect(picker().value()).toEqual([]);
      expect(el().querySelector('[data-preview]')).toBeNull();
    });

    it('« Créer l\'objectif » reste désactivé tant que le formulaire est invalide', () => {
      expect(bouton().disabled).toBeTrue();
      choisir(['1']);
      expect(bouton().disabled).toBeTrue();
      remplir();
      expect(bouton().disabled).toBeFalse();
      form().patchValue({ periode: { debut: '2026-12-31', fin: '2026-01-01' } });
      fixture.detectChanges();
      expect(bouton().disabled).toBeTrue();
    });

    it('Quantitative affiche Valeur cible et Valeur courante, obligatoires', () => {
      expect(el().querySelector('[data-testid="valeur-cible"]')).toBeNull();
      choisir(['1']);
      remplir();
      form().patchValue({ type: 'QUANTITATIVE' });
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="valeur-cible"]')).not.toBeNull();
      expect(el().querySelector('[data-testid="valeur-courante"]')).not.toBeNull();
      expect(bouton().disabled).toBeTrue();
      form().patchValue({ valeurCible: 10, valeurCourante: 0 });
      fixture.detectChanges();
      expect(bouton().disabled).toBeFalse();
    });

    it('a une pondération à 1 et « Objectif à évaluer » coché par défaut', () => {
      expect(form().value.ponderation).toBe(1);
      expect(form().value.aEvaluer).toBeTrue();
    });
  });

  describe('création — un objectif par employé concerné', () => {
    beforeEach(() => creer('creation'));

    it('crée un objectif pour chaque employé de la structure, annonce le nombre et revient à la liste', () => {
      const avant = service.objectifs().length;
      onglets()[1].click();
      fixture.detectChanges();
      choisir(['dsi']);
      remplir();
      bouton().click();
      fixture.detectChanges();
      const crees = service.objectifs().slice(avant);
      expect(crees.length).toBe(9);
      expect(new Set(crees.map((o) => o.employeId)).size).toBe(9);
      expect(crees.every((o) => o.titre === 'Réussir la migration' && o.etat === 'actif' && o.ponderation === 1 && !o.parentId)).toBeTrue();
      expect(service.consommerMessage()).toBe('Objectif créé pour 9 employé(s)');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/perf/objectifs');
    });
  });

  describe('création depuis la ligne d\'un collaborateur', () => {
    beforeEach(() => creer('creation', {}, { employe: '2' }));

    it('présélectionne ce collaborateur en « Personne nommée »', () => {
      expect(picker().value()).toEqual(['2']);
      expect(compteur()).toBe('1 employé(s) concerné(s)');
    });
  });

  describe('modification', () => {
    beforeEach(() => creer('modification', { id: 'obj-1' }));

    it('reprend la prod : bandeau, champs pré-remplis, « Personnes assignées » non modifiable, raison obligatoire', () => {
      expect(el().querySelector('h1')!.textContent).toContain("Modification d'un objectif");
      expect(el().querySelector('[data-testid="bandeau-validation"]')!.textContent).toContain(
        "Cette modification sera soumise à validation avant d'être appliquée.",
      );
      expect(form().value.titre).toBe('Migrer le portail RH vers Angular 19');
      expect(el().querySelector('[data-testid="population"]')).toBeNull();
      expect(el().querySelector('[data-testid="personnes-assignees"]')!.textContent).toContain('Awa Diop');
      expect(bouton().textContent!.trim()).toBe('Soumettre la demande');
      expect(bouton().disabled).toBeTrue();
      form().patchValue({ raison: 'Nouveau périmètre' });
      fixture.detectChanges();
      expect(bouton().disabled).toBeFalse();
    });

    it('soumet la demande sans appliquer la modification', () => {
      form().patchValue({ titre: 'Titre modifié', raison: 'Nouveau périmètre' });
      fixture.detectChanges();
      bouton().click();
      const o = service.objectif('obj-1')!;
      expect(o.titre).toBe('Migrer le portail RH vers Angular 19');
      expect(o.etat).toBe('soumis');
      expect(o.historique.at(-1)!.motif).toBe('Nouveau périmètre');
      expect(router.navigate).toHaveBeenCalledWith(['/perf/objectifs', 'obj-1']);
    });
  });
});
