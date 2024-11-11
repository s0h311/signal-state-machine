import { _machineRegistry } from './machineRegistry.ts'
import { AbstractMachine, MachineBlueprint } from './types.ts'
import { _getTransitionMap, _transitionTo } from './transition.ts'

export function createMachine<S, V>(blueprint: MachineBlueprint<S, V, V>) {
  const identifier = Symbol()
  const { state, value, transitions } = blueprint

  class Machine implements AbstractMachine<S, V, S, V> {
    _identifier = identifier
    _transitions: Record<string, Function> = _getTransitionMap(this, transitions, { compareStateFn })
    transitionTo = _transitionTo

    #state = state
    #value = value

    get state(): S {
      return this.#state
    }

    set state(s: S) {
      this.#state = s
    }

    get value(): V {
      return this.#value
    }

    set value(v: V) {
      this.#value = v
    }
  }

  const machine = new Machine()

  _machineRegistry.set(identifier, machine)

  return machine
}

function compareStateFn<S, CurrS>(s1: S | CurrS, s2: S | CurrS): boolean {
  return s1 === s2
}
