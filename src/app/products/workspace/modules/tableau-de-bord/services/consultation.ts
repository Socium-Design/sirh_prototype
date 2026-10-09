import type { RoleDemo } from '../../../../../core/session/session.service';
import type { TableauDeBord } from '../models/tableau-de-bord.model';
import type { WidgetVue } from './widgets';

/** Tableau de bord consulté par un rôle : le premier tableau actif ouvert à ce profil. */
export function tableauDuRole(tableaux: TableauDeBord[], role: RoleDemo): TableauDeBord | undefined {
  return tableaux.find((t) => t.statut === 'Actif' && t.profils.includes(role));
}

/** Section de la consultation : les cartes KPI d'abord, puis les graphes regroupés par thème. */
export interface SectionConsultation {
  id: 'indicateurs-cles' | 'effectifs-mouvements' | 'remuneration-absenteisme';
  libelle: string;
  kpi: boolean;
  widgets: WidgetVue[];
}

/** Sections du catalogue rangées dans chaque thème de la consultation. */
const THEMES: Record<Exclude<SectionConsultation['id'], 'indicateurs-cles'>, string[]> = {
  'effectifs-mouvements': ['capital-humain', 'recrutement', 'mouvements'],
  'remuneration-absenteisme': ['masse-salariale', 'absences'],
};

/**
 * Regroupe les graphes d'un tableau de bord pour la consultation : « Indicateurs clés » (cartes KPI), « Effectifs et
 * mouvements », « Rémunération et absentéisme ». Une section sans graphe n'apparaît pas : les sections affichées
 * dépendent donc du tableau, c'est-à-dire du rôle.
 */
export function sectionsConsultation(vues: WidgetVue[]): SectionConsultation[] {
  const graphes = (theme: keyof typeof THEMES) => vues.filter((v) => v.indicateur.typeGraphique !== 'kpi' && THEMES[theme].includes(v.indicateur.sectionId));
  const sections: SectionConsultation[] = [
    { id: 'indicateurs-cles', libelle: 'Indicateurs clés', kpi: true, widgets: vues.filter((v) => v.indicateur.typeGraphique === 'kpi') },
    { id: 'effectifs-mouvements', libelle: 'Effectifs et mouvements', kpi: false, widgets: graphes('effectifs-mouvements') },
    { id: 'remuneration-absenteisme', libelle: 'Rémunération et absentéisme', kpi: false, widgets: graphes('remuneration-absenteisme') },
  ];
  return sections.filter((s) => s.widgets.length);
}
