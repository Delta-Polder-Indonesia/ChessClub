/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { ConfigContext } from "../../konteks/config.jsx";
import { useContext, useEffect } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { bacaTeks, tulis } from "../../penyimpanan.js";
const boardThemes = [
  { kunci: "hijau", label: "Green", black: "#779556", white: "#ebecd0", highlight: "#ffff33" },
  { kunci: "cokelat", label: "Brown", black: "#b58863", white: "#f0d9b5", highlight: "#ffff33" },
  { kunci: "biru", label: "Blue", black: "#4d6d92", white: "#ececd7", highlight: "#00a5ff" },
  { kunci: "abu", label: "Gray", black: "#4f4f4f", white: "#e3e3e3", highlight: "#ffff33" },
  { kunci: "merah", label: "Red", black: "#ba5546", white: "#f0d8bf", highlight: "#f8f893" },
  { kunci: "ungu", label: "Purple", black: "#8877b7", white: "#efefef", highlight: "#7dacc9" },
  { kunci: "oranye", label: "Orange", black: "#d08b18", white: "#fce4b2", highlight: "#ffff33" }
];
function Themes() {
  const { t } = useI18n();
  const configContext = useContext(ConfigContext);
  const [boardTheme, setBoardTheme] = configContext.boardTheme;
  useEffect(() => {
    const boardTheme2 = Number(bacaTeks("boardTheme"));
    if (boardThemes[boardTheme2] != null) {
      setBoardTheme(boardTheme2);
    } else {
      tulis("boardTheme", "0");
      setBoardTheme(0);
    }
  }, []);
  function changeBoardTheme(boardThemeIndex) {
    setBoardTheme(boardThemeIndex);
    tulis("boardTheme", String(boardThemeIndex));
  }
  return <section>
            <h1 className="block bg-backgroundBoxBox font-bold text-nowrap p-3 text-foreground">{t("analisa.pengaturan.temaPapan")}</h1>
            {boardThemes.map((theme, i) => {
    return <button onClick={() => changeBoardTheme(i)} type="button" key={i} className="flex flex-row gap-2 items-center hover:bg-backgroundBoxHover transition-colors hover:text-foregroundHighlighted w-full relative p-2">
                        <div className="grid grid-cols-2 w-fit">
                            {Array.from({ length: 4 }).map((_, i2) => {
      const isEvenCol = i2 % 2 === 0;
      const isEvenRow = Math.floor(i2 / 2) % 2 === 0;
      const squareColor = isEvenCol ? isEvenRow ? theme.white : theme.black : isEvenRow ? theme.black : theme.white;
      return <div key={i2} style={{ backgroundColor: squareColor }} className="h-5 w-5" />;
    })}
                        </div>
                        <span className="font-bold text-lg">{t(`analisa.tema.${theme.kunci}`)}</span>
                        <div style={{ backgroundColor: theme.black, display: boardTheme === i ? "" : "none" }} className="w-3 h-3 rounded-full absolute right-3" />
                    </button>;
  })}
        </section>;
}
export {
  boardThemes,
  Themes as default
};
