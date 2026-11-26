import { PROFILE_PHOTO_MESSAGES } from "@/contracts/user";
import { apiErrorCode } from "@/lib/api-error-text";
import { notifyApiError, notifyErrors } from "@/lib/notify";

/** Recusas conhecidas da API, explicadas em PT-BR com a ação que resolve cada uma. */
const PHOTO_ERROR_MESSAGES: Record<string, string> = {
  PROFILE_PHOTO_REQUIRED: PROFILE_PHOTO_MESSAGES.required,
  PROFILE_PHOTO_UNSUPPORTED_TYPE: PROFILE_PHOTO_MESSAGES.unsupportedType,
  PROFILE_PHOTO_TOO_LARGE: PROFILE_PHOTO_MESSAGES.tooLarge,
  PAYLOAD_TOO_LARGE: PROFILE_PHOTO_MESSAGES.tooLarge,
};

export function notifyProfilePhotoError(error: unknown) {
  const code = apiErrorCode(error);
  const message = code ? PHOTO_ERROR_MESSAGES[code] : undefined;

  if (message) {
    notifyErrors([message]);
  } else {
    notifyApiError(error);
  }
}
