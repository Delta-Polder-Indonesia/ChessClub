function Back({ className = "h-6 w-10", size }) {
  const dim = size ? { width: size, height: size } : {};
  return (
    <svg
      viewBox="0 0 36 24"
      fill="currentColor"
      xmlns="http://w3.org"
      className={className}
      {...dim}
      aria-hidden="true"
    >
      <path d="M4 10L3.29289 10.7071L2.58579 10L3.29289 9.29289L4 10ZM33 18C33 18.5523 32.5523 19 32 19C31.4477 19 31 18.5523 31 18L33 18ZM8.29289 15.7071L3.29289 10.7071L4.70711 9.29289L9.70711 14.2929L8.29289 15.7071ZM3.29289 9.29289L8.29289 4.29289L9.70711 5.70711L4.70711 10.7071L3.29289 9.29289ZM4 9L28 9L28 11L4 11L4 9ZM33 16L33 18L31 18L31 16L33 16ZM28 9C30.7614 9 33 11.2386 33 14L33 16L31 16L31 14C31 12.3431 29.6569 11 28 11L28 9Z" />
    </svg>
  );
}
export { Back as default };
