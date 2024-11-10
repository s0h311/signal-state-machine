import { TRANSITION_FAILURE } from './consts.ts'
import IllegalTransitionError from './IllegalTransitionError.ts'
import { machineRegistery } from './machineRegistery.ts'
import TransitionNotFoundError from './TransitionNotFoundError.ts'
import { ActionfulTransition, EffectfulTransition, Machine, MachineBlueprint, SimpleTransition } from './types.ts'

export function createMachine<S extends string, V>(blueprint: MachineBlueprint<S, V>) {
  const identifier = Symbol()
  const { state, value, transitions, options } = blueprint

  const machine: Machine<S, V> = {
    _state: state,
    _value: value,
    _transitions: {},
    _identifier: identifier,
    state() {
      return this._state
    },
    value() {
      return this._value
    },
    transitionTo(transitionName: string) {
      const transition = this._transitions[transitionName]

      if (transition === undefined) {
        throw new TransitionNotFoundError(transitionName)
      }

      return transition()
    },
  }

  machineRegistery.set(identifier, machine)

  let compareState = (s1: S, s2: S) => s1 === s2

  if (options?.compareStateFn) {
    compareState = options.compareStateFn
  }

  for (const [transitionName, transition] of Object.entries(transitions)) {
    const isEffectful = 'effect' in transition
    const isActionful = 'action' in transition

    let transitionFn = options?.simpleTransitionFn ?? (() => simpleTransitionFn(machine, transition))

    if (isEffectful) {
      transitionFn = options?.effectfulTransitionFn ?? (() => effectfulTransitionFn(machine, transition))
    }

    if (isActionful) {
      transitionFn = options?.actionfulTransitionFn ?? (() => actionfulTransitionFn(machine, transition))
    }

    machine._transitions[transitionName] = () => {
      if (!compareState(machine._state, transition.sourceState)) {
        throw new IllegalTransitionError(machine._state, transitionName, transition.sourceState, transition.targetState)
      }

      if (transition.targetState === null || transition.targetState === undefined) {
        // TODO handle accept state as target
      }

      return transitionFn()
    }
  }

  return machine
}

function simpleTransitionFn<S, V>(machine: Machine<S, V>, transition: SimpleTransition<S>): void {
  machine._state = transition.targetState
}

function actionfulTransitionFn<S, V>(machine: Machine<S, V>, transition: ActionfulTransition<S, V>): void {
  const result = transition.action(machine._value)
  machine._value = result
  machine._state = transition.targetState
}

function effectfulTransitionFn<S, V>(machine: Machine<S, V>, transition: EffectfulTransition<S, V>): Promise<void> {
  machine._state = transition.targetState

  /**
   * If the promise returns TRANSITION_FAILURE or it rejects failureState
   * will be set as next.
   */
  return transition
    .effect(machine._value)
    .then((result) => {
      if (result === TRANSITION_FAILURE) {
        machine._state = transition.failureState
      } else {
        machine._value = result
        machine._state = transition.successState
      }
    })
    .catch(() => {
      machine._state = transition.failureState
    })
}
