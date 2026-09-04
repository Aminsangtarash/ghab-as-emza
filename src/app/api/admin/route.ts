import { NextRequest, NextResponse } from "next/server";

import { requireStaff } from "@/lib/admin-guard";
import {
  adjustUserWallet,
  adminCancelConsultation,
  assignConsultationLawyer,
  createLawyerAccount,
  createStaffAccount,
  getAdminDashboard,
  getAdminLawyerDetail,
  getAdminUserDetail,
  getConsultationForStaff,
  listAdminFees,
  listAdminLawyers,
  listAdminPromos,
  listAdminUsers,
  listOpsQueue,
  listStaffAccounts,
  refreshAdminCaches,
  resetClientPassword,
  resetStaffPassword,
  setLawyerAccepting,
  setLawyerActive,
  setPromoActive,
  setServiceFee,
  setUserActive,
  upsertPromo,
} from "@/lib/admin-ops";
import { canStaff } from "@/lib/admin-permissions";

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request, "viewDashboard");
  if ("error" in auth) return auth.error;
  await refreshAdminCaches();

  const view = request.nextUrl.searchParams.get("view") ?? "dashboard";
  if (view === "dashboard") {
    return NextResponse.json(await getAdminDashboard());
  }
  if (view === "queue") {
    const gate = await requireStaff(request, "manageQueue");
    if ("error" in gate) return gate.error;
    return NextResponse.json({ items: await listOpsQueue() });
  }
  if (view === "users") {
    const gate = await requireStaff(request, "manageUsers");
    if ("error" in gate) return gate.error;
    const q = request.nextUrl.searchParams.get("q") ?? undefined;
    const activeParam = request.nextUrl.searchParams.get("active");
    const active =
      activeParam === "active" || activeParam === "inactive" ? activeParam : ("all" as const);
    const wallet = request.nextUrl.searchParams.get("wallet") === "positive" ? "positive" : "all";
    const openRequest = request.nextUrl.searchParams.get("openRequest") === "1";
    return NextResponse.json({
      items: await listAdminUsers({ q, active, wallet, openRequest }),
    });
  }
  if (view === "user") {
    const gate = await requireStaff(request, "manageUsers");
    if ("error" in gate) return gate.error;
    const id = request.nextUrl.searchParams.get("id") ?? "";
    const item = await getAdminUserDetail(id);
    if (!item) return NextResponse.json({ error: "کاربر پیدا نشد." }, { status: 404 });
    return NextResponse.json({ item });
  }
  if (view === "lawyers") {
    const gate = await requireStaff(request, "manageLawyers");
    if ("error" in gate) return gate.error;
    return NextResponse.json({ items: await listAdminLawyers() });
  }
  if (view === "lawyer") {
    const gate = await requireStaff(request, "manageLawyers");
    if ("error" in gate) return gate.error;
    const slug = request.nextUrl.searchParams.get("slug") ?? "";
    const item = await getAdminLawyerDetail(slug);
    if (!item) return NextResponse.json({ error: "وکیل پیدا نشد." }, { status: 404 });
    return NextResponse.json({ item });
  }
  if (view === "staff") {
    const gate = await requireStaff(request, "manageStaff");
    if ("error" in gate) return gate.error;
    return NextResponse.json({ items: await listStaffAccounts() });
  }
  if (view === "pricing") {
    const gate = await requireStaff(request, "managePromos");
    if ("error" in gate) return gate.error;
    const [promos, fees] = await Promise.all([listAdminPromos(), listAdminFees()]);
    return NextResponse.json({ promos, fees });
  }
  if (view === "cooperate") {
    const gate = await requireStaff(request, "createLawyer");
    if ("error" in gate) return gate.error;
    const { listCooperationApplications } = await import("@/lib/cooperation");
    const status = request.nextUrl.searchParams.get("status");
    const items = await listCooperationApplications(
      status === "pending" || status === "approved" || status === "rejected" ? status : undefined,
    );
    return NextResponse.json({ items });
  }
  if (view === "support") {
    const gate = await requireStaff(request, "viewSupport");
    if ("error" in gate) return gate.error;
    const { listSupportTickets } = await import("@/lib/support-tickets");
    const status = request.nextUrl.searchParams.get("status");
    const items = await listSupportTickets(
      status === "new" || status === "in-progress" || status === "resolved" ? status : undefined,
    );
    return NextResponse.json({ items });
  }
  if (view === "request") {
    const gate = await requireStaff(request, "manageRequests");
    if ("error" in gate) return gate.error;
    const code = request.nextUrl.searchParams.get("code") ?? "";
    const includeSecrets = canStaff(auth.user.role, "viewRequestSecrets");
    const item = await getConsultationForStaff(code, includeSecrets);
    if (!item) return NextResponse.json({ error: "درخواست پیدا نشد." }, { status: 404 });
    return NextResponse.json({ item });
  }

  return NextResponse.json({ error: "نمای نامعتبر است." }, { status: 400 });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const action = String(body.action ?? "");

  if (action === "assign") {
    const auth = await requireStaff(request, "manageQueue");
    if ("error" in auth) return auth.error;
    const result = await assignConsultationLawyer(String(body.trackingCode ?? ""), String(body.lawyerSlug ?? ""));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "cancel") {
    const auth = await requireStaff(request, "manageRequests");
    if ("error" in auth) return auth.error;
    const result = await adminCancelConsultation(
      String(body.trackingCode ?? ""),
      typeof body.reason === "string" ? body.reason : undefined,
    );
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "set-user-active") {
    const auth = await requireStaff(request, "manageUsers");
    if ("error" in auth) return auth.error;
    const result = await setUserActive(String(body.userId ?? ""), Boolean(body.active));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "adjust-wallet") {
    const auth = await requireStaff(request, "adjustWallet");
    if ("error" in auth) return auth.error;
    const result = await adjustUserWallet({
      userId: String(body.userId ?? ""),
      amount: Number(body.amount),
      note: typeof body.note === "string" ? body.note : undefined,
      actorName: auth.user.fullName,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "create-staff") {
    const auth = await requireStaff(request, "manageStaff");
    if ("error" in auth) return auth.error;
    const role = body.role === "manager" ? "manager" : "admin";
    const result = await createStaffAccount({
      fullName: String(body.fullName ?? ""),
      phone: String(body.phone ?? ""),
      password: String(body.password ?? ""),
      role,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "reset-staff-password") {
    const auth = await requireStaff(request, "manageStaff");
    if ("error" in auth) return auth.error;
    const result = await resetStaffPassword(String(body.userId ?? ""), String(body.password ?? ""));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "set-staff-active") {
    const auth = await requireStaff(request, "manageStaff");
    if ("error" in auth) return auth.error;
    const result = await setUserActive(String(body.userId ?? ""), Boolean(body.active));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "create-lawyer") {
    const auth = await requireStaff(request, "createLawyer");
    if ("error" in auth) return auth.error;
    const result = await createLawyerAccount({
      fullName: String(body.fullName ?? ""),
      phone: String(body.phone ?? ""),
      password: String(body.password ?? ""),
      city: String(body.city ?? ""),
      specialty: String(body.specialty ?? ""),
      title: typeof body.title === "string" ? body.title : undefined,
      bio: typeof body.bio === "string" ? body.bio : undefined,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "set-lawyer-active") {
    const auth = await requireStaff(request, "manageLawyers");
    if ("error" in auth) return auth.error;
    const result = await setLawyerActive(String(body.slug ?? ""), Boolean(body.active));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "upsert-promo") {
    const auth = await requireStaff(request, "managePromos");
    if ("error" in auth) return auth.error;
    const result = await upsertPromo({
      code: String(body.code ?? ""),
      percent: Number(body.percent),
      title: String(body.title ?? ""),
      active: body.active === undefined ? true : Boolean(body.active),
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "set-promo-active") {
    const auth = await requireStaff(request, "managePromos");
    if ("error" in auth) return auth.error;
    const result = await setPromoActive(String(body.code ?? ""), Boolean(body.active));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "set-fee") {
    const auth = await requireStaff(request, "manageFees");
    if ("error" in auth) return auth.error;
    const result = await setServiceFee(String(body.serviceSlug ?? ""), Number(body.feeToman));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "approve-cooperate") {
    const auth = await requireStaff(request, "createLawyer");
    if ("error" in auth) return auth.error;
    const { approveCooperationApplication } = await import("@/lib/cooperation");
    const result = await approveCooperationApplication(
      String(body.id ?? ""),
      typeof body.staffNote === "string" ? body.staffNote : undefined,
    );
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "reject-cooperate") {
    const auth = await requireStaff(request, "createLawyer");
    if ("error" in auth) return auth.error;
    const { rejectCooperationApplication } = await import("@/lib/cooperation");
    const result = await rejectCooperationApplication(
      String(body.id ?? ""),
      typeof body.staffNote === "string" ? body.staffNote : undefined,
    );
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "update-support") {
    const auth = await requireStaff(request, "viewSupport");
    if ("error" in auth) return auth.error;
    const { updateSupportTicket } = await import("@/lib/support-tickets");
    const status =
      body.status === "new" || body.status === "in-progress" || body.status === "resolved"
        ? body.status
        : undefined;
    const result = await updateSupportTicket(String(body.id ?? ""), {
      status,
      staffNote: typeof body.staffNote === "string" ? body.staffNote : undefined,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "reset-client-password") {
    const auth = await requireStaff(request, "manageUsers");
    if ("error" in auth) return auth.error;
    const result = await resetClientPassword(String(body.userId ?? ""), String(body.password ?? ""));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "set-lawyer-accepting") {
    const auth = await requireStaff(request, "manageLawyers");
    if ("error" in auth) return auth.error;
    const result = await setLawyerAccepting(String(body.slug ?? ""), Boolean(body.acceptingNew));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "create-support") {
    const auth = await requireStaff(request, "viewSupport");
    if ("error" in auth) return auth.error;
    const { createSupportTicket } = await import("@/lib/support-tickets");
    const result = await createSupportTicket({
      fullName: String(body.fullName ?? auth.user.fullName),
      phone: typeof body.phone === "string" ? body.phone : undefined,
      subject: String(body.subject ?? ""),
      body: String(body.body ?? ""),
      source: "staff",
      userId: typeof body.userId === "string" ? body.userId : undefined,
    });
    return NextResponse.json({ ok: true, id: result.id });
  }

  return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 422 });
}
