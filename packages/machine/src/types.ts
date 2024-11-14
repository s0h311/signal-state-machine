/**
 * S will most likely be a union type,
 * something like 'not fetched' | 'fetching' | 'fetched' | 'fetch failed'
 *
 * V will be a single type, it is not likely that the data structure or type
 * will change
 */
export type MachineBlueprint<S, V, CurrV> = {
  state: S
  value: V
  transitions: {
    [transitionName: string]: SimpleTransition<S> | ActionfulTransition<S, V, CurrV> | EffectfulTransition<S, V, CurrV>
  }
}

export type SimpleTransition<S> = {
  sourceState: S
  targetState: S
}

export type ActionfulTransition<S, V, CurrV> = {
  sourceState: S
  targetState: S
  action: (currentValue: CurrV, ...args: any[]) => V
}

export type EffectfulTransition<S, V, CurrV> = {
  sourceState: S
  targetState: S
  effect: (currentValue: CurrV, ...args: any[]) => Promise<V>
  successState: S
  failureState: S
}

export type AbstractMachine<S, V, CurrS, CurrV> = {
  _identifier: Symbol
  _transitions: Record<string, Function>
  transitionTo: (transitionName: string) => Promise<V>
  get state(): CurrS
  set state(s: S)
  get value(): CurrV
  set value(s: V)
}

export type MachineOptions<S, CurrS> = {
  compareStateFn: (s1: S | CurrS, s2: S | CurrS) => boolean
}
