import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type AdminViewProps = { children: ReactNode; onBack: () => void };
type AdminSectionProps = { id: string; title: string; children: ReactNode };

export function CollapsibleAdminSection({
  id,
  title,
  children,
}: Readonly<AdminSectionProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(false);
  const contentId = `admin-section-${id}`;

  function toggleSection() {
    if (!isExpanded) {
      setHasBeenExpanded(true);
    }
    setIsExpanded((current) => !current);
  }

  return (
    <section className="admin-section">
      <h2 className="admin-section__heading">
        <button
          className="admin-section__toggle"
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={toggleSection}
        >
          <span>{title}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
            <path d="m6.7 9.3 5.3 5.29 5.3-5.3 1.4 1.42-6.7 6.7-6.7-6.7 1.4-1.42Z" />
          </svg>
        </button>
      </h2>
      {hasBeenExpanded ? (
        <div
          className="admin-section__content"
          id={contentId}
          hidden={!isExpanded}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function AdminView({ children, onBack }: Readonly<AdminViewProps>) {
  const { t } = useTranslation();

  return (
    <section className="admin-view" aria-labelledby="admin-view-title">
      <div className="admin-view__header">
        <div>
          <p className="admin-view__eyebrow">{t("admin.eyebrow")}</p>
          <h1 id="admin-view-title">{t("admin.viewTitle")}</h1>
        </div>
        <button className="admin-view__back" type="button" onClick={onBack}>
          {t("admin.backToApp")}
        </button>
      </div>
      <div className="admin-view__sections">{children}</div>
    </section>
  );
}
