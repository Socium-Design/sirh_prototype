import { CdkDrag, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideCheck, LucideGripVertical, LucideLock, LucidePencil, LucidePlus } from '@lucide/angular';
import {
  SocAccordion,
  SocAccordionRightSlot,
  SocBadge,
  SocButton,
  SocButtonLeftIcon,
  SocInputText,
  SocSearchBar,
  SocTooltip,
  SocTooltipLabel,
} from '@socium-design/angular-components';
import { IconeGraphiqueComponent } from '../../../tableau-de-bord/components/icone-graphique.component';
import { TYPES_GRAPHIQUES } from '../../../tableau-de-bord/models/graphique.types';
import type { TableauDeBord } from '../../../tableau-de-bord/models/tableau-de-bord.model';
import type { IndicateurCatalogue, SectionAvecIndicateurs } from '../../../tableau-de-bord/services/catalogue';

/**
 * Bibliothèque de la composition : catalogue d'indicateurs par section (repliables, renommables pour ce tableau de bord),
 * recherche, compteur de graphes ajoutés. Ajout par « + » ou glisser-déposer (CDK : le kit n'a pas de glisser-déposer,
 * GAP-DS #8) ; ✓ une fois ajouté ; cadenas pour un indicateur non souscrit.
 */
@Component({
  selector: 'app-bibliotheque',
  imports: [
    ReactiveFormsModule, CdkDropList, CdkDrag, CdkDragPlaceholder, SocAccordion, SocAccordionRightSlot, SocBadge, SocButton, SocButtonLeftIcon,
    SocInputText, SocSearchBar, SocTooltip, SocTooltipLabel, IconeGraphiqueComponent, LucideGripVertical, LucidePlus, LucideCheck, LucideLock,
    LucidePencil,
  ],
  styleUrl: './bibliotheque.component.scss',
  template: `
    <aside class="bibliotheque" aria-label="Bibliothèque" data-testid="bibliotheque">
      <p class="bibliotheque__titre">BIBLIOTHÈQUE</p>
      <soc-search-bar placeholder="Rechercher un graphe..." [value]="recherche()" (valueChange)="recherche.set($event)" (clear)="recherche.set('')" />

      @for (section of sections(); track section.id) {
        @if (enRenommage() === section.id) {
          <soc-input-text
            [formControl]="nom"
            label="Nom de la section"
            helperText="Entrée pour valider, Échap pour annuler."
            data-testid="renommage"
            (keydown.enter)="validerRenommage(section.id); $event.preventDefault()"
            (keydown.escape)="enRenommage.set(null)"
          />
        } @else {
          <soc-accordion [label]="section.libelle" [open]="true" data-testid="section-bibliotheque">
            <span socAccordionRightSlot class="bibliotheque__entete" (click)="$event.stopPropagation()">
              <soc-badge color="primary" data-testid="compteur">{{ section.ajoutes }}/{{ section.indicateurs.length }}</soc-badge>
              <soc-tooltip>
                <button socButton type="button" variant="ghost" aria-label="Renommer cette section" (click)="renommer(section.id, section.libelle)">
                  <svg lucidePencil socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                </button>
                <span socTooltipLabel>Renommer cette section</span>
              </soc-tooltip>
            </span>
            <div class="bibliotheque__liste" cdkDropList [cdkDropListSortingDisabled]="true" [cdkDropListEnterPredicate]="refuserDepot">
              @for (indicateur of section.indicateurs; track indicateur.id) {
                @if (indicateur.disponible) {
                  <div class="ligne" cdkDrag [cdkDragData]="indicateur.id" [cdkDragDisabled]="ajoutes().has(indicateur.id)" data-testid="indicateur">
                    <!-- Emplacement vide : la zone survolée ne s'agrandit pas pendant le glisser. -->
                    <div *cdkDragPlaceholder class="ligne__emplacement"></div>
                    <svg lucideGripVertical class="ligne__poignee" [strokeWidth]="1.5" aria-hidden="true"></svg>
                    <span class="ligne__icone"><app-icone-graphique [type]="indicateur.typeGraphique" /></span>
                    <span class="ligne__textes">
                      <span class="ligne__nom">{{ indicateur.titre }}</span>
                      <span class="ligne__type">{{ type(indicateur) }}</span>
                    </span>
                    @if (ajoutes().has(indicateur.id)) {
                      <svg lucideCheck class="ligne__ajoute" [strokeWidth]="2" role="img" [attr.aria-label]="indicateur.titre + ' ajouté'"></svg>
                    } @else {
                      <button socButton type="button" variant="ghost" [attr.aria-label]="'Ajouter ' + indicateur.titre" (click)="ajouter.emit(indicateur)">
                        <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                      </button>
                    }
                  </div>
                } @else {
                  <div class="ligne ligne--verrouillee" data-testid="indicateur-indisponible">
                    <svg lucideLock class="ligne__poignee" [strokeWidth]="1.5" aria-hidden="true"></svg>
                    <span class="ligne__icone"><app-icone-graphique [type]="indicateur.typeGraphique" /></span>
                    <span class="ligne__textes">
                      <span class="ligne__nom">{{ indicateur.titre }}</span>
                      <span class="ligne__type">Produit non souscrit</span>
                    </span>
                  </div>
                }
              }
            </div>
          </soc-accordion>
        }
      } @empty {
        <p class="ligne__type">Aucun graphe ne correspond.</p>
      }
    </aside>
  `,
})
export class BibliothequeComponent {
  readonly catalogue = input.required<SectionAvecIndicateurs[]>();
  readonly tableau = input.required<TableauDeBord>();
  readonly ajouter = output<IndicateurCatalogue>();
  readonly renommerSection = output<{ sectionId: string; libelle: string }>();

  protected readonly recherche = signal('');
  protected readonly enRenommage = signal<string | null>(null);
  protected readonly nom = new FormControl('', { nonNullable: true });

  /** Indicateurs déjà présents dans le tableau de bord. */
  protected readonly ajoutes = computed(() => new Set(this.tableau().widgets.map((w) => w.indicateurId)));

  /** Sections du catalogue, sous le nom choisi pour ce tableau, filtrées par la recherche. */
  protected readonly sections = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    return this.catalogue()
      .map((section) => ({
        ...section,
        libelle: this.tableau().sections.find((s) => s.id === section.id)?.libelle ?? section.libelle,
        ajoutes: section.indicateurs.filter((i) => this.ajoutes().has(i.id)).length,
        indicateurs: section.indicateurs.filter((i) => !q || i.titre.toLowerCase().includes(q)),
      }))
      .filter((section) => section.indicateurs.length > 0);
  });

  /** La Bibliothèque est en lecture seule : on ne peut rien y déposer. */
  protected readonly refuserDepot = () => false;

  protected type(indicateur: IndicateurCatalogue): string {
    return TYPES_GRAPHIQUES[indicateur.typeGraphique].libelle;
  }

  protected renommer(sectionId: string, libelle: string): void {
    this.nom.setValue(libelle);
    this.enRenommage.set(sectionId);
  }

  protected validerRenommage(sectionId: string): void {
    if (this.nom.value.trim()) this.renommerSection.emit({ sectionId, libelle: this.nom.value });
    this.enRenommage.set(null);
  }
}
