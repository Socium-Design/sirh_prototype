/**
 * Point d'entrée UNIQUE des composants Labs (`@socium-design/angular-components/labs`) dans le prototype.
 *
 * Les composants Labs sont expérimentaux : ils peuvent changer sans garantie de compatibilité jusqu'à leur promotion dans le
 * kit officiel (décidée par l'équipe design, jamais ici). Aucun fichier du prototype n'importe `/labs` directement : tout
 * passe par ce fichier, pour retrouver d'un coup d'œil où ils servent (`grep -r "shared/labs/labs"`) et, à la promotion,
 * n'avoir qu'à remplacer les imports (`SocLabsX` → `SocX` depuis `@socium-design/angular-components`).
 *
 * Usages actuels : Workspace > Configuration > composition d'un tableau de bord (page + Bibliothèque) ; Workspace > Tableau
 * de bord (cartes des widgets : `soc-labs-widget-card`) ; Perfs > Configurations > Notes d'évaluation (`soc-labs-settings-card`,
 * `soc-labs-icon-tile`).
 */
export {
  LABS_CHART_TYPE_LABELS,
  SocLabsChartTypeChip,
  SocLabsCompactField,
  SocLabsDropZone,
  SocLabsFullscreenOverlay,
  SocLabsIconButton,
  SocLabsInlineEdit,
  SocLabsListRow,
  SocLabsListRowAction,
  SocLabsListRowLeading,
  SocLabsOverlayBadge,
  SocLabsIconTile,
  SocLabsPillToggle,
  SocLabsSettingsCard,
  SocLabsSettingsCardAction,
  SocLabsSettingsCardFootnote,
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
  type LabsCompactFieldOption,
  type LabsPillOption,
} from '@socium-design/angular-components/labs';
