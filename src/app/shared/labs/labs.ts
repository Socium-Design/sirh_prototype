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
 * (`soc-labs-option-row`, `soc-labs-nav-list`, `soc-labs-changes-bar`, `soc-labs-tag`) — design_system_angular#70, pas
 * encore publiée ; menu Workspace (item « Entreprises ») : design_system_angular#71. Archive `vendor/…-0.3.5-labs.5.tgz`.
 */
export {
  LABS_CHART_TYPE_LABELS,
  SocLabsChangesBar,
  SocLabsChartTypeChip,
  SocLabsCompactField,
  SocLabsDropZone,
  SocLabsFullscreenOverlay,
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
  SocLabsSettingsCard,
  SocLabsSettingsCardAction,
  SocLabsSettingsCardDetails,
  SocLabsSettingsCardFootnote,
  SocLabsSettingsCardTags,
  SocLabsSwitchHiddenLabel,
  SocLabsTag,
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
  type LabsNavListItem,
  type LabsPillOption,
} from '@socium-design/angular-components/labs';
