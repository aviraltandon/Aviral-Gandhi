"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateProfileName, uploadAvatar } from "./actions";

type Profile = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
};

export function ProfileClient({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onSaveName() {
    if (name.trim() === profile.name) {
      toast.info("No changes");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    startTransition(async () => {
      const r = await updateProfileName(formData);
      if (r?.error) toast.error(r.error);
      else toast.success("Name updated");
    });
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    startTransition(async () => {
      const r = await uploadAvatar(formData);
      if (r?.error) toast.error(r.error);
      else toast.success("Avatar updated");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-ag-parchment flex items-center justify-center overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-ag-deep font-medium">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
            className="hidden"
            id="avatar-upload"
          />
          <label htmlFor="avatar-upload">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {isPending ? "Uploading..." : "Change avatar"}
            </Button>
          </label>
          <p className="text-xs text-ag-mid mt-1">Max 2MB · JPG, PNG, or WebP</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-ag-mid">Email</label>
          <Input value={profile.email} disabled className="bg-ag-parchment" />
          <p className="text-xs text-ag-mid mt-1">Email cannot be changed.</p>
        </div>

        <div>
          <label className="text-xs text-ag-mid">Display name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="text-xs text-ag-mid">Role</label>
          <div className="text-sm font-medium text-ag-deep py-2">
            {profile.role === "admin" ? "Admin" : "Member"}
          </div>
        </div>

        <Button onClick={onSaveName} disabled={isPending || name.trim() === profile.name}>
          {isPending ? "Saving..." : "Save name"}
        </Button>
      </div>
    </div>
  );
}