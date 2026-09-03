import type { Metadata } from "next";

import { ConversationList } from "@/components/account/conversation-list";
import { getServerUser } from "@/lib/auth";
import { listUserConversations } from "@/lib/conversations";

export const metadata: Metadata = {
  title: "گفتگوها",
};

export default async function AccountChatsPage() {
  const user = await getServerUser();
  const items = user ? await listUserConversations(user.id) : [];

  return (
    <div>
      <p className="text-sm font-medium text-gold-deep">ارتباط با وکیل</p>
      <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
      <h1 className="mt-4 font-heading text-2xl font-bold text-navy">گفتگوها</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/65">
        مشاوره متنی، تماس تصویری داخل برنامه و هماهنگی تماس تلفنی همه در همین فهرست هستند. پس از تأیید وکیل، گفتگو اینجا
        باز می‌شود.
      </p>
      <ConversationList items={items} hrefFor={(item) => `/account/chats/${item.id}`} />
    </div>
  );
}
