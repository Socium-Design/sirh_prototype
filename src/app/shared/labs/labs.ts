/**
 * Point d'entrée UNIQUE des composants Labs (`@socium-design/angular-components/labs`) dans le prototype.
 *
 * Les composants Labs sont expérimentaux : ils peuvent changer sans garantie de compatibilité jusqu'à leur promotion dans le
 * kit officiel (décidée par l'équipe design, jamais ici). Aucun fichier du prototype n'importe `/labs` directement : tout
 * passe par ce fichier, pour retrouver d'un coup d'œil où ils servent (`grep -r "shared/labs/labs"`) et, à la promotion,
 * n'avoir qu'à remplacer les imports (`SocLabsX` → `SocX` depuis `@socium-design/angular-components`).
 *
 * Usages actuels : Workspace > Configuration > composition d'un tableau de bord (page + Bibliothèque) ; Workspace > Tableau
 * de bord (cartes des widgets : `soc-labs-widget-card`) ; Perfs > Configurations > Notes d'évaluation (`soc-labs-settings-card` avec
 * ses slots détails et tags — design_system_angular#63, publiés en 0.3.4 —, `soc-labs-icon-tile`) ; Workspace > Entreprises
 * (`soc-switch[socLabsSwitchHiddenLabel]`, `soc-labs-tag`, `soc-labs-icon-button`) et « Fonctionnalités et options »
 * (`soc-labs-option-row`, `soc-labs-nav-list`, `soc-labs-changes-bar`, `soc-labs-tag`) — design_system_angular#70 ;
 * menu Workspace de production (item « Entreprises ») : design_system_angular#71. Publiés en 0.3.5.
 * Perfs > Objectifs : `soc-labs-grouped-table` (#75), `soc-labs-progress-ring` (#74), `soc-labs-timeline` (#76),
 * `soc-labs-population-picker` (#77) — PR design_system_angular « Labs : composants de Perfs > Objectifs », pas encore
 * publiée : archive `vendor/socium-design-angular-components-0.3.6-labs.1.tgz`.
 */
export {
  LABS_CHART_TYPE_LABELS,
  SocLabsChangesBar,
  SocLabsChartTypeChip,
  SocLabsCompactField,
  SocLabsDropZone,
  SocLabsFullscreenOverlay,
  SocLabsGroupedTable,
  SocLabsIconButton,
  SocLabsInlineEdit,
  SocLabsListRow,
  SocLabsListRowAction,
  SocLabsListRowLeading,
  SocLabsNavList,
  SocLabsOptionRow,
  SocLabsOptionRowTags,
  SocLabsOverlayBadge,
  SocLabsIconTile,
  SocLabsPillToggle,
  SocLabsPopulationPicker,
  SocLabsProgressRing,
  SocLabsSettingsCard,
  SocLabsSettingsCardAction,
  SocLabsSettingsCardDetails,
  SocLabsSettingsCardFootnote,
  SocLabsSettingsCardTags,
  SocLabsSwitchHiddenLabel,
  SocLabsTag,
  SocLabsTimeline,
  SocLabsWorkspaceActions,
  SocLabsWorkspaceBack,
  SocLabsWorkspaceHint,
  SocLabsWorkspaceLayout,
  SocLabsWorkspaceLeft,
  SocLabsWorkspaceRight,
  SocLabsWorkspaceTitle,
  SocLabsWidgetCard,
  SocLabsWidgetCardActions,
  SocLabsWidgetCardFilters,
  SocLabsWidgetCardFooter,
  SocLabsWidgetCardIcon,
  type LabsChartType,
  type LabsGroupedTableColumn,
  type LabsGroupedTableGroup,
  type LabsGroupedTableCellContext,
  type LabsGroupedTableGroupContext,
  type LabsPopulationMode,
  type LabsPopulationPerson,
  type LabsTimelineEvent,
  type LabsTimelineLegendItem,
  type LabsTimelineTone,
  type LabsTagColor,
  type LabsCompactFieldOption,
  type LabsNavListItem,
  type LabsPillOption,
} from '@socium-design/angular-components/labs';
