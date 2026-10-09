/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useState } from "react";
import { ErrorsContext } from "./errorsKonteks.js";

function ErrorsContextProvider(props) {
  const [errors, setErrors] = useState([]);
  return <ErrorsContext.Provider value={{ errors: [errors, setErrors] }}>
            {props.children}
        </ErrorsContext.Provider>;
}
export default ErrorsContextProvider;
