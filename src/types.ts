import { TRANSITION_FAILURE } from './consts.ts'

export type Blueprint<SrcState, TState, FState, SState> = {
  initialState: State<SrcState | TState | FState | SState>
  transitions: Transitions<SrcState, TState, FState, SState>
}

export type Transitions<SrcState, TState, FState, SState> = Record<
  string,
  Transition<SrcState, TState, FState, SState>
>

export type Transition<SrcState, TState, FState, SState> =
  | SimpleTransition<SrcState, TState>
  | ActionfulTransition<SrcState, TState>
  | EffectfulTransition<SrcState, TState, FState, SState>

export type SimpleTransition<SrcState, TState> = {
  sourceState: State<SrcState>
  targetState: State<TState>
}

export type ActionfulTransition<SrcState, TState> = {
  sourceState: State<SrcState>
  targetState: State<TState>
  action: (state: State<SrcState>) => TState
}

export type EffectfulTransition<SrcState, TState, FState, SState> = {
  sourceState: State<SrcState>
  targetState: State<TState>
  failureState: State<FState>
  effect: {
    run: (state: State<SrcState>) => Promise<SState | typeof TRANSITION_FAILURE>
    successState: State<SState>
  }
}

export type State<T> = {
  name: string
  value: T
}

export type MachineTransitions = {
  [transitionName: string]: Function
}

export type Machine<SrcState, TState, FState, SState> = {
  _currentState: State<SrcState | TState | FState | SState>
  _transitions: MachineTransitions
  _identifier: Symbol
  getCurrentState: () => State<SrcState | TState | FState | SState>
  // TODO fix: Promise<SState>
  transitionTo: (transitionName: string) => Promise<SState>
}
