import type { Metadata } from "next";
import { ProfileScreen } from "@/features/profile/profile-screen";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
