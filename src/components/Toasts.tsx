import { dismissNotice, useStore } from "../lib/store";
import { cx } from "../lib/util";

export function Toasts() {
  const notices = useStore((s) => s.notices);
  if (!notices.length) return null;
  return (
    <div className="toasts">
      {notices.map((n) => (
        <div key={n.id} className={cx("toast", `toast-${n.tone ?? "info"}`)} onClick={() => dismissNotice(n.id)}>
          <div>{n.text}</div>
        </div>
      ))}
    </div>
  );
}
