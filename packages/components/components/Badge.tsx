import { FC, ReactNode } from 'react'
import classnames from "classnames";

enum BadgeVariant {
  warning = 'warning',
  success = 'success',
  white = 'white'
}

interface BadgeProps {
  variant: keyof typeof BadgeVariant;
  children: ReactNode
}

export const Badge: FC<BadgeProps> = ({ variant, children }) => {
  return (
    <span className={classnames("inline-flex items-center rounded-full font-medium text-black text-base py-3 px-5 border border-[#d7d7d799]", {
      'bg-customLightYellow': variant === BadgeVariant.warning,
      'bg-customLightGreen': variant === BadgeVariant.success,
      'bg-white': variant === BadgeVariant.white,
    })}>
      {children}
    </span>
  )
}
