"use client";

import { deleteChefAction } from "@/app/actions";

export function ChefDeleteForm({ chefId }: { chefId: number }) {
  return (
    <form
      action={deleteChefAction}
      className="inline"
      onSubmit={(e) => {
        if (
          !confirm(
            "Remove this chef? They will be unassigned from any queue tickets first."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="chef_id" value={chefId} />
      <button type="submit" className="text-red-600 hover:underline">
        Delete
      </button>
    </form>
  );
}
