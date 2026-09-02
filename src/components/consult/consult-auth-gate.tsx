"use client";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { ConsultationWizard } from "@/components/consult/consultation-wizard";
import type { Lawyer } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ConsultAuthGate({
  initialLawyer,
  initialService,
}: {
  initialLawyer?: Lawyer;
  initialService?: string;
}) {
  const { user, status } = useAuth();
  const locked = status !== "user";

  return (
    <>
      <AuthDialog open={status === "guest"} />
      {status === "loading" ? (
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 text-center text-sm text-navy/70 shadow-sm ring-1 ring-navy/10">
          در حال بررسی ورود…
        </div>
      ) : (
        <div
          aria-hidden={locked}
          className={cn(locked && "pointer-events-none select-none opacity-40")}
        >
          <ConsultationWizard
            initialLawyer={initialLawyer}
            initialService={initialService}
            user={user}
          />
        </div>
      )}
    </>
  );
}
