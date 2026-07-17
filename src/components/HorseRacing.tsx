import { useTranslation } from "react-i18next";
import type { HorseRacingState, HorseRacingSuit } from "../data/horseRacing";
import { SectionHeader } from "./SectionHeader";

const horseRacingSuits: HorseRacingSuit[] = [
  "hearts",
  "diamonds",
  "spades",
  "clubs",
];

const suitSymbols: Record<HorseRacingSuit, string> = {
  hearts: "H",
  diamonds: "K",
  spades: "P",
  clubs: "Kr",
};

type HorseRacingProps = {
  state: HorseRacingState | null;
  error: string;
  isSaving: boolean;
  onSelectSuit: (suit: HorseRacingSuit) => Promise<void>;
};

export function HorseRacing({
  state,
  error,
  isSaving,
  onSelectSuit,
}: HorseRacingProps) {
  const { t } = useTranslation();
  const isEnabled = state?.isEnabled === true;
  const isOpen = isEnabled && state.bettingStatus === "open";
  const selectedSuit = state?.selectedSuit ?? null;
  const notice = !isEnabled
    ? t("horseRacing.disabled")
    : isOpen
      ? selectedSuit
        ? t("horseRacing.openWithSelection")
        : t("horseRacing.open")
      : selectedSuit
        ? t("horseRacing.closedWithSelection")
        : t("horseRacing.closedWithoutSelection");

  return (
    <section
      className="horse-racing"
      id="main-horse-racing"
      aria-labelledby="horse-racing-title"
    >
      <SectionHeader
        title={t("horseRacing.title")}
        titleId="horse-racing-title"
        eyebrow={t("horseRacing.eyebrow")}
        description={t("horseRacing.description")}
        width="narrow"
      />

      {error ? (
        <p
          className="horse-racing__notice horse-racing__notice--error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <p className="horse-racing__notice">{notice}</p>

      <div
        className="horse-racing__suits"
        aria-label={t("horseRacing.suitsLabel")}
      >
        {horseRacingSuits.map((suit) => {
          const isSelected = selectedSuit === suit;

          return (
            <button
              className={`horse-racing__suit horse-racing__suit--${suit}${
                isSelected ? " is-selected" : ""
              }`}
              type="button"
              key={suit}
              aria-pressed={isSelected}
              disabled={!isOpen || isSaving}
              onClick={() => {
                void onSelectSuit(suit);
              }}
            >
              <span aria-hidden="true">{suitSymbols[suit]}</span>
              <strong>{t(`horseRacing.suits.${suit}`)}</strong>
              {isSelected ? <em>{t("horseRacing.selected")}</em> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
