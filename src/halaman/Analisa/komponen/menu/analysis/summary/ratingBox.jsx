/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
function RatingBox(props) {
  return <div style={{ width: props.width, fontSize: props.fontSize, paddingTop: props.paddingY, paddingBottom: props.paddingY }} className={`w-20 py-2 rounded-borderRoundness border border-slate-200 text-2xl font-bold ${props.white ? "bg-evaluationBarWhite text-evaluationBarBlack" : "bg-evaluationBarBlack text-evaluationBarWhite"} text-center`}>
            {props.children}
        </div>;
}
export {
  RatingBox as default
};
