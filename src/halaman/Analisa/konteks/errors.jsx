/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { createContext, useState } from "react";
const ErrorsContext = createContext({
  errors: [[], () => {
  }]
});
function ErrorsContextProvider(props) {
  const [errors, setErrors] = useState([]);
  return <ErrorsContext.Provider value={{ errors: [errors, setErrors] }}>
            {props.children}
        </ErrorsContext.Provider>;
}
export {
  ErrorsContext,
  ErrorsContextProvider as default
};
