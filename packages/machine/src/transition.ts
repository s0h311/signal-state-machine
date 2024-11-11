import TransitionNotFoundError from './TransitionNotFoundError.ts'
import {
  AbstractMachine,
  ActionfulTransition,
  EffectfulTransition,
  MachineBlueprint,
  MachineOptions,
  SimpleTransition,
} from './types.ts'
import IllegalTransitionError from './IllegalTransitionError.ts'
import { TRANSITION_FAILURE } from './consts.ts'

export function _transitionTo<S, V, CurrS, CurrV>(
  this: AbstractMachine<S, V, CurrS, CurrV>,
  transitionName: string
): Promise<V> {
  const transition = this._transitions[transitionName]

  if (transition === undefined) {
    throw new TransitionNotFoundError(transitionName)
  }

  return transition()
}

export function _getTransitionMap<S, V, CurrS, CurrV>(
  machine: AbstractMachine<S, V, CurrS, CurrV>,
  transitions: MachineBlueprint<S, V, CurrV>['transitions'],
  options: MachineOptions<S, CurrS>
): Record<string, Function> {
  const result: Record<string, Function> = {}

  for (const [transitionName, transition] of Object.entries(transitions)) {
    const isEffectful = 'effect' in transition
    const isActionful = 'action' in transition

    let transitionFn = () => simpleTransitionFn(machine, transition)

    if (isEffectful) {
      transitionFn = () => effectfulTransitionFn(machine, transition)
    }

    if (isActionful) {
      transitionFn = () => actionfulTransitionFn(machine, transition)
    }

    result[transitionName] = () => {
      if (!options.compareStateFn(machine.state, transition.sourceState)) {
        throw new IllegalTransitionError(machine.state, transitionName, transition.sourceState, transition.targetState)
      }

      if (transition.targetState === null || transition.targetState === undefined) {
        // TODO handle accept state as target
      }

      return transitionFn()
    }
  }

  return result
}

function simpleTransitionFn<S, V, CurrS, CurrV>(
  machine: AbstractMachine<S, V, CurrS, CurrV>,
  transition: SimpleTransition<S>
): void {
  machine.state = transition.targetState
}

function actionfulTransitionFn<S, V, CurrS, CurrV>(
  machine: AbstractMachine<S, V, CurrS, CurrV>,
  transition: ActionfulTransition<S, V, CurrV>
): void {
  machine.value = transition.action(machine.value)
  machine.state = transition.targetState
}

function effectfulTransitionFn<S, V, CurrS, CurrV>(
  machine: AbstractMachine<S, V, CurrS, CurrV>,
  transition: EffectfulTransition<S, V, CurrV>
): Promise<void> {
  machine.state = transition.targetState

  /**
   * If the promise returns TRANSITION_FAILURE or it rejects failureState
   * will be set as next.
   */
  return transition
    .effect(machine.value)
    .then((result) => {
      if (result === TRANSITION_FAILURE) {
        machine.state = transition.failureState
      } else {
        machine.value = result
        machine.state = transition.successState
      }
    })
    .catch(() => {
      machine.state = transition.failureState
    })
}
