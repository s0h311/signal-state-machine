/*
export type Machine = {
  currentState: State
}

export type State = {
  value: any
  transitions: Transition[]
}

export type Transition = SimpleTransition | ActionfullTransition | EffectfullTransition

export type SimpleTransition = {
  name: string
  nextState: State | null
}

export type ActionfullTransition = SimpleTransition & {
  action: (...arg: any) => void
}

export type EffectfullTransition = SimpleTransition & {
  effect: Effect
}

export type Effect = {
  successTransition: Transition
  failureTransition: Transition
}
*/

export type MachineBluePrint = {
  initialState: State
  transitions: Transitions
}

export type State = {
  name: string
  value: any
}

export type Transitions = {
  [name: string]: Transition
}

export type Transition = SimpleTransition | ActionfullTransition | EffectfullTransition

export type SimpleTransition = {
  sourceState: State
  targetState: State
}

export type ActionfullTransition = SimpleTransition & {
  action: (...arg: any) => any
}

export type EffectfullTransition = SimpleTransition & {
  failureState: State
  effect: {
    run: (...arg: any) => Promise<any | typeof TRANSITION_FAILURE>
    successState: State
  }
}

export const TRANSITION_FAILURE = 'TRANSITION_FAILURE'
