import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { SocTableFilterSelect } from '@socium-design/angular-components';
import { ObjectifsPageComponent } from './objectifs-page.component';
import { ObjectifsService } from './services/objectifs.service';

describe('ObjectifsPageComponent', () => {
  let fixture: ComponentFixture<ObjectifsPageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const groupes = () => [...el().querySelectorAll('tbody[data-group]')] as HTMLElement[];
  const noms = () => groupes().map((g) => g.querySelector('soc-avatar')!.textContent!.replace(/\s+/g, ' ').trim());
  const lignes = (g: HTMLElement) => [...g.querySelectorAll('tr[data-row]')] as HTMLElement[];
  const resume = () => el().querySelector('[data-testid="resume-pagination"]')!.textContent!.trim();
  const filtre = (testid: string) =>
    fixture.debugElement.query(By.css(`[data-testid="${testid}"]`)).injector.get(SocTableFilterSelect) as SocTableFilterSelect;

  function choisir(testid: string, valeur: string): void {
    filtre(testid).value.set(valeur);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(ObjectifsPageComponent);
    fixture.detectChanges();
  });

  it("reprend la structure de la prod : fil d'Ariane, onglets, titre et compteur, bouton principal", () => {
    expect(el().querySelector('soc-breadcrumb')!.textContent).toContain('Objectifs');
    const pilules = [...el().querySelectorAll('[role="tab"]')].map((t) => t.textContent!.trim());
    expect(pilules.slice(0, 3)).toEqual(['Objectifs', 'Plans stratégiques', "Contrats d'objectifs"]);
    expect(pilules.slice(3)).toEqual(['Actifs (22)', 'Clôturés (2)', 'À valider (2)', 'Soumis à validation (1)']);
    expect(el().querySelector('h1')!.textContent).toContain('Objectifs');
    expect(el().querySelector('[data-testid="total"]')!.textContent!.trim()).toBe('24');
    expect(el().textContent).toContain('Créer un objectif');
  });

  it('groupe les objectifs actifs par collaborateur du périmètre, groupes dépliés', () => {
    expect(noms()).toEqual(['AD Absatou Diallo EMP-1008', 'AD Awa Diop EMP-1001', 'MC Mariama Cissé EMP-1012', 'MN Moussa Ndiaye EMP-1002']);
    expect(groupes()[1].querySelector('[data-testid="total-groupe"]')!.textContent!.trim()).toBe('10 objectif(s) au total');
    expect(lignes(groupes()[1]).length).toBe(10);
    expect(resume()).toBe('1 - 4 sur 4 collaborateurs — page 1/1');
  });

  it('affiche les colonnes de la prod et le type en petites capitales', () => {
    const entetes = [...el().querySelectorAll('thead th')].map((th) => th.textContent!.trim());
    expect(entetes).toEqual(['Objectif', 'Période', 'Statut', 'Pondération', 'Progression', 'Origine', 'Action']);
    const ligne = lignes(groupes()[1])[0];
    expect(ligne.querySelector('[data-testid="titre-objectif"]')!.textContent!.trim()).toBe('Migrer le portail RH vers Angular 19');
    expect(ligne.textContent).toContain('QUALITATIVE');
    expect(ligne.textContent).toContain('01/05/2026 - 30/11/2026');
    expect(ligne.querySelector('soc-labs-tag')!.textContent!.trim()).toBe('En cours');
    expect(ligne.querySelector('soc-labs-progress-ring')!.getAttribute('aria-valuetext')).toBe('60 %');
    expect(ligne.textContent).toContain('Objectif libre');
    expect(ligne.textContent).toContain('Mettre à jour');
  });

  it('replie un groupe et déplie les sous-objectifs avec le chevron', () => {
    const awa = () => groupes()[1];
    const parent = lignes(awa()).find((l) => l.textContent!.includes('Fiabiliser la chaîne de déploiement'))!;
    expect(parent.textContent).not.toContain('Mettre à jour');
    (parent.querySelector('button[data-toggle="row"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(lignes(awa()).length).toBe(12);
    expect(lignes(awa()).filter((l) => l.getAttribute('data-depth') === '1').map((l) => l.querySelector('a')!.textContent!.trim())).toEqual([
      'Automatiser les tests de bout en bout',
      'Mettre en place les environnements de recette',
    ]);
    (awa().querySelector('button[data-toggle="group"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(lignes(awa()).length).toBe(0);
  });

  it('« Tout déplier » ouvre les groupes et les sous-objectifs, puis « Tout replier » referme tout', () => {
    const bouton = () => el().querySelector('[data-testid="tout-deplier"]') as HTMLButtonElement;
    expect(bouton().textContent!.trim()).toBe('Tout déplier');
    bouton().click();
    fixture.detectChanges();
    expect(el().querySelectorAll('tr[data-depth="1"]').length).toBe(5);
    expect(bouton().textContent!.trim()).toBe('Tout replier');
    bouton().click();
    fixture.detectChanges();
    expect(el().querySelectorAll('tr[data-row]').length).toBe(0);
  });

  it('recherche un collaborateur par nom', () => {
    const input = el().querySelector('[data-testid="recherche"] input') as HTMLInputElement;
    input.value = 'moussa';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(noms()).toEqual(['MN Moussa Ndiaye EMP-1002']);
  });

  it('filtre par statut, structure et onglet de statut', () => {
    choisir('filtre-statut', 'À venir');
    expect(noms().map((n) => n.split(' ').slice(1, 3).join(' '))).toEqual(['Awa Diop', 'Mariama Cissé']);
    choisir('filtre-statut', '');
    choisir('filtre-structure', 'drh');
    expect(noms().map((n) => n.split(' ').slice(1, 3).join(' '))).toEqual(['Absatou Diallo', 'Moussa Ndiaye']);
    choisir('filtre-structure', '');
    const cloture = [...el().querySelectorAll('[role="tab"]')].find((t) => t.textContent!.trim().startsWith('Clôturés')) as HTMLButtonElement;
    cloture.click();
    fixture.detectChanges();
    expect(groupes().map((g) => lignes(g).length)).toEqual([1, 1]);
  });

  it('« Période » et « Préciser une période » s\'excluent', () => {
    choisir('filtre-periode', 's1-2026');
    const titres = () => el().querySelectorAll('[data-testid="titre-objectif"]');
    const tous = [...titres()].map((a) => a.textContent!.trim());
    expect(tous).not.toContain('Préparer la migration des données 2027'); // novembre 2026 → février 2027
    expect(tous).toContain("Former deux développeurs à l'accessibilité"); // avril 2026
    const date = el().querySelector('[data-testid="filtre-date"] input') as HTMLInputElement;
    date.value = '2026-08-20';
    date.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(filtre('filtre-periode').value()).toBe('');
    expect(lignes(groupes()[0]).every((l) => l.textContent!.includes('2026'))).toBeTrue();
  });

  it('sélecteur de collaborateurs : N-1, Mes objectifs, Sans objectif', () => {
    choisir('filtre-vue', 'n1');
    expect(noms()).toEqual(['MN Moussa Ndiaye EMP-1002']);
    choisir('filtre-vue', 'mes');
    expect(noms()).toEqual(['AD Absatou Diallo EMP-1008']);
    choisir('filtre-vue', 'sans');
    expect(groupes().length).toBe(10);
    expect(resume()).toBe('1 - 10 sur 16 collaborateurs — page 1/2');
    expect(groupes()[0].querySelector('[data-testid="total-groupe"]')!.textContent!.trim()).toBe('0 objectif(s) au total');
  });

  it('état vide : message et pagination à zéro', () => {
    choisir('filtre-filiale', 'France');
    choisir('filtre-statut', 'À venir');
    choisir('filtre-structure', 'daf');
    expect(groupes().length).toBe(0);
    expect(el().querySelector('tbody td')!.textContent!.trim()).toBe('Aucun résultat ne correspond à votre recherche.');
    expect(resume()).toBe('0 - 0 sur 0 collaborateurs — page 0/0');
  });

  it("« + Créer un objectif » d'un groupe ouvre la création pour ce collaborateur", () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const bouton = groupes()[3].querySelector('button[aria-label="Créer un objectif pour Moussa Ndiaye"]') as HTMLButtonElement;
    bouton.click();
    expect(router.navigate).toHaveBeenCalledWith(['/perf/objectifs', 'nouveau'], { queryParams: { employe: '2' } });
  });

  it('les onglets Plans stratégiques et Contrats d\'objectifs sont « Bientôt disponible »', () => {
    ([...el().querySelectorAll('[role="tab"]')][1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="bientot"]')!.textContent).toContain('Bientôt disponible');
    expect(groupes().length).toBe(0);
  });

  it('affiche le message de succès laissé par la création', () => {
    TestBed.inject(ObjectifsService).annoncer('Objectif créé pour 9 employé(s)');
    fixture = TestBed.createComponent(ObjectifsPageComponent);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="message"]')!.textContent!.trim()).toBe('Objectif créé pour 9 employé(s)');
  });
});
