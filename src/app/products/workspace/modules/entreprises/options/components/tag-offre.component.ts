import { Component, input } from '@angular/core';
import { SocTag } from '@socium-design/angular-components';
import { SocLabsTag } from '../../../../../../shared/labs/labs';
import type { OffreOption } from '../../models/option-entreprise.model';
import { TAGS_OFFRE, TAG_CUSTOMISATION } from '../options-entreprise';

/**
 * Tags d'offre d'une option : « Payant » ou « Standard », puis « Customisation client » le cas échéant. Texte toujours
 * présent, la couleur n'est qu'un repère.
 */
@Component({
  selector: 'app-tag-offre',
  imports: [SocTag, SocLabsTag],
  styles: ':host { display: contents; }',
  template: `
    @switch (offre()) {
      @case ('payant') {
        <soc-tag color="orange">{{ tags.payant.libelle }}</soc-tag>
      }
      @case ('standard') {
        <soc-labs-tag>{{ tags.standard.libelle }}</soc-labs-tag>
      }
    }
    @if (customisation()) {
      <soc-tag color="purple">{{ customisationTag.libelle }}</soc-tag>
    }
  `,
})
export class TagOffreComponent {
  readonly offre = input.required<OffreOption>();
  readonly customisation = input(false);
  protected readonly tags = TAGS_OFFRE;
  protected readonly customisationTag = TAG_CUSTOMISATION;
}
