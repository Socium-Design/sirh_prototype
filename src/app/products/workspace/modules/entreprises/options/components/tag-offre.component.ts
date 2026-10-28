import { Component, input } from '@angular/core';
import { SocTag } from '@socium-design/angular-components';
import { SocLabsTag } from '../../../../../../shared/labs/labs';
import type { OffreOption } from '../../models/option-entreprise.model';
import { TAGS_OFFRE } from '../options-entreprise';

/** Tag d'offre d'une option : texte toujours présent (« Payant », « Standard », « Customisation client »). */
@Component({
  selector: 'app-tag-offre',
  imports: [SocTag, SocLabsTag],
  template: `
    @switch (offre()) {
      @case ('payant') {
        <soc-tag color="orange">{{ tags.payant.libelle }}</soc-tag>
      }
      @case ('standard') {
        <soc-labs-tag>{{ tags.standard.libelle }}</soc-labs-tag>
      }
      @case ('customisation') {
        <soc-tag color="purple">{{ tags.customisation.libelle }}</soc-tag>
      }
    }
  `,
})
export class TagOffreComponent {
  readonly offre = input<OffreOption | null>(null);
  protected readonly tags = TAGS_OFFRE;
}
