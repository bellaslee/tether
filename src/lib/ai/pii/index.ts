export {
  FORBIDDEN_PROMPT_PERSON_COLUMNS,
  type ForbiddenPromptPersonColumn,
} from './forbidden-fields';
export {
  buildAliasMapForPeople,
  buildPersonIdToDisplayLabelMap,
  placeholderizeNote,
  replacePersonUuidReferencesInText,
} from './placeholderize-note';
export {
  resolveContactPlaceholder,
  resolvePersonLabels,
  type PrimaryContactKind,
} from './resolve';
export { deriveFirstNameFromFullName } from './derive-first-name';
