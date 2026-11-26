import { z } from "zod";
import { profilePhotoSchema, type ProfilePhoto } from "@/contracts/user";
import { request, requestMaybe } from "@/lib/http";

const PHOTO_URL = "/api/users/me/photo";

/** Foto atual; `null` quando o usuário não tem foto (a API responde `204`). */
export function fetchProfilePhoto(): Promise<ProfilePhoto | null> {
  return requestMaybe({ url: PHOTO_URL }, profilePhotoSchema);
}

/** Cria a foto na primeira vez e a substitui nas seguintes. */
export function uploadProfilePhoto(file: File): Promise<ProfilePhoto> {
  const body = new FormData();
  body.append("file", file);

  return request({ method: "PUT", url: PHOTO_URL, data: body }, profilePhotoSchema);
}

export async function removeProfilePhoto(): Promise<void> {
  await requestMaybe({ method: "DELETE", url: PHOTO_URL }, z.unknown());
}
