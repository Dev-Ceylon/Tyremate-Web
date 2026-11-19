import type { ReactNode, ComponentType } from "react"

type Provider = ComponentType<{
  children: ReactNode
}>

export function composeProviders(
  providers: Provider[]
) {
  return function Providers({
    children,
  }: {
    children: ReactNode
  }) {
    return providers.reduceRight(
      (acc, Provider) => (
        <Provider>{acc}</Provider>
      ),
      children
    )
  }
}