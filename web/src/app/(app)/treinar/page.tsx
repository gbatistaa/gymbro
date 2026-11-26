import type { Metadata } from "next";
import { PlaylistList } from "@/features/train/playlist-list";

export const metadata: Metadata = {
  title: "Treinar",
};

export default function TreinarPage() {
  return <PlaylistList />;
}
