/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
function LoadingBar(props) {
  return <div style={{ width: `${props.progress}%`, transition: `width ${props.transitionTime}ms linear` }} className="absolute left-0 bottom-0 bg-backgroundBoxBoxHighlighted h-1" />;
}
export {
  LoadingBar as default
};
