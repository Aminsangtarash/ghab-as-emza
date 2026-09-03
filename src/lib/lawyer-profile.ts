import { getLawyer, type Lawyer } from "@/lib/data";
import { prisma } from "@/lib/db";

export type LawyerPanelProfile = {
  slug: string;
  name: string;
  title: string;
  specialty: string;
  experience: string;
  city: string;
  image: string;
  focus: string[];
  headline: string;
  bio: string;
  officeHours: string;
  officePhone: string;
  acceptingNew: boolean;
  autoAccept: boolean;
  rating: number;
};

const defaults = {
  headline: "",
  officeHours: "شنبه تا چهارشنبه، ۹ تا ۱۷",
  officePhone: "",
};

export async function getLawyerProfile(slug: string): Promise<LawyerPanelProfile | null> {
  const base: Lawyer | undefined = getLawyer(slug);
  if (!base) return null;
  const row = await prisma.lawyerProfile.findUnique({ where: { slug } });

  return {
    slug,
    name: base.name,
    title: base.title,
    specialty: base.specialty,
    experience: base.experience,
    image: base.image,
    focus: base.focus,
    rating: base.rating,
    city: row?.city ?? base.city,
    headline: row?.headline ?? defaults.headline,
    bio: row?.bio ?? base.bio,
    officeHours: row?.officeHours ?? defaults.officeHours,
    officePhone: row?.officePhone ?? defaults.officePhone,
    acceptingNew: row?.acceptingNew ?? true,
    autoAccept: row?.autoAccept ?? false,
  };
}

export async function updateLawyerProfile(
  slug: string,
  patch: {
    headline?: string;
    bio?: string;
    officeHours?: string;
    officePhone?: string;
    city?: string;
    acceptingNew?: boolean;
    autoAccept?: boolean;
  },
) {
  if (!getLawyer(slug)) return { error: "پروفایل وکیل پیدا نشد." as const };
  if (patch.bio !== undefined && patch.bio.trim().length > 1500) {
    return { error: "معرفی بیش از حد طولانی است." as const };
  }

  const data = {
    headline: patch.headline?.trim()?.slice(0, 160) || null,
    bio: patch.bio?.trim() || null,
    officeHours: patch.officeHours?.trim()?.slice(0, 160) || null,
    officePhone: patch.officePhone?.trim()?.slice(0, 40) || null,
    city: patch.city?.trim()?.slice(0, 60) || null,
    ...(patch.acceptingNew === undefined ? {} : { acceptingNew: patch.acceptingNew }),
    ...(patch.autoAccept === undefined ? {} : { autoAccept: patch.autoAccept }),
  };

  await prisma.lawyerProfile.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });
  return { ok: true as const };
}

export async function isAcceptingNew(slug: string) {
  const row = await prisma.lawyerProfile.findUnique({ where: { slug } });
  return row?.acceptingNew ?? true;
}
