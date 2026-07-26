import type { ReactNode } from "react";

type AdminLoadingNoticeProps = {
  message: ReactNode;
};

export function AdminLoadingNotice({ message }: Readonly<AdminLoadingNoticeProps>) {
  return <output className="admin__notice semantic-status">{message}</output>;
}
