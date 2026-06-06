import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div className={cx("container", className)} {...props}>
      {children}
    </div>
  );
}
