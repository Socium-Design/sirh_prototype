import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { POPULATIONS } from '../../../../../../../mocks/data/populations.mock';
import type { Population } from '../models/population.model';
import { PopulationsService } from '../services/populations.service';
import { PopulationFormDialogComponent, type PopulationEnregistree } from './population-form-dialog.component';

@Component({
  imports: [PopulationFormDialogComponent],
  template: `<app-population-form-dialog [open]="open()" [population]="population()" (enregistre)="resultat = $event" (annule)="annule = true" />`,
})
class HoteComponent {
  readonly open = signal(true);
  readonly population = signal<Population | null>(null);
  resultat: PopulationEnregistree | null = null;
  annule = false;
}

/** Accès aux membres protégés du formulaire (les listes du kit s'ouvrent dans un popover). */
type Formulaire = Record<string, any>;

describe('PopulationFormDialogComponent', () => {
  let fixture: ComponentFixture<HoteComponent>;
  let formulaire: Formulaire;
  // Les panneaux de popover ont aussi role="dialog" : les modales sont celles qui ont aria-modal (la dernière est au-dessus).
  const modales = () => [...document.body.querySelectorAll('[role="dialog"][aria-modal="true"]')] as HTMLElement[];
  const modale = () => modales()[0];
  const bouton = (texte: string, dans = modales().at(-1)!) => [...dans.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const conditions = () => [...modale().querySelectorAll('[data-testid="condition"]')] as HTMLElement[];
  const effectif = () => modale().querySelector('[data-testid="effectif"]') as HTMLElement;
  const detecter = () => {
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };
  const saisirNom = (nom: string) => {
    const input = modale().querySelector('soc-input-text input') as HTMLInputElement;
    input.value = nom;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };
  const condition = (i: number) => formulaire['form'].controls.conditions.at(i).controls;

  const ouvrir = (population: Population | null = null) => {
    fixture = TestBed.createComponent(HoteComponent);
    fixture.componentInstance.population.set(population);
    formulaire = fixture.debugElement.query(By.directive(PopulationFormDialogComponent)).componentInstance as unknown as Formulaire;
    detecter();
  };

  afterEach(() => fixture.destroy());

  describe('création', () => {
    beforeEach(fakeAsync(() => ouvrir()));

    it('modale « Nouvelle population » sur un seul écran, avec une condition vide', () => {
      expect(modale().textContent).toContain('Nouvelle population');
      expect(modale().textContent).toContain('Définissez les informations et les critères de filtrage.');
      const champs = [...modale().querySelectorAll('soc-input-text input')].map((i) => i.getAttribute('placeholder'));
      expect(champs).toEqual(['Ex : Managers – périmètre hiérarchique', 'Décris le périmètre en une phrase...']);
      expect(conditions().length).toBe(1);
      expect(bouton('Créer la population', modale())).toBeTruthy();
    });

    it('exige un nom', fakeAsync(() => {
      bouton('Créer la population').click();
      detecter();
      expect(modale().textContent).toContain('Le nom est obligatoire.');
      expect(fixture.componentInstance.resultat).toBeNull();
    }));

    it('corbeille désactivée tant qu’il ne reste qu’une condition ; ajout de conditions avec le badge ET / OU', () => {
      const corbeille = () => modale().querySelectorAll<HTMLButtonElement>('[aria-label="Supprimer la condition"]');
      expect(corbeille()[0].disabled).toBeTrue();
      bouton('Ajouter une condition', modale()).click();
      fixture.detectChanges();
      expect(conditions().length).toBe(2);
      expect(corbeille()[0].disabled).toBeFalse();
      expect(modale().querySelector('[data-testid="liaison"]')?.textContent?.trim()).toBe('ET');
      expect(modale().querySelector('[data-testid="indication"]')?.textContent).toContain('Toutes les conditions doivent être vraies.');

      formulaire['form'].controls.combinaison.setValue('OU');
      fixture.detectChanges();
      expect(modale().querySelector('[data-testid="liaison"]')?.textContent?.trim()).toBe('OU');
      expect(modale().querySelector('[data-testid="indication"]')?.textContent).toContain('Au moins une condition doit être vraie.');

      corbeille()[1].click();
      fixture.detectChanges();
      expect(conditions().length).toBe(1);
    });

    it('calcule l’effectif en direct, en rouge à 0 ; valeurs en multi-sélection', () => {
      expect(effectif().textContent?.trim()).toBe('0');
      expect(effectif().closest('.effectif')?.classList).toContain('effectif--vide');
      condition(0).champ.setValue('site');
      condition(0).valeurs.setValue(['Dakar', 'Thiès']);
      fixture.detectChanges();
      expect(effectif().textContent?.trim()).toBe('12');
      expect(effectif().closest('.effectif')?.classList).not.toContain('effectif--vide');
      expect(modale().textContent).toContain('personne(s) dans ce périmètre');

      condition(0).operateur.setValue('nest_pas');
      fixture.detectChanges();
      expect(effectif().textContent?.trim()).toBe('11');
    });

    it('changer de champ vide les valeurs', () => {
      condition(0).valeurs.setValue(['Dakar']);
      condition(0).champ.setValue('sexe');
      expect(condition(0).valeurs.value).toEqual([]);
    });

    it('exige au moins une valeur par condition', fakeAsync(() => {
      saisirNom('Nouvelle');
      bouton('Créer la population').click();
      detecter();
      expect(modale().textContent).toContain('Choisissez au moins une valeur.');
      expect(fixture.componentInstance.resultat).toBeNull();
    }));

    it('crée la population', fakeAsync(() => {
      saisirNom('Femmes en CDI');
      condition(0).champ.setValue('sexe');
      condition(0).valeurs.setValue(['Femme']);
      bouton('Ajouter une condition', modale()).click();
      condition(1).champ.setValue('typeContrat');
      condition(1).valeurs.setValue(['CDI']);
      fixture.detectChanges();
      bouton('Créer la population').click();
      detecter();
      const { population, creation } = fixture.componentInstance.resultat!;
      expect(creation).toBeTrue();
      expect(population.nom).toBe('Femmes en CDI');
      expect(population.conditions).toEqual([
        { champ: 'sexe', operateur: 'est', valeurs: ['Femme'] },
        { champ: 'typeContrat', operateur: 'est', valeurs: ['CDI'] },
      ]);
    }));

    it('nom identique : « Population similaire détectée », puis création quand même', fakeAsync(() => {
      saisirNom('équipe sénégal');
      condition(0).valeurs.setValue(['Dakar']);
      bouton('Créer la population').click();
      detecter();
      expect(modales().length).toBe(2);
      const alerte = modales()[1];
      expect(alerte.textContent).toContain('Population similaire détectée');
      expect(alerte.textContent).toContain('Une population avec le nom « équipe sénégal » existe déjà. Voulez-vous quand même la créer ?');

      bouton('Annuler', alerte).click();
      detecter();
      expect(modales().length).toBe(1);
      expect(fixture.componentInstance.resultat).toBeNull();

      bouton('Créer la population').click();
      detecter();
      bouton('Créer quand même').click();
      detecter();
      expect(fixture.componentInstance.resultat?.creation).toBeTrue();
    }));

    it('Annuler ferme sans rien créer', () => {
      bouton('Annuler', modale()).click();
      expect(fixture.componentInstance.annule).toBeTrue();
    });
  });

  describe('modification', () => {
    it('recharge nom, description et conditions ; population non utilisée : enregistrement direct', fakeAsync(() => {
      ouvrir(POPULATIONS.find((p) => p.id === 'pop-7')!);
      expect(modale().textContent).toContain('Modifier la population');
      expect(modale().textContent).toContain('Modifiez les informations et les critères de filtrage.');
      expect(formulaire['form'].controls.nom.value).toBe('Inactifs Dakar');
      expect(conditions().length).toBe(2);
      expect(condition(1).valeurs.value).toEqual(['Dakar']);
      expect(effectif().textContent?.trim()).toBe('0');

      bouton('Enregistrer les modifications').click();
      detecter();
      expect(modales().length).toBe(1);
      expect(fixture.componentInstance.resultat?.creation).toBeFalse();
    }));

    it('population utilisée : modale d’impact avant d’enregistrer', fakeAsync(() => {
      const update = spyOn(TestBed.inject(PopulationsService), 'update').and.callThrough();
      ouvrir(POPULATIONS.find((p) => p.id === 'pop-1')!);
      bouton('Enregistrer les modifications').click();
      detecter();
      const impact = modales().at(-1)!;
      expect(impact.textContent).toContain('Modifier la population ?');
      bouton('Appliquer les modifications', impact).click();
      detecter();
      expect(update).toHaveBeenCalledWith('pop-1', jasmine.objectContaining({ nom: 'Équipe Sénégal' }), jasmine.any(Array));
      expect(fixture.componentInstance.resultat?.creation).toBeFalse();
    }));
  });
});
