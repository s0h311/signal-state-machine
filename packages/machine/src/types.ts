import { ACCEPT_STATE } from './consts'

/**
 * State will most likely be a union type,
 * something like 'not fecthed' | 'fetching' | 'fetched' | 'fetch failed'
 *
 * Value will be a single type, it is not likely that the data structure or type
 * will change
 */
export type MachineBlueprint<State, Value> = {
  state: State
  value: Value
  transitions: {
    [transitionName: string]:
      | {
          sourceState: State
          targetState: State | AcceptState
        }
      | {
          sourceState: State
          targetState: State | AcceptState
          action: (value: Value) => Value
        }
      | {
          sourceState: State
          targetState: State
          effect: (value: Value) => Promise<Value>
          successState: State | AcceptState
          failureState: State | AcceptState
        }
  }
}

export type Machine<State, Value> = {
  _identifier: Symbol
  _state: State | AcceptState
  _value: Value
  _transitions: Record<string, Function>
  state: () => State | AcceptState
  value: () => Value
  transitionTo: (transitionName: string) => Promise<Value>
}

export type AcceptState = typeof ACCEPT_STATE
