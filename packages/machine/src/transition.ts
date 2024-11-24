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
  transitionName: string,
  ...args: any[]
): Promise<V> {
  const transition = this._transitions[transitionName]

  if (transition === undefined) {
    throw new TransitionNotFoundError(transitionName)
  }

  return transition(...args)
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

    let transitionFn = (..._args: any[]) => simpleTransitionFn(machine, transition)

    if (isEffectful) {
      transitionFn = (...args: any[]) => effectfulTransitionFn(machine, transition, ...args)
    }

    if (isActionful) {
      transitionFn = (...args: any[]) => actionfulTransitionFn(machine, transition, ...args)
    }

    result[transitionName] = (...args: any[]) => {
      if (!options.compareStateFn(machine.state, transition.sourceState)) {
        throw new IllegalTransitionError(machine.state, transitionName, transition.sourceState, transition.targetState)
      }

      return transitionFn(...args)
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
  transition: ActionfulTransition<S, V, CurrV>,
  ...args: any[]
): void {
  machine.value = transition.action(machine.value, ...args)
  machine.state = transition.targetState
}

function effectfulTransitionFn<S, V, CurrS, CurrV>(
  machine: AbstractMachine<S, V, CurrS, CurrV>,
  transition: EffectfulTransition<S, V, CurrV>,
  ...args: any[]
): Promise<void> {
  machine.state = transition.targetState

  /**
   * If the promise returns TRANSITION_FAILURE, or it rejects, failureState
   * will be set as next.
   */
  return transition
    .effect(machine.value, ...args)
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
