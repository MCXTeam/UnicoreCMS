import {
  SANITIZE_ALLOWED_ATTR,
  SANITIZE_ALLOWED_SCHEMES,
  SANITIZE_ALLOWED_TAGS,
  SANITIZE_FORBID_ATTR,
  SANITIZE_FORBID_TAGS,
} from "./constants";

export {
  SANITIZE_ALLOWED_ATTR,
  SANITIZE_ALLOWED_SCHEMES,
  SANITIZE_ALLOWED_TAGS,
  SANITIZE_FORBID_ATTR,
  SANITIZE_FORBID_TAGS,
} from "./constants";

export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: SANITIZE_ALLOWED_TAGS,
  ALLOWED_ATTR: SANITIZE_ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: SANITIZE_FORBID_TAGS,
  FORBID_ATTR: SANITIZE_FORBID_ATTR,
};

export const SANITIZE_HTML_OPTIONS = {
  allowedTags: SANITIZE_ALLOWED_TAGS.filter(
    (tag) => !SANITIZE_FORBID_TAGS.includes(tag),
  ),
  allowedAttributes: {
    "*": SANITIZE_ALLOWED_ATTR.filter(
      (attr) => !SANITIZE_FORBID_ATTR.includes(attr),
    ),
  },
  allowedSchemes: SANITIZE_ALLOWED_SCHEMES,
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard" as const,
};
