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

  afterEach(() => fixture?.destroy());

  it('propose les six types du catalogue, dont l’histogramme empilé', () => {
    expect(Object.values(TYPES_GRAPHIQUES).map((t) => t.libelle)).toEqual(['Courbe', 'Histogramme', 'Histogramme empilé', 'Camembert', 'Barres horiz.', 'Carte KPI']);
    expect(TYPES_GRAPHIQUES['barres-empilees']).toEqual(jasmine.objectContaining({ chartJs: 'bar', empile: true }));
  });

  it('carte KPI : valeur, unité et tendance favorable en vert', () => {
    const el = afficher('kpi', { libelles: [], series: [], valeur: 1234, unite: 'collaborateurs', tendance: { valeur: 13, periode: 'ce mois', hausseFavorable: true } });
    expect(el.querySelector('[data-testid="kpi"]')?.textContent?.replace(/\s/g, '')).toBe('1234collaborateurs');
    const tendance = el.querySelector('[data-testid="tendance"]')!;
    expect(tendance.textContent?.trim()).toBe('+13 ce mois');
    expect(tendance.classList).not.toContain('graphique__tendance--defavorable');
    expect(el.querySelector('canvas')).toBeNull();
  });

  it('carte KPI : une hausse défavorable (turnover, délai…) est en rouge', () => {
    const el = afficher('kpi', { libelles: [], series: [], valeur: 32, unite: 'jours', tendance: { valeur: 4, periode: 'ce mois', hausseFavorable: false } });
    expect(el.querySelector('[data-testid="tendance"]')?.classList).toContain('graphique__tendance--defavorable');
  });

  it('dessine chaque type Chart.js dans un canvas, avec un texte alternatif', () => {
    for (const type of (Object.keys(TYPES_GRAPHIQUES) as TypeGraphique[]).filter((t) => TYPES_GRAPHIQUES[t].chartJs)) {
      const el = afficher(type, serie);
      const canvas = el.querySelector('canvas')!;
      expect(Chart.getChart(canvas)).withContext(type).toBeDefined();
      expect(canvas.getAttribute('aria-label')).toBe('Employés : Dakar 6, Paris 5');
      fixture.destroy();
    }
  });

  it('histogramme empilé : axes empilés, couleur imposée par la série (statut)', () => {
    afficher('barres-empilees', {
      libelles: ['Nov.', 'Déc.'],
      series: [
        { libelle: 'Validée', valeurs: [3, 4], couleur: 'green' },
        { libelle: 'Refusée', valeurs: [1, 0], couleur: 'red' },
      ],
    });
    const graphique = Chart.getChart(fixture.nativeElement.querySelector('canvas'))!;
    const echelles = graphique.options.scales as Record<string, { stacked?: boolean }>;
    expect(echelles['x'].stacked).toBeTrue();
    expect(echelles['y'].stacked).toBeTrue();
    const css = getComputedStyle(fixture.nativeElement);
    const couleur = (nom: string) => css.getPropertyValue(`--bridges-color-accent-${nom}-text`).trim();
    expect(graphique.data.datasets.map((d) => d.backgroundColor)).toEqual([couleur('green'), couleur('red')]);
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
