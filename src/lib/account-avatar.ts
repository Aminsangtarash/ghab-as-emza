import { randomBytes } from "crypto";
import { mkdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";

import { prisma } from "@/lib/db";
import { toPublicUser } from "@/lib/store";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function storageDir() {
  return path.join(process.cwd(), "storage", "avatars");
}

function filePath(storedName: string) {
  return path.join(storageDir(), storedName);
}

function sniffImage(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg" as const, ext: "jpg" };
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mime: "image/png" as const, ext: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp" as const, ext: "webp" };
  }
  return null;
}

function mimeFromName(storedName: string) {
  if (storedName.endsWith(".png")) return "image/png";
  if (storedName.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function saveUserAvatar(userId: string, file: File) {
  if (file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
    return { error: "حجم تصویر باید حداکثر ۲ مگابایت باشد." as const };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImage(buffer);
  if (!sniffed) {
    return { error: "فقط تصویر JPG، PNG یا WebP پذیرفته می‌شود." as const };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarName: true } });
  if (!user) return { error: "حساب پیدا نشد." as const };

  const storedName = `${randomBytes(16).toString("hex")}.${sniffed.ext}`;
  await mkdir(storageDir(), { recursive: true });
  await writeFile(filePath(storedName), buffer);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarName: storedName },
  });

  if (user.avatarName && user.avatarName !== storedName) {
    await unlink(filePath(user.avatarName)).catch(() => undefined);
  }

  return { user: toPublicUser(updated) };
}

export async function getUserAvatarFile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarName: true },
  });
  if (!user?.avatarName) return null;

  const stored = filePath(user.avatarName);
  try {
    const info = await stat(stored);
    if (!info.isFile()) return null;
    return {
      path: stored,
      mimeType: mimeFromName(user.avatarName),
      size: info.size,
    };
  } catch {
    return null;
  }
}

export async function deleteUserAvatar(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarName: true } });
  if (!user?.avatarName) return { error: "تصویری برای حذف نیست." as const };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarName: null },
  });
  await unlink(filePath(user.avatarName)).catch(() => undefined);
  return { user: toPublicUser(updated) };
}
