import { CdkDrag, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import {
  LucideArrowLeftRight,
  LucideCalendarX,
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideFolder,
  LucidePlus,
  LucideUserPlus,
  LucideUsers,
  LucideWallet,
} from '@lucide/angular';
import { SocBadge, SocSearchBar } from '@socium-design/angular-components';
import { SocLabsChartTypeChip, SocLabsIconButton, SocLabsInlineEdit, SocLabsListRow, SocLabsListRowAction, SocLabsListRowLeading } from '../../../../../../shared/labs/labs';
import { TYPES_GRAPHIQUES } from '../../../tableau-de-bord/models/graphique.types';
import type { TableauDeBord } from '../../../tableau-de-bord/models/tableau-de-bord.model';
import type { IndicateurCatalogue, SectionAvecIndicateurs } from '../../../tableau-de-bord/services/catalogue';

/**
 * Bibliothèque de la composition : catalogue d'indicateurs par section (repliables, renommables sur place pour ce tableau
 * de bord), recherche, compteur des graphes ajoutés (seulement s'il y en a). Ajout par « + » ou glisser-déposer (CDK) ;
 * ligne « ajoutée » ; ligne verrouillée pour un indicateur non souscrit.
 * Labs : `soc-labs-list-row`, `soc-labs-chart-type-chip`, `soc-labs-icon-button`, `soc-labs-inline-edit`.
 */
@Component({
  selector: 'app-bibliotheque',
  imports: [
    CdkDropList, CdkDrag, CdkDragPlaceholder, SocBadge, SocSearchBar, SocLabsListRow, SocLabsListRowLeading, SocLabsListRowAction,
    SocLabsChartTypeChip, SocLabsIconButton, SocLabsInlineEdit, LucidePlus, LucideCheck, LucideChevronDown, LucideChevronRight, LucideUsers,
    LucideUserPlus, LucideArrowLeftRight, LucideWallet, LucideCalendarX, LucideFolder,
  ],
  styleUrl: './bibliotheque.component.scss',
  template: `
    <p class="bibliotheque__titre">BIBLIOTHÈQUE</p>
    <soc-search-bar placeholder="Rechercher un graphe..." [value]="recherche()" (valueChange)="recherche.set($event)" (clear)="recherche.set('')" />

    @for (section of sections(); track section.id) {
      <div class="section" data-testid="section-bibliotheque">
        <div class="section__entete">
          <soc-labs-icon-button
            size="xs"
            [ariaLabel]="(estRepliee(section.id) ? 'Déplier ' : 'Replier ') + section.libelle"
            [attr.aria-expanded]="!estRepliee(section.id)"
            (click)="basculer(section.id)"
          >
            @if (estRepliee(section.id)) {
              <svg lucideChevronRight class="size-full"></svg>
            } @else {
              <svg lucideChevronDown class="size-full"></svg>
            }
          </soc-labs-icon-button>
          <span class="section__icone" aria-hidden="true">
            @switch (section.id) {
              @case ('capital-humain') { <svg lucideUsers class="size-full" [strokeWidth]="1.5"></svg> }
              @case ('recrutement') { <svg lucideUserPlus class="size-full" [strokeWidth]="1.5"></svg> }
              @case ('mouvements') { <svg lucideArrowLeftRight class="size-full" [strokeWidth]="1.5"></svg> }
              @case ('masse-salariale') { <svg lucideWallet class="size-full" [strokeWidth]="1.5"></svg> }
              @case ('absences') { <svg lucideCalendarX class="size-full" [strokeWidth]="1.5"></svg> }
              @default { <svg lucideFolder class="size-full" [strokeWidth]="1.5"></svg> }
            }
          </span>
          <soc-labs-inline-edit
            class="section__nom"
            ariaLabel="le nom de la section"
            [value]="section.libelle"
            [defaultValue]="section.libelleCatalogue"
            [maxlength]="60"
            (valueChange)="renommerSection.emit({ sectionId: section.id, libelle: $event })"
            data-testid="nom-section"
          />
          @if (section.ajoutes) {
            <soc-badge color="primary" data-testid="compteur">{{ section.ajoutes }}</soc-badge>
          }
        </div>

        @if (!estRepliee(section.id)) {
          <div class="section__liste" role="list" cdkDropList [cdkDropListSortingDisabled]="true" [cdkDropListEnterPredicate]="refuserDepot">
            @for (indicateur of section.indicateurs; track indicateur.id) {
              @let ajoute = ajoutes().has(indicateur.id);
              <soc-labs-list-row
                [title]="indicateur.titre"
                [subtitle]="indicateur.disponible ? type(indicateur) : 'Produit non souscrit'"
                [selected]="ajoute"
                [locked]="!indicateur.disponible"
                [lockedReason]="indicateur.disponible ? undefined : 'Produit non souscrit'"
                [draggable]="indicateur.disponible && !ajoute"
                cdkDrag
                [cdkDragData]="indicateur.id"
                [cdkDragDisabled]="!indicateur.disponible || ajoute"
                [attr.data-testid]="indicateur.disponible ? 'indicateur' : 'indicateur-indisponible'"
              >
                <!-- Emplacement vide : la ligne ne s'efface pas de la Bibliothèque pendant le glisser. -->
                <div *cdkDragPlaceholder class="section__emplacement"></div>
                <soc-labs-chart-type-chip socLabsListRowLeading [type]="indicateur.typeGraphique" [decorative]="true" />
                @if (ajoute) {
                  <svg socLabsListRowAction lucideCheck class="ligne__ajoute" [strokeWidth]="2" role="img" [attr.aria-label]="indicateur.titre + ' ajouté'"></svg>
                } @else if (indicateur.disponible) {
                  <soc-labs-icon-button socLabsListRowAction variant="primary-subtle" [ariaLabel]="'Ajouter ' + indicateur.titre" (click)="ajouter.emit(indicateur)">
                    <svg lucidePlus class="size-full"></svg>
                  </soc-labs-icon-button>
                }
              </soc-labs-list-row>
            }
          </div>
        }
      </div>
    } @empty {
      <p class="bibliotheque__vide">Aucun graphe ne correspond.</p>
    }
  `,
})
export class BibliothequeComponent {
  readonly catalogue = input.required<SectionAvecIndicateurs[]>();
  readonly tableau = input.required<TableauDeBord>();
  readonly ajouter = output<IndicateurCatalogue>();
  readonly renommerSection = output<{ sectionId: string; libelle: string }>();

  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly recherche = signal('');
  private readonly repliees = signal<ReadonlySet<string>>(new Set());

  /** Indicateurs déjà présents dans le tableau de bord. */
  protected readonly ajoutes = computed(() => new Set(this.tableau().widgets.map((w) => w.indicateurId)));

  /** Sections du catalogue, sous le nom choisi pour ce tableau, filtrées par la recherche. */
  protected readonly sections = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    return this.catalogue()
      .map((section) => ({
        ...section,
        libelleCatalogue: section.libelle,
        libelle: this.tableau().sections.find((s) => s.id === section.id)?.libelle ?? section.libelle,
        ajoutes: section.indicateurs.filter((i) => this.ajoutes().has(i.id)).length,
        indicateurs: section.indicateurs.filter((i) => !q || i.titre.toLowerCase().includes(q)),
      }))
      .filter((section) => section.indicateurs.length > 0);
  });

  /** La Bibliothèque est en lecture seule : on ne peut rien y déposer. */
  protected readonly refuserDepot = () => false;

  /** Une recherche déplie tout, pour montrer les résultats. */
  protected estRepliee(sectionId: string): boolean {
    return !this.recherche().trim() && this.repliees().has(sectionId);
  }

  protected basculer(sectionId: string): void {
    const repliees = new Set(this.repliees());
    if (!repliees.delete(sectionId)) repliees.add(sectionId);
    this.repliees.set(repliees);
  }

  /** Donne le focus à la recherche (clic sur une zone de dépôt de la composition). */
  focusRecherche(): void {
    this.hote.nativeElement.querySelector<HTMLInputElement>('soc-search-bar input')?.focus();
  }

  protected type(indicateur: IndicateurCatalogue): string {
    return TYPES_GRAPHIQUES[indicateur.typeGraphique].libelle;
  }
}
