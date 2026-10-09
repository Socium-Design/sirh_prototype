import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModeImpact, PopulationImpactDialogComponent } from './population-impact-dialog.component';

@Component({
  imports: [PopulationImpactDialogComponent],
  template: `<app-population-impact-dialog [open]="open()" [mode]="mode()" populationNom="Équipe Sénégal" [usages]="usages" (confirm)="confirme = $event" (cancel)="annule = true" />`,
})
class HoteComponent {
  readonly open = signal(true);
  readonly mode = signal<ModeImpact>('modification');
  readonly usages = [
    { id: 'tdb-1', libelle: 'Dashboard RH Global' },
    { id: 'tdb-2', libelle: 'Dashboard Direction Générale' },
    { id: 'tdb-3', libelle: 'Dashboard Managers' },
  ];
  confirme: string[] | null = null;
  annule = false;
}

describe('PopulationImpactDialogComponent', () => {
  let fixture: ComponentFixture<HoteComponent>;
  const modale = () => document.body.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
  const cases = () => [...modale().querySelectorAll('[role="checkbox"]')] as HTMLButtonElement[];
  const bouton = (texte: string) => [...modale().querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const compteur = () => modale().querySelector('[data-testid="compteur-impact"]')?.textContent?.trim();

  beforeEach(() => {
    fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('modification : titre, texte et dashboards tous cochés par défaut', () => {
    expect(modale().textContent).toContain('Modifier la population ?');
    expect(modale().textContent).toContain(
      "« Équipe Sénégal » est utilisée dans les dashboards suivants. Cochez ceux sur lesquels l'impact s'appliquera.",
    );
    expect(cases().length).toBe(3);
    expect(cases().every((c) => c.getAttribute('aria-checked') === 'true')).toBeTrue();
    expect(compteur()).toBe('3 / 3 dashboards sélectionnés');
  });

  it('modification : ne confirme que les dashboards cochés, compteur à jour', () => {
    cases()[1].click();
    fixture.detectChanges();
    expect(compteur()).toBe('2 / 3 dashboards sélectionnés');
    bouton('Appliquer les modifications').click();
    expect(fixture.componentInstance.confirme).toEqual(['tdb-1', 'tdb-3']);
  });

  it('suppression : « Supprimer quand même », au moins un dashboard coché', () => {
    fixture.componentInstance.mode.set('suppression');
    fixture.detectChanges();
    expect(modale().textContent).toContain('Supprimer la population ?');
    cases().forEach((c) => c.click());
    fixture.detectChanges();
    bouton('Supprimer quand même').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.confirme).toBeNull();
    expect(modale().textContent).toContain('Cochez au moins un dashboard.');
  });

  it('se ferme sans rien confirmer sur Annuler', () => {
    bouton('Annuler').click();
    expect(fixture.componentInstance.annule).toBeTrue();
    expect(fixture.componentInstance.confirme).toBeNull();
  });
});
