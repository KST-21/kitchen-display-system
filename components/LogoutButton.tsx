"use client";

import { logoutAction } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export const LogoutButton = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 hover:text-red-700">
          Logout
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white shadow-lg ring-slate-500 rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold">
            Log out?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-wrap">
            You will be signed out of the system and need to log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-0">
          <AlertDialogCancel className="hover:!bg-slate-100">
            Cancel
          </AlertDialogCancel>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Logout
            </button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
