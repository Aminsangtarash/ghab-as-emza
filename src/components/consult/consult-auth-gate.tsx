"use client";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { ConsultationWizard } from "@/components/consult/consultation-wizard";
import { InPersonConsultStub } from "@/components/consult/in-person-consult-stub";
import { UrgentConsultWizard } from "@/components/consult/urgent-consult-wizard";
import { isInPersonService, isUrgentConsultService } from "@/lib/consult";
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
  const urgent = initialService ? isUrgentConsultService(initialService) : false;
  const inPerson = initialService ? isInPersonService(initialService) : false;

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
          {urgent ? (
            <UrgentConsultWizard user={user} />
          ) : inPerson ? (
            <InPersonConsultStub />
          ) : (
            <ConsultationWizard
              initialLawyer={initialLawyer}
              initialService={initialService}
              user={user}
            />
          )}
        </div>
      )}
    </>
  );
}
