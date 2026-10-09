import type { CanDeactivateFn } from '@angular/router';
import type { Observable } from 'rxjs';

/** Page qui peut retenir la navigation tant que des changements ne sont pas enregistrés. */
export interface AvecChangementsNonEnregistres {
  /** Vrai (ou émet vrai) si l'on peut quitter la page ; sinon la page demande confirmation. */
  peutQuitter(): boolean | Observable<boolean>;
}

/** Garde de sortie : demande à la page si l'on peut la quitter (confirmation « Quitter sans enregistrer ? »). */
export const quitterSansEnregistrer: CanDeactivateFn<AvecChangementsNonEnregistres> = (page) => page.peutQuitter();
