import { Component, computed, input } from '@angular/core';
import { SocTag, SocTooltip, SocTooltipContent } from '@socium-design/angular-components';
import { dateCourte, dateLongue } from '../options-entreprise';

/**
 * Badge « Nouveau · {date} » d'une option récente (tag `information` du kit, 5,9:1), avec une infobulle qui dit quoi en
 * faire. Le badge est focalisable pour que l'infobulle s'ouvre au clavier ; le lecteur d'écran lit le texte complet.
 */
@Component({
  selector: 'app-badge-nouveau',
  imports: [SocTag, SocTooltip, SocTooltipContent],
  styles: `
    .badge {
      position: relative;
      display: inline-flex;
      border-radius: var(--bridges-shape-figure-radius-sm);
    }

    .badge:focus-visible {
      outline: var(--bridges-shape-line-thick) solid var(--bridges-color-border-focus);
      outline-offset: var(--bridges-position-gap-xs);
    }
  `,
  template: `
    <soc-tooltip variant="extend" [title]="ajoutee()">
      <span class="badge" tabindex="0" data-testid="badge-nouveau">
        <soc-tag color="information" aria-hidden="true">Nouveau · {{ courte() }}</soc-tag>
        <span class="sr-only">Nouveau. {{ ajoutee() }} {{ conseil }}</span>
      </span>
      <span socTooltipContent aria-hidden="true">{{ conseil }}</span>
    </soc-tooltip>
  `,
})
export class BadgeNouveauComponent {
  /** Date ISO d'ajout de l'option. */
  readonly date = input.required<string>();

  protected readonly conseil = "À vérifier : si elle est standard, vous pouvez l'activer pour ce client.";
  protected readonly courte = computed(() => dateCourte(this.date()));
  protected readonly ajoutee = computed(() => `Ajoutée le ${dateLongue(this.date())}.`);
}
