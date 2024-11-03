import { TRANSITION_FAILURE } from './consts.ts'
import IllegalTransitionError from './IllegalTransitionError.ts'
import { machineRegistery } from './machineRegistery.ts'
import TransitionNotFoundError from './TransitionNotFoundError.ts'
import { Machine, MachineBlueprint } from './types.ts'

export function createMachine<State extends string, Value>(
  blueprint: MachineBlueprint<State, Value>
) {
  const identifier = Symbol()
  const { state, value, transitions } = blueprint

  const machine: Machine<State, Value> = {
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

  for (const [transitionName, transition] of Object.entries(transitions)) {
    const hasEffect = 'effect' in transition
    const hasAction = 'action' in transition

    let transitionFn = () => {
      machine._state = transition.targetState
    }

    if (hasEffect) {
      transitionFn = () => {
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
    }

    if (hasAction) {
      transitionFn = () => {
        const result = transition.action(machine._value)
        machine._value = result
        machine._state = transition.targetState
      }
    }

    machine._transitions[transitionName] = () => {
      if (machine._state !== transition.sourceState) {
        throw new IllegalTransitionError(
          machine._state,
          transitionName,
          transition.sourceState,
          transition.targetState
        )
      }

      return transitionFn()
    }
  }

  return machine
}
