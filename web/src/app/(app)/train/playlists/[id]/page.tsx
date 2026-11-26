import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PlaylistEditor } from "@/features/train/playlist-editor";

export const metadata: Metadata = {
  title: "Rotina",
};

export const instant = false;

type PlaylistPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  const parsed = z.uuid().safeParse(id);

  if (!parsed.success) {
    notFound();
  }

  return <PlaylistEditor playlistId={parsed.data} />;
}
