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
    [transitionName: string]:
      | {
          sourceState: S
          targetState: S
        }
      | {
          sourceState: S
          targetState: S
          action: (value: V) => V
        }
      | {
          sourceState: S
          targetState: S
          effect: (value: V) => Promise<V>
          successState: S
          failureState: S
        }
  }
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
