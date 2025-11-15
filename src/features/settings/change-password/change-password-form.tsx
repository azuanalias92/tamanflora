import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const { auth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const currentPassword = (formEl.elements.namedItem("currentPassword") as HTMLInputElement)?.value || "";
    const newPassword = (formEl.elements.namedItem("newPassword") as HTMLInputElement)?.value || "";
    const confirmPassword = (formEl.elements.namedItem("confirmPassword") as HTMLInputElement)?.value || "";
    if (!newPassword || newPassword.length < 7) {
      toast.error("Password must be at least 7 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password don't match");
      return;
    }
    const email = auth.user?.email || "";
    if (!email) {
      toast.error("Not logged in");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("Password updated");
      (formEl.elements.namedItem("currentPassword") as HTMLInputElement).value = "";
      (formEl.elements.namedItem("newPassword") as HTMLInputElement).value = "";
      (formEl.elements.namedItem("confirmPassword") as HTMLInputElement).value = "";
    } catch {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 gap-2 flex flex-col">
          <Label>Current Password</Label>
          <PasswordInput name="currentPassword" placeholder="********" />
        </div>
        <div className="sm:col-span-2 gap-2 flex flex-col">
          <Label>New Password</Label>
          <PasswordInput name="newPassword" placeholder="********" />
        </div>
        <div className="sm:col-span-2 gap-2 flex flex-col">
          <Label>Confirm Password</Label>
          <PasswordInput name="confirmPassword" placeholder="********" />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
