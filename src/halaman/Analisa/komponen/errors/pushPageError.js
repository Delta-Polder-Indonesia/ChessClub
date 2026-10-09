let errorKey = 0;

export async function pushPageError(setErrors, title, description) {
  errorKey++;
  setErrors((prev) => [...prev, { title, description, type: "error", errorKey }]);
}

export async function pushPageWarning(setErrors, title, description) {
  errorKey++;
  setErrors((prev) => [...prev, { title, description, type: "warning", errorKey }]);
}
