import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmployesPageComponent } from './employes-page.component';

describe('EmployesPageComponent', () => {
  let fixture: ComponentFixture<EmployesPageComponent>;
  const rows = () => [...fixture.nativeElement.querySelectorAll('tbody tr')] as HTMLElement[];

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(EmployesPageComponent);
    fixture.detectChanges();
    tick(300); // le service simule 200 ms de latence réseau
    fixture.detectChanges();
  }));

  it('affiche la première page des employés avec leur nombre total', () => {
    expect(rows().length).toBe(10);
    expect(fixture.nativeElement.querySelector('soc-badge').textContent.trim()).toBe('23');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Employés');
  });

  it('affiche le statut sous forme de tag', () => {
    expect(rows()[0].querySelector('soc-tag')?.textContent?.trim()).toBe('Actif');
  });

  it('filtre par recherche et revient à la première page', () => {
    const input = fixture.nativeElement.querySelector('soc-search-bar input') as HTMLInputElement;
    input.value = 'finance';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(rows().length).toBeGreaterThan(0);
    expect(rows().length).toBeLessThan(10);
    expect(rows().every((r) => /finance/i.test(r.textContent ?? ''))).toBeTrue();
  });

  it('pagine : la page 3 contient le reste des 23 employés', () => {
    const page3 = [...fixture.nativeElement.querySelectorAll('soc-pagination button')].find((b: HTMLElement) => b.textContent?.trim() === '3') as HTMLButtonElement;
    page3.click();
    fixture.detectChanges();
    expect(rows().length).toBe(3);
  });
});
