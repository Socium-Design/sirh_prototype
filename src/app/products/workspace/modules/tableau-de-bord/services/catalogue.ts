import type { Indicateur, ProduitSirh, SectionCatalogue } from '../models/indicateur.model';

/** Indicateur tel qu'affiché dans la Bibliothèque : grisé si son produit n'est pas souscrit. */
export interface IndicateurCatalogue extends Indicateur {
  disponible: boolean;
}

export interface SectionAvecIndicateurs extends SectionCatalogue {
  indicateurs: IndicateurCatalogue[];
}

/**
 * Catalogue regroupé par section, dans l'ordre des sections. Une section sans aucun indicateur n'apparaît pas ;
 * un indicateur d'un produit non souscrit reste visible mais `disponible: false`.
 */
export function construireCatalogue(sections: SectionCatalogue[], indicateurs: Indicateur[], souscrits: ProduitSirh[]): SectionAvecIndicateurs[] {
  return sections
    .map((section) => ({
      ...section,
      indicateurs: indicateurs
        .filter((i) => i.sectionId === section.id)
        .map((i) => ({ ...i, disponible: souscrits.includes(i.produit) })),
    }))
    .filter((section) => section.indicateurs.length > 0);
}
