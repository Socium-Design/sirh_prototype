import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { POPULATION_USAGES } from '../../../../../../../mocks/data/population-usages.mock';
import { ModeImpact, PopulationImpactDialogComponent } from './population-impact-dialog.component';

@Component({
  imports: [PopulationImpactDialogComponent],
  template: `<app-population-impact-dialog [open]="open()" [mode]="mode()" populationNom="Équipe Sénégal" [usages]="usages" (confirm)="confirme = $event" (cancel)="annule = true" />`,
})
class HoteComponent {
  readonly open = signal(true);
  readonly mode = signal<ModeImpact>('modification');
  readonly usages = POPULATION_USAGES.filter((u) => u.populationId === 'pop-1');
  confirme: string[] | null = null;
  annule = false;
}

describe('PopulationImpactDialogComponent', () => {
  let fixture: ComponentFixture<HoteComponent>;
  const cases = () => [...document.body.querySelectorAll('[role="dialog"][aria-modal="true"] [role="checkbox"]')] as HTMLButtonElement[];
  const bouton = (texte: string) =>
    [...document.body.querySelectorAll('[role="dialog"][aria-modal="true"] button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('liste chaque élément concerné, tout coché par défaut', () => {
    expect(cases().length).toBe(3);
    expect(cases().every((c) => c.getAttribute('aria-checked') === 'true')).toBeTrue();
    expect(document.body.querySelector('[role="dialog"][aria-modal="true"]')?.textContent).toContain('Dashboard RH Global');
  });

  it('modification : ne confirme que les éléments cochés', () => {
    cases()[1].click();
    fixture.detectChanges();
    bouton('Appliquer').click();
    expect(fixture.componentInstance.confirme).toEqual(['usage-1', 'usage-3']);
  });

  it('modification : tout décocher est permis (tous gardent l’ancienne version)', () => {
    cases().forEach((c) => c.click());
    fixture.detectChanges();
    bouton('Appliquer').click();
    expect(fixture.componentInstance.confirme).toEqual([]);
  });

  it('suppression : exige au moins un élément coché', () => {
    fixture.componentInstance.mode.set('suppression');
    fixture.detectChanges();
    cases().forEach((c) => c.click());
    fixture.detectChanges();
    bouton('Supprimer').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.confirme).toBeNull();
    expect(document.body.querySelector('[role="dialog"][aria-modal="true"]')?.textContent).toContain('Cochez au moins un élément');
  });

  it('se ferme sans rien confirmer sur Annuler', () => {
    bouton('Annuler').click();
    expect(fixture.componentInstance.annule).toBeTrue();
    expect(fixture.componentInstance.confirme).toBeNull();
  });
});
