/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useRef, useState } from "react";
import { ErrorsContext } from "../../konteks/errors.jsx";
const TIME_IN_SCREEN = 7500;
const CORNER = "br";
function PageError(props) {
  const { title, description, errorKey: errorKey2, removeError, newErrorKey, y, type } = props;
  const [hided, setHided] = useState(true);
  const errorRef = useRef(null);
  function removeCurrentError() {
    setHided(true);
    setTimeout(() => removeError(errorKey2), 150);
  }
  useEffect(() => {
    setTimeout(() => {
      removeCurrentError();
    }, TIME_IN_SCREEN);
    setHided(false);
  }, []);
  useEffect(() => {
    if (newErrorKey === errorKey2) return;
    const newErrorElement = document.querySelector(`[data-errorkey="${newErrorKey}"]`);
    if (!newErrorElement || !errorRef.current) return;
    const newErrorHeight = newErrorElement.offsetHeight;
    errorRef.current.animate([
      { transform: `translateY(${newErrorHeight * (y === "t" ? -1 : 1)}px)` },
      { transform: "translateY(0px)" }
    ], {
      duration: 50
    });
  }, [newErrorKey]);
  return <div ref={errorRef} data-errorkey={errorKey2} style={{ opacity: hided ? 0 : 100, backgroundColor: type === "error" ? "var(--error)" : type === "warning" ? "var(--warning)" : "" }} className="p-3 text-xl select-text z-[999] text-foregroundHighlighted font-bold rounded-borderRoundness hover:scale-105 will-change-transform transition-all max-w-96">
            {title}
            <div style={{ display: description ? "" : "none" }} className="text-base opacity-85 mt-2">
                {description}
            </div>
        </div>;
}
let errorKey = 0;
function PageErrors() {
  const errorsContext = useContext(ErrorsContext);
  const [errors, setErrors] = errorsContext.errors;
  const x = CORNER.substring(1, 2);
  const y = CORNER.substring(0, 1);
  const removeError = (errorKey2) => {
    setErrors((prev) => prev.filter((error) => error.errorKey !== errorKey2));
  };
  return <div className="absolute w-fit flex m-5 gap-2" style={{ top: y === "t" ? 0 : "", bottom: y === "b" ? 0 : "", right: x === "r" ? 0 : "", left: x === "l" ? 0 : "", flexDirection: y === "b" ? "column" : "column-reverse", alignItems: x === "r" ? "flex-end" : "flex-start" }}>
            {errors.map((error) => <PageError key={error.errorKey} {...error} removeError={removeError} newErrorKey={errors[errors.length - 1].errorKey} y={y} type={error.type} />)}
        </div>;
}
async function pushPageError(setErrors, title, description) {
  errorKey++;
  setErrors((prev) => [...prev, { title, description, type: "error", errorKey }]);
}
async function pushPageWarning(setErrors, title, description) {
  errorKey++;
  setErrors((prev) => [...prev, { title, description, type: "warning", errorKey }]);
}
export {
  PageErrors as default,
  pushPageError,
  pushPageWarning
};
