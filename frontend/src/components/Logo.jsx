import React from "react";

export default function Logo({ size = "md" }) {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
  };
  return (
    <img
      src="/idZR0Cnb5m_1772794169518.png"
      alt="Ganpat University"
      className={`${sizes[size]} w-60 object-contain`}
      onError={(e) => {
        e.target.style.display = "none";
        e.target.nextSibling.style.display = "flex";
      }}
    />
  );
}
