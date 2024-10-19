import { MachineBluePrint, State, TRANSITION_FAILURE } from './types-2'

const hamburgState: State = {
  name: 'hamburg',
  value: 'Hamburg',
}

const londonState: State = {
  name: 'london',
  value: 'London',
}

const losAngelesState: State = {
  name: 'los angeles',
  value: 'Los Angeles',
}

const citiesMachine: MachineBluePrint = {
  initialState: hamburgState,
  transitions: {
    hamburgToLondon: {
      sourceState: hamburgState,
      targetState: londonState,
    },
    londonToHamburg: {
      sourceState: londonState,
      targetState: hamburgState,
    },
    londonToLosAngeles: {
      sourceState: londonState,
      targetState: losAngelesState,
    },
  },
}

const initial: State = {
  name: 'initial',
  value: 'initial',
}

const fetching: State = {
  name: 'fetching',
  value: 'fetching',
}

const fetched: State = {
  name: 'fetched',
  value: [],
}

const fetchFailed: State = {
  name: 'fetchFailed',
  value: 'failed',
}

const machine: MachineBluePrint = {
  initialState: initial,
  transitions: {
    fetch: {
      sourceState: initial,
      targetState: fetching,
      failureState: fetchFailed,
      effect: {
        run: fakeApiCall,
        successState: fetched,
      },
    },
  },
}

export function fakeApiCall(): Promise<string[] | typeof TRANSITION_FAILURE> {
  return new Promise((resolve) => {
    const cities = ['London', 'Hamburg', 'Los Angeles']

    setTimeout(() => resolve(TRANSITION_FAILURE), 3000)
    // setTimeout(() => resolve(cities), 3000)
  })
}

const machines = new Map<Symbol, Machine>()

export class Machine {
  public currentState: State
  public identifier: Symbol

  constructor(bluePrint: MachineBluePrint) {
    this.identifier = Symbol()
    machines.set(this.identifier, this)

    const { initialState, transitions } = bluePrint

    this.currentState = initialState

    for (const [transitionName, transition] of Object.entries(transitions)) {
      const hasEffect = 'effect' in transition
      if (hasEffect) {
        // @ts-expect-error
        this[transitionName] = (): Promise<any> => {
          // temporary state until and effect response is retrieved
          this.currentState = transition.targetState

          return transition.effect.run().then((result) => {
            if (result === TRANSITION_FAILURE) {
              this.currentState = transition.failureState
            } else {
              transition.effect.successState.value = result
              this.currentState = transition.effect.successState
            }
          })
        }
      }

      const hasAction = 'action' in transition
      if (hasAction) {
        // @ts-expect-error
        this[transitionName] = () => {
          const result = transition.action()
          transition.targetState.value = result
          this.currentState = transition.targetState
        }
      }
    }
  }
}

function main(): void {
  const m = new Machine(machine)

  console.log(JSON.stringify(m.currentState, null, 2))

  // @ts-expect-error
  m.fetch().then(() => console.log(JSON.stringify(m.currentState, null, 2)))

  console.log(JSON.stringify(m.currentState, null, 2))
}

main()
