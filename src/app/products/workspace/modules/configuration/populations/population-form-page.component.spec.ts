import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { POPULATIONS } from '../../../../../../mocks/data/populations.mock';
import { PopulationFormPageComponent } from './population-form-page.component';
import { PopulationsService } from './services/populations.service';

/** Accès aux membres protégés de la page (contrôles de formulaire : les listes du kit s'ouvrent dans un popover). */
type Page = PopulationFormPageComponent & Record<string, any>;

describe('PopulationFormPageComponent', () => {
  let fixture: ComponentFixture<PopulationFormPageComponent>;
  let page: Page;
  let navigate: jasmine.Spy;
  const el = () => fixture.nativeElement as HTMLElement;
  const bouton = (texte: string) => [...el().querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const conditions = () => el().querySelectorAll('[data-testid="condition"]');
  const compteur = () => el().querySelector('[data-testid="compteur"]')?.textContent?.trim();
  const saisirNom = (nom: string) => {
    const input = el().querySelector('soc-input-text input') as HTMLInputElement;
    input.value = nom;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };
  const cliquer = (texte: string) => {
    bouton(texte).click();
    fixture.detectChanges();
  };

  const creer = (id?: string, query: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}), queryParamMap: convertToParamMap(query) } } },
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture = TestBed.createComponent(PopulationFormPageComponent);
    page = fixture.componentInstance as Page;
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  describe('création', () => {
    beforeEach(fakeAsync(() => creer()));

    it('exige un nom', () => {
      cliquer('Suivant');
      expect(el().textContent).toContain('Le nom est obligatoire.');
      expect(el().querySelector('soc-stepper')?.textContent).toContain('Informations');
      expect(conditions().length).toBe(0); // toujours à l'étape 1
    });

    it('refuse un nom déjà utilisé (sans tenir compte de la casse)', () => {
      saisirNom('  équipe sénégal ');
      cliquer('Suivant');
      expect(el().textContent).toContain('Une population porte déjà ce nom.');
    });

    it('exige au moins une condition, et une valeur par condition', () => {
      saisirNom('Nouvelle population');
      cliquer('Suivant');
      expect(conditions().length).toBe(1);

      cliquer('Créer la population');
      expect(el().textContent).toContain('Chaque condition doit avoir une valeur.');
      expect(el().textContent).toContain('Valeur obligatoire.');

      (el().querySelector('[aria-label="Supprimer la condition 1"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(el().textContent).toContain('Ajoutez au moins une condition.');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('ajoute des conditions et compte les employés en direct, selon ET / OU', () => {
      saisirNom('RH ou Dakar');
      cliquer('Suivant');
      cliquer('Ajouter une condition');
      expect(conditions().length).toBe(2);
      const [c1, c2] = page['form'].controls.conditions.controls;
      c1.patchValue({ champ: 'departement' });
      c1.patchValue({ valeur: 'Ressources humaines' });
      c2.patchValue({ valeur: 'Dakar' });
      fixture.detectChanges();
      expect(compteur()).toBe('3 employés correspondent à ces règles.');

      (el().querySelector('#combinaison-ou') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(compteur()).toBe('11 employés correspondent à ces règles.');
    });

    it('vide la valeur quand on change de champ', () => {
      saisirNom('Test');
      cliquer('Suivant');
      const condition = page['form'].controls.conditions.at(0);
      condition.patchValue({ valeur: 'Dakar' });
      condition.patchValue({ champ: 'statut' });
      expect(condition.controls.valeur.value).toBe('');
    });

    it('pré-remplit les règles depuis un modèle sans modifier la source', fakeAsync(() => {
      saisirNom('Copie de DSI');
      page['form'].patchValue({ utiliserModele: true, sourceId: 'pop-3' });
      fixture.detectChanges();
      cliquer('Suivant');
      expect(conditions().length).toBe(3);
      page['form'].controls.conditions.at(0).patchValue({ valeur: 'Direction des ressources humaines' });
      cliquer('Créer la population');
      tick(300);

      let populations: any[] = [];
      TestBed.inject(PopulationsService).getAll().subscribe((p) => (populations = p));
      tick(300);
      const source = populations.find((p) => p.id === 'pop-3');
      const copie = populations.find((p) => p.nom === 'Copie de DSI');
      expect(source.conditions).toEqual(POPULATIONS[2].conditions);
      expect(copie.conditions[0].valeur).toBe('Direction des ressources humaines');
      expect(copie.creePar.nom).toBe('Absatou Diallo');
      expect(navigate).toHaveBeenCalledWith('/workspace/configuration/populations');
    }));
  });

  describe('modification', () => {
    beforeEach(fakeAsync(() => creer('pop-1')));

    it("pré-remplit le formulaire et accepte de garder son propre nom", () => {
      expect((el().querySelector('soc-input-text input') as HTMLInputElement).value).toBe('Équipe Sénégal');
      expect(el().textContent).not.toContain('Utiliser une population existante');
      cliquer('Suivant');
      expect(conditions().length).toBe(1);
      expect(compteur()).toBe('12 employés correspondent à ces règles.');
    });

    it("ouvre la modale d'impact et n'applique les nouvelles règles qu'aux éléments cochés", fakeAsync(() => {
      cliquer('Suivant');
      page['form'].controls.conditions.at(0).patchValue({ valeur: 'France' });
      cliquer('Enregistrer');
      const dialogue = document.body.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
      expect(dialogue.textContent).toContain('Impact de la modification');
      (dialogue.querySelectorAll('[role="checkbox"]')[1] as HTMLButtonElement).click(); // « Workflow congés » garde l'ancienne version
      fixture.detectChanges();
      ([...dialogue.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Appliquer') as HTMLButtonElement).click();
      tick(300);

      let usages: any[] = [];
      TestBed.inject(PopulationsService).getUsages().subscribe((u) => (usages = u));
      tick(300);
      const figee = (id: string) => usages.find((u) => u.id === id).versionFigee;
      expect(figee('usage-1')).toBeUndefined();
      expect(figee('usage-2')?.conditions[0].valeur).toBe('Sénégal');
      expect(figee('usage-3')).toBeUndefined();
      expect(navigate).toHaveBeenCalledWith('/workspace/configuration/populations');
    }));
  });

  describe('retour vers la page appelante', () => {
    it('revient à la page passée en « retour » (ex. formulaire de tableau de bord)', fakeAsync(() => {
      creer('pop-6', { retour: '/workspace/configuration/tableaux-de-bord/nouveau' });
      cliquer('Annuler');
      expect(navigate).toHaveBeenCalledWith('/workspace/configuration/tableaux-de-bord/nouveau');
    }));

    it('ignore un « retour » hors du Workspace', fakeAsync(() => {
      creer('pop-6', { retour: 'https://exemple.com' });
      cliquer('Annuler');
      expect(navigate).toHaveBeenCalledWith('/workspace/configuration/populations');
    }));
  });
});
