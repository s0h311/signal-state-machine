import { Signal } from 'signal-polyfill'
import type { AbstractMachine, MachineBlueprint } from '@yugen/machine'
import { _getTransitionMap, _transitionTo } from '@yugen/machine'
import { _machineRegistry } from '@yugen/machine'

export function createSignalMachine<S, V>(
  blueprint: MachineBlueprint<S, V, Signal.State<V>>
): AbstractMachine<S, V, Signal.State<S>, Signal.State<V>> {
  const identifier = Symbol()

  const { state, value, transitions } = blueprint

  class SignalMachine implements AbstractMachine<S, V, Signal.State<S>, Signal.State<V>> {
    _identifier = identifier
    _transitions: Record<string, Function> = _getTransitionMap(this, transitions, { compareStateFn })
    transitionTo = _transitionTo

    #state = new Signal.State(state)
    #value = new Signal.State(value)

    get state(): Signal.State<S> {
      return this.#state
    }

    set state(newState: S) {
      if (this.state instanceof Signal.State) {
        this.state.set(newState)
        return
      }

      this.#state = new Signal.State(newState)
    }

    get value(): Signal.State<V> {
      return this.#value
    }

    set value(newValue: V) {
      if (this.value instanceof Signal.State) {
        this.value.set(newValue)
        return
      }

      this.#value = new Signal.State(newValue)
    }
  }

  const signalMachine = new SignalMachine()

  _machineRegistry.set(identifier, signalMachine)

  return signalMachine
}

function compareStateFn<S>(s1: S | Signal.State<S>, s2: S | Signal.State<S>) {
  const s1Unwrapped = s1 instanceof Signal.State ? s1.get() : s1
  const s2Unwrapped = s2 instanceof Signal.State ? s2.get() : s2

  return s1Unwrapped === s2Unwrapped
}
