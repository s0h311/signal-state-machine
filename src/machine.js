// @ts-check

import { TRANSITION_FAILURE } from './consts.js'
import IllegalTransitionError from './IllegalTransitionError.js'
import { machineRegistery } from './machineRegistery.js'

export function createMachine(bluePrint) {
  const identifier = Symbol()

  /**
   * @typedef {Object} Machine
   * @property {any} currentState
   * @property {unique symbol} identifier
   * @property {() => any} getCurrentState
   */
  const machine = {
    currentState: null,
    identifier,
    getCurrentState() {
      return this.currentState
    },
  }

  // Add machine to machineRegistery
  machineRegistery.set(identifier, machine)

  const { initialState, transitions } = bluePrint

  machine.currentState = initialState

  for (const [transitionName, transition] of Object.entries(transitions)) {
    const hasEffect = 'effect' in transition
    const hasAction = 'action' in transition

    let transitionFn = () => {
      machine.currentState = transition.targetState
    }

    if (hasEffect) {
      transitionFn = () => {
        machine.currentState = transition.targetState

        return transition.effect.run().then((result) => {
          if (result === TRANSITION_FAILURE) {
            machine.currentState = transition.failureState
          } else {
            transition.effect.successState.value = result
            machine.currentState = transition.effect.successState
          }
        })
      }
    }

    if (hasAction) {
      transitionFn = () => {
        const result = transition.action()
        transition.targetState.value = result
        machine.currentState = transition.targetState
      }
    }

    machine[transitionName] = () => {
      if (machine.currentState.name !== transition.sourceState.name) {
        throw new IllegalTransitionError(machine.currentState.name, transitionName, transition)
      }

      return transitionFn()
    }
  }

  return machine
}
