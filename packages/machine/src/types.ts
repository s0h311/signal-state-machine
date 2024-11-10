import { TRANSITION_FAILURE } from './consts'

/**
 * S will most likely be a union type,
 * something like 'not fecthed' | 'fetching' | 'fetched' | 'fetch failed'
 *
 * V will be a single type, it is not likely that the data structure or type
 * will change
 */
export type MachineBlueprint<S, V> = {
  state: S
  value: V
  transitions: {
    [transitionName: string]: SimpleTransition<S> | ActionfulTransition<S, V> | EffectfulTransition<S, V>
  }
  options?: MachineOptions
}

export type SimpleTransition<S> = {
  sourceState: S
  targetState: S
}

export type ActionfulTransition<S, V> = {
  sourceState: S
  targetState: S
  action: (value: V) => V
}

export type EffectfulTransition<S, V> = {
  sourceState: S
  targetState: S
  effect: (value: V) => Promise<V>
  successState: S
  failureState: S
}

export type Machine<S, V> = {
  _identifier: Symbol
  _state: S
  _value: V
  _transitions: Record<string, Function>
  state: () => S
  value: () => V
  transitionTo: (transitionName: string) => Promise<V>
}

export type MachineOptions = {
  compareStateFn?: <S>(s1: S, s2: S) => boolean
  simpleTransitionFn?: () => <S, V>(machine: Machine<S, V>, transition: SimpleTransition<S>) => void
  actionfulTransitionFn?: () => <S, V>(machine: Machine<S, V>, transition: SimpleTransition<S>) => void
  effectfulTransitionFn?: () => <S, V>(machine: Machine<S, V>, transition: SimpleTransition<S>) => void
}
