import { TRANSITION_FAILURE } from './consts.ts'
import IllegalTransitionError from './IllegalTransitionError.ts'
import { machineRegistery } from './machineRegistery.ts'
import TransitionNotFoundError from './TransitionNotFoundError.ts'
import { Blueprint, Machine } from './types.ts'

export function createMachine<SrcState, TState, FState, SState>(
  blueprint: Blueprint<SrcState, TState, FState, SState>
) {
  const identifier = Symbol()
  const { initialState, transitions } = blueprint

  const machine: Machine<SrcState, TState, FState, SState> = {
    _currentState: initialState,
    _transitions: {},
    identifier,
    getCurrentState() {
      return this._currentState
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
      machine._currentState = transition.targetState
    }

    if (hasEffect) {
      transitionFn = () => {
        machine._currentState = transition.targetState

        return transition.effect.run().then((result) => {
          if (result === TRANSITION_FAILURE) {
            machine._currentState = transition.failureState
          } else {
            transition.effect.successState.value = result
            machine._currentState = transition.effect.successState
          }
        })
      }
    }

    if (hasAction) {
      transitionFn = () => {
        const result = transition.action()
        transition.targetState.value = result
        machine._currentState = transition.targetState
      }
    }

    machine._transitions[transitionName] = () => {
      if (machine._currentState.name !== transition.sourceState.name) {
        throw new IllegalTransitionError(
          machine._currentState.name,
          transitionName,
          transition.sourceState.name,
          transition.targetState.name
        )
      }

      return transitionFn()
    }
  }

  return machine
}
