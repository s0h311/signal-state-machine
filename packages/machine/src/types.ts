/**
 * State will most likely be a union type,
 * something like 'not fecthed' | 'fetching' | 'fetched' | 'fetch failed'
 *
 * Value will be a single type, it is not likely that the data structure of type
 * will change
 */
export type MachineBlueprint<State, Value> = {
  state: State
  value: Value
  transitions: {
    [transitionName: string]:
      | {
          sourceState: State
          targetState: State
        }
      | {
          sourceState: State
          targetState: State
          action: (value: Value) => Value
        }
      | {
          sourceState: State
          targetState: State
          effect: (value: Value) => Promise<Value>
          successState: State
          failureState: State
        }
  }
}

export type Machine<State, Value> = {
  _identifier: Symbol
  _state: State
  _value: Value
  _transitions: Record<string, Function>
  state: () => State
  value: () => Value
  transitionTo: (transitionName: string) => Promise<Value>
}
