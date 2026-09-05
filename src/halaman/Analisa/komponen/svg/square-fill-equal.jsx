/* Ikon kotak terisi dengan tanda sama dengan — hasil seri */
function SquareFillEqual(props) {
  const width = props.width || 12;
  const height = props.height || 12;
  const className = props.class || props.className || "";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="m17.03 22h-10.07c-3.67 0-4.97-1.3-4.97-4.97v-10.07c0-3.67 1.3-4.97 4.97-4.97h10.07c3.67 0 4.97 1.3 4.97 4.97v10.07c0 3.67-1.3 4.97-4.97 4.97zm-11.03-7.03v.1c0 1.03.4 1.43 1.47 1.43h9.1c1.03 0 1.43-.4 1.43-1.47v-.1c0-1.03-.4-1.43-1.47-1.43h-9.1c-1.03 0-1.43.4-1.43 1.47zm0-6v.1c0 1.03.4 1.43 1.47 1.43h9.1c1.03 0 1.43-.4 1.43-1.47v-.1c0-1.03-.4-1.43-1.47-1.43h-9.1c-1.03 0-1.43.4-1.43 1.47zm0 0" />
    </svg>
  );
}

export { SquareFillEqual as default };