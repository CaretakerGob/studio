
import { ProfileUI } from "@/components/profile/profile-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Profile - Beast Companion',
  description: 'Manage your user profile and saved data.',
};

export default function ProfilePage() {
  return (
    <div className="w-full">
      <ProfileUI />
    </div>
  );
}
