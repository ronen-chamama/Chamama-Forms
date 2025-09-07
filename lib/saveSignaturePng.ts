// lib/saveSignaturePng.ts
import { storage } from "@/lib/firebaseClient";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

                                                         
export async function saveSignaturePng(userId: string, dataUrl: string) {
  const path = `signatures/${userId}/${Date.now()}.png`;
  const r = ref(storage, path);
  await uploadString(r, dataUrl, "data_url");
  const url = await getDownloadURL(r);
  return { url, path };
}
