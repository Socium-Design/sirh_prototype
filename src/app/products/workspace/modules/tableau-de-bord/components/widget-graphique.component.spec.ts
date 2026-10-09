import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart } from 'chart.js';
import { TYPES_GRAPHIQUES, type TypeGraphique } from '../models/graphique.types';
import type { DonneesGraphique } from '../models/indicateur.model';
import { WidgetGraphiqueComponent } from './widget-graphique.component';

describe('WidgetGraphiqueComponent', () => {
  let fixture: ComponentFixture<WidgetGraphiqueComponent>;
  const serie: DonneesGraphique = { libelles: ['Dakar', 'Paris'], series: [{ libelle: 'Employés', valeurs: [6, 5] }] };
  const afficher = (type: TypeGraphique, donnees: DonneesGraphique) => {
    fixture = TestBed.createComponent(WidgetGraphiqueComponent);
    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('donnees', donnees);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => fixture.destroy());

  it('affiche un KPI chiffré sans graphique', () => {
    const el = afficher('kpi', { libelles: [], series: [], valeur: 1234, unite: 'employés' });
    expect(el.querySelector('[data-testid="kpi"]')?.textContent?.replace(/\s/g, '')).toBe('1234');
    expect(el.querySelector('canvas')).toBeNull();
  });

  it('dessine chaque type Chart.js dans un canvas, avec un texte alternatif', () => {
    for (const type of (Object.keys(TYPES_GRAPHIQUES) as TypeGraphique[]).filter((t) => TYPES_GRAPHIQUES[t].chartJs && !TYPES_GRAPHIQUES[t].jauge)) {
      const el = afficher(type, serie);
      const canvas = el.querySelector('canvas')!;
      expect(Chart.getChart(canvas)).withContext(type).toBeDefined();
      expect(canvas.getAttribute('aria-label')).toBe('Employés : Dakar 6, Paris 5');
      fixture.destroy();
    }
  });

  it('affiche une jauge avec sa valeur sur le maximum', () => {
    const el = afficher('jauge', { libelles: [], series: [], valeur: 16, max: 23, unite: 'entretiens' });
    expect(Chart.getChart(el.querySelector('canvas')!)).toBeDefined();
    expect(el.querySelector('[data-testid="jauge"]')?.textContent?.trim()).toBe('16 / 23 entretiens (70 %)');
  });

  it('redessine quand les données changent et libère le graphique à la destruction', () => {
    const el = afficher('histogramme', serie);
    const canvas = el.querySelector('canvas')!;
    fixture.componentRef.setInput('donnees', { ...serie, series: [{ libelle: 'Employés', valeurs: [1, 2] }] });
    fixture.detectChanges();
    expect(Chart.getChart(canvas)?.data.datasets[0].data).toEqual([1, 2]);
    fixture.destroy();
    expect(Chart.getChart(canvas)).toBeUndefined();
  });
});
