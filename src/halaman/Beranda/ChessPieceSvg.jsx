import React from "react";

/**
 * Standard crisp vector SVG chess pieces for White (K, Q, R, B, N, P)
 * and Black (k, q, r, b, n, p).
 */

export function ChessPiece({ piece, className = "w-full h-full" }) {
  if (!piece) return null;

  switch (piece) {
    // White Pieces
    case "K":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="White King">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22.5 11.63V6M20 8h5"
              strokeLinejoin="miter"
            />
            <path
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
              fill="#ffffff"
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            <path
              d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5C20 16 10.5 13 6.5 19.5c-3 6 6 10.5 6 10.5v7z"
              fill="#ffffff"
            />
            <path
              d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"
            />
          </g>
        </svg>
      );

    case "Q":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="White Queen">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5 4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm-27 4a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm21 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"
              fill="#ffffff"
            />
            <path
              d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-16-6 16-7-11 2 12z"
              fill="#ffffff"
              strokeLinecap="butt"
            />
            <path
              d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
              fill="#ffffff"
            />
            <path
              d="M11 38.5a35 35 1 0 0 23 0"
              fill="none"
              strokeLinecap="butt"
            />
            <path
              d="M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0M10.5 37.5a35 35 1 0 0 24 0"
            />
          </g>
        </svg>
      );

    case "R":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="White Rook">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm2.5-4l1.5-14h13l1.5 14h-16zm-1.5-14l-2-4h21l-2 4H13zm-3-4v-5h4v2h3v-2h5v2h3v-2h5v2h3v-2h4v5H10z"
              fill="#ffffff"
              strokeLinecap="butt"
            />
            <path d="M12 36v-4h21v4H12z" fill="#ffffff" />
            <path d="M14 29.5v-13h17v13H14z" strokeLinejoin="miter" />
            <path d="M14 16.5L12 12.5h21l-2 4H14z" />
            <path d="M14 29.5h17M14 16.5h17M11 14h23M12 35.5h21" />
          </g>
        </svg>
      );

    case "B":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="White Bishop">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g fill="#ffffff" strokeLinecap="butt">
              <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z" />
              <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
              <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
            </g>
            <path d="M17.5 26h10M15 30h15" />
            <path
              d="M22.5 10v4M20.5 12h4"
              strokeLinejoin="miter"
            />
            <path
              d="M17.5 15.5c2 1 8 1 10 0M20 18c1.5.5 3.5.5 5 0"
              strokeLinecap="butt"
            />
          </g>
        </svg>
      );

    case "N":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="White Knight">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
              fill="#ffffff"
            />
            <path
              d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.66 2.05-2 2-1 0-1.85-.75-2-1-.38-.94.4-1.74 1-2.5 1-1.37.5-2 .5-3 0-1-1-1.5-1-1.5s2.5-1.5 3-2c1.5-1.5 2-1.5 3-4 .5-1.5 1.5-2.5 2-3.5 1.5-3 2.5-4 4.5-4s4 2.5 4.5 4.5z"
              fill="#ffffff"
            />
            <path
              d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-11a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z"
              fill="#1a1a1a"
              stroke="#1a1a1a"
            />
            <path
              d="M24.55 10.4s-.45 1.45-1.05 1.8c-.6.35-1.8.35-1.8.35"
              strokeLinecap="butt"
            />
          </g>
        </svg>
      );

    case "P":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="White Pawn">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
              fill="#ffffff"
            />
            <path d="M12 36c5-2.5 16-2.5 21 0" />
            <path d="M17 26.5c3-1.5 8-1.5 11 0" />
          </g>
        </svg>
      );

    // Black Pieces
    case "k":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="Black King">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22.5 11.63V6"
              strokeLinejoin="miter"
              stroke="#ffffff"
            />
            <path
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
              fill="#1e293b"
              stroke="#1e293b"
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            <path
              d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5C20 16 10.5 13 6.5 19.5c-3 6 6 10.5 6 10.5v7z"
              fill="#1e293b"
              stroke="#1e293b"
            />
            <path
              d="M20 8h5"
              strokeLinejoin="miter"
              stroke="#ffffff"
            />
            <path
              d="M32 29.5c-5.5-3-15.5-3-21 0M32 33c-5.5-3-15.5-3-21 0M32 36.5c-5.5-3-15.5-3-21 0"
              stroke="#ffffff"
            />
          </g>
        </svg>
      );

    case "q":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="Black Queen">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5 4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm-27 4a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm21 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"
              fill="#1e293b"
              stroke="#1e293b"
            />
            <path
              d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-16-6 16-7-11 2 12z"
              fill="#1e293b"
              stroke="#1e293b"
              strokeLinecap="butt"
            />
            <path
              d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
              fill="#1e293b"
              stroke="#1e293b"
            />
            <path
              d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0M11 37a35 35 1 0 0 23 0"
              stroke="#ffffff"
            />
          </g>
        </svg>
      );

    case "r":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="Black Rook">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M9 39h27v-3H9v3zm3.5-7l1.5-13h17l1.5 13h-20zm-.5-17l-2-3.5h20l-2 3.5H12z"
              fill="#1e293b"
              stroke="#1e293b"
              strokeLinecap="butt"
            />
            <path
              d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm2.5-4l1.5-14h13l1.5 14h-16zm-1.5-14l-2-4h21l-2 4H13zm-3-4v-5h4v2h3v-2h5v2h3v-2h5v2h3v-2h4v5H10z"
              fill="#1e293b"
              stroke="#1e293b"
            />
            <path
              d="M14 29.5v-13h17v13H14z"
              stroke="#ffffff"
              strokeLinejoin="miter"
            />
            <path
              d="M14 16.5L12 12.5h21l-2 4H14z"
              stroke="#ffffff"
            />
            <path
              d="M12 35.5h21"
              stroke="#ffffff"
            />
          </g>
        </svg>
      );

    case "b":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="Black Bishop">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g fill="#1e293b" stroke="#1e293b" strokeLinecap="butt">
              <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z" />
              <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
              <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
            </g>
            <path
              d="M17.5 26h10M15 30h15"
              stroke="#ffffff"
            />
            <path
              d="M22.5 10v4M20.5 12h4"
              stroke="#ffffff"
              strokeLinejoin="miter"
            />
            <path
              d="M17.5 15.5c2 1 8 1 10 0M20 18c1.5.5 3.5.5 5 0"
              stroke="#ffffff"
              strokeLinecap="butt"
            />
          </g>
        </svg>
      );

    case "n":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="Black Knight">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
              fill="#1e293b"
              stroke="#1e293b"
            />
            <path
              d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.66 2.05-2 2-1 0-1.85-.75-2-1-.38-.94.4-1.74 1-2.5 1-1.37.5-2 .5-3 0-1-1-1.5-1-1.5s2.5-1.5 3-2c1.5-1.5 2-1.5 3-4 .5-1.5 1.5-2.5 2-3.5 1.5-3 2.5-4 4.5-4s4 2.5 4.5 4.5z"
              fill="#1e293b"
              stroke="#1e293b"
            />
            <path
              d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-11a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z"
              fill="#ffffff"
              stroke="#ffffff"
            />
            <path
              d="M24.55 10.4s-.45 1.45-1.05 1.8c-.6.35-1.8.35-1.8.35"
              stroke="#ffffff"
              strokeLinecap="butt"
            />
          </g>
        </svg>
      );

    case "p":
      return (
        <svg viewBox="0 0 45 45" className={className} aria-label="Black Pawn">
          <g
            fill="none"
            fillRule="evenodd"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
              fill="#1e293b"
              stroke="#1e293b"
            />
            <path
              d="M12 36c5-2.5 16-2.5 21 0M17 26.5c3-1.5 8-1.5 11 0"
              stroke="#ffffff"
            />
          </g>
        </svg>
      );

    default:
      return null;
  }
}
