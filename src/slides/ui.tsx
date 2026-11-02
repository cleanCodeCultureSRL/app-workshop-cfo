import type { ReactNode } from "react";
import { cx } from "../lib/util";

/** O secțiune de slide: navy (hero, ca pe cfo.ro) sau albă (conținut). */
export function Slide({ variant = "white", children, className }: { variant?: "navy" | "white"; children: ReactNode; className?: string }) {
  return (
    <section className={cx("slide", variant === "navy" ? "slide-navy" : "slide-white", className)}>
      <div className="slide-in">{children}</div>
    </section>
  );
}

/**
 * Copertă: fotografie pe tot ecranul, umbră navy dinspre stânga și de jos, text alb; `children` se așază la baza ecranului.
 * `pos` = object-position al fotografiei („center top” ca să nu taie capul unui om din cadru).
 */
export function CoverSlide({ img, pos = "center", className, children }: { img: string; pos?: string; className?: string; children: ReactNode }) {
  return (
    <section className={cx("slide slide-white cover", className)}>
      <img className="cover-bg" src={img} alt="" style={{ objectPosition: pos }} />
      <div className="cover-shade" />
      <div className="slide-in">{children}</div>
    </section>
  );
}

export const Kicker = ({ children }: { children: ReactNode }) => <div className="kicker">{children}</div>;
export const Lead = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cx("lead", className)}>{children}</p>;
export const Card = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cx("card", className)}>{children}</div>;
export const Note = ({ children, tone }: { children: ReactNode; tone?: "blue" | "coral" }) => <div className={cx("tnote", tone)}>{children}</div>;
export const Todo = ({ children = "DE COMPLETAT" }: { children?: ReactNode }) => <span className="todo">{children}</span>;
