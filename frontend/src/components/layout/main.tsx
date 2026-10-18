import { cn } from '@/lib/utils'

type MainProps = React.HTMLAttributes<HTMLElement>

/** Centred page container used by every route below the app header. */
export function Main({ className, ...props }: MainProps) {
  return (
    <main
      className={cn('mx-auto w-full max-w-6xl px-4 py-6 md:px-8', className)}
      {...props}
    />
  )
}
