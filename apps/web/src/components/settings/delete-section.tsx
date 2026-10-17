"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteAccountAction } from "@/app/actions/account-actions";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DeleteAccount() {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmation === "DELETE";

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    const result = await deleteAccountAction();

    if (result.success === false) {
      toast.error(result.error);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AlertDialog
          onOpenChange={(open) => {
            if (!open) {
              setConfirmation("");
            }
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your Account?</AlertDialogTitle>

              <AlertDialogDescription>
                This action cannot be undone. Your profile, achievements,
                subscription information, and account data will be permanently
                deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <p className="text-sm font-medium">Type DELETE to confirm</p>

              <Input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={!isConfirmed || isDeleting}
                className="!bg-destructive !text-destructive-foreground !hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Permanently delete account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
