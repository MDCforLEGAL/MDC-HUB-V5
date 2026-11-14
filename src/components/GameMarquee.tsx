import { useI18n } from "../i18n";

const fallbackGames = [
  "Blox Fruits",
  "Pet Simulator 99",
  "Arsenal",
  "Doors",
  "Jailbreak",
  "Tower Defense",
  "Royale High",
  "Da Hood",
  "Blue Lock Rivals",
];

interface GameMarqueeProps {
  games?: string[];
}

export function GameMarquee({ games }: GameMarqueeProps) {
  const { t } = useI18n();
  const supportedGames = (games && games.length > 0 ? games : fallbackGames).slice(0, 14);

  return (
    <div className="game-strip">
      <div className="container-page game-strip__inner">
        <span className="game-strip__label">{t("hero.statGames")}</span>
        <div className="game-strip__list" aria-label={t("hero.statGames")}>
          {supportedGames.map((game) => (
            <span key={game} className="game-strip__item">
              {game}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
