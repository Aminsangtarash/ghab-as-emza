"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { ServiceRequestDialog } from "@/components/request/service-request-dialog";

type ServiceRequestContextValue = {
  openRequest: (serviceSlug: string) => void;
};

const ServiceRequestContext = createContext<ServiceRequestContextValue | null>(null);

export function ServiceRequestProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const statusRef = useRef(status);
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);
  statusRef.current = status;

  const openRequest = useCallback((slug: string) => {
    setServiceSlug(slug);
  }, []);

  const value = useMemo(() => ({ openRequest }), [openRequest]);

  function closeAll() {
    setServiceSlug(null);
  }

  return (
    <ServiceRequestContext.Provider value={value}>
      {children}
      {Boolean(serviceSlug) && status === "loading" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/40 backdrop-blur-[2px]">
          <p className="rounded-2xl bg-white px-5 py-3 text-sm text-navy shadow-lg">در حال بررسی ورود…</p>
        </div>
      ) : null}
      <AuthDialog
        open={Boolean(serviceSlug) && status === "guest"}
        dismissible
        onOpenChange={(open) => {
          if (!open && statusRef.current !== "user") closeAll();
        }}
      />
      <ServiceRequestDialog
        open={Boolean(serviceSlug) && status === "user"}
        serviceSlug={serviceSlug}
        onOpenChange={(open) => {
          if (!open) closeAll();
        }}
      />
    </ServiceRequestContext.Provider>
  );
}

export function useServiceRequest() {
  const context = useContext(ServiceRequestContext);
  if (!context) {
    throw new Error("useServiceRequest must be used within ServiceRequestProvider");
  }
  return context;
}
