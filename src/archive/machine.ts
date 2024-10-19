import {
  EffectfullTransition,
  MachineBluePrint,
  State,
  TRANSITION_FAILURE,
  Machine,
  ExtractGeneric,
} from './types'

const fetchMachine = createMachine({
  initialState: {
    name: 'initial',
    value: 'initial',
  },
  transitions: {
    fetch: {
      sourceState: {
        name: 'initial',
        value: 'initial',
      },
      targetState: {
        name: 'fetching',
        value: 'fetching',
      },
      failureState: {
        name: 'fetchFailed',
        value: TRANSITION_FAILURE,
      },
      effect: {
        run: (): Promise<string[] | typeof TRANSITION_FAILURE> => {
          return new Promise((resolve) => {
            const cities = ['London', 'Hamburg', 'Los Angeles']

            setTimeout(() => resolve(TRANSITION_FAILURE), 3000)
            // setTimeout(() => resolve(cities), 3000)
          })
        },
        successState: {
          name: 'fetched',
          value: [],
        },
      },
    },
  },
})

export function createMachine<InitialStateType, TransitionsType>(
  bluePrint: MachineBluePrint<InitialStateType, TransitionsType>
) {
  class Machine {
    #currentState: State<ExtractGeneric<typeof bluePrint.transitions>>
    public identifier: Symbol

    constructor() {
      this.identifier = Symbol()

      const { initialState, transitions } = bluePrint

      // @ts-ignore
      this.#currentState = initialState

      // @ts-ignore
      for (const [transitionName, transition] of Object.entries(transitions)) {
        // @ts-ignore
        const hasEffect = 'effect' in transition
        if (hasEffect) {
          // @ts-expect-error
          this[transitionName] = (): Promise<any> => {
            // temporary state until and effect response is retrieved
            this.#currentState = transition.targetState

            return transition.effect.run().then((result) => {
              if (result === TRANSITION_FAILURE) {
                this.#currentState = transition.failureState
              } else {
                transition.effect.successState.value = result
                this.#currentState = transition.effect.successState
              }
            })
          }
        }
      }
    }

    public currentState(): ExtractGeneric<typeof bluePrint.transitions> {
      return this.#currentState.value
    }
  }

  return new Machine()
}
