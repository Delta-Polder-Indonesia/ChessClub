/* Ikon Database untuk navigasi halaman Analisa */
function Database(props) {
  const width = props.width || 18;
  const height = props.height || 18;
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
      <path d="M12 2C6.48 2 2 3.34 2 5v14c0 1.66 4.48 3 10 3s10-1.34 10-3V5c0-1.66-4.48-3-10-3zm0 2c4.97 0 8 1.12 8 1s-3.03 1-8 1-8-.12-8-1 3.03-1 8-1zm8 5.47C18.67 10.22 15.54 11 12 11s-6.67-.78-8-1.53V7.24C5.54 8.3 8.54 9 12 9s6.46-.7 8-1.76v2.23zm0 4.5c-1.33.75-4.46 1.53-8 1.53s-6.67-.78-8-1.53v-2.23C5.54 12.8 8.54 13.5 12 13.5s6.46-.7 8-1.76v2.23zm0 4.5c-1.33.75-4.46 1.53-8 1.53s-6.67-.78-8-1.53v-2.23C5.54 17.3 8.54 18 12 18s6.46-.7 8-1.76v2.23z" />
    </svg>
  );
}

export { Database as default };
