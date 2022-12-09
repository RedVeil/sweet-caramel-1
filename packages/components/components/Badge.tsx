import { FC } from 'react'
import classnames from "classnames";

enum BadgeVariant {
  warning = 'warning',
  success = 'success',
}

interface BadgeProps {
  variant: BadgeVariant;
  label: string
}

export const Badge: FC<BadgeProps> = ({ variant }) => {
  return (
    <span className={classnames("inline-flex items-center rounded-full font-medium", {
      'bg-customLightYellow text-yellow-800': variant === BadgeVariant.warning,
    })}>
      Badge
    </span>
  )
}
