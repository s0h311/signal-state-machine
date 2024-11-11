import { createSignalMachine } from './signalMachine'

const notFetched = 'NOT_FETCHED'
const fetching = 'FETCHING'
const fetched = 'FETCHED'
const fetchFailed = 'FETCH_FAILED'

const fetchTransition = 'fetch'

function getSuccessfulEffectfulSignalMachine() {
  return createSignalMachine({
    state: notFetched,
    value: [],
    transitions: {
      [fetchTransition]: {
        sourceState: notFetched,
        targetState: fetching,
        effect: (): Promise<string[]> => {
          return new Promise((resolve) => {
            const cities = ['London', 'Hamburg', 'Los Angeles']

            setTimeout(() => resolve(cities), 3000)
          })
        },
        successState: fetched,
        failureState: fetchFailed,
      },
    },
  })
}

describe('signal machine creation', () => {
  it('should have a signal holding the correct initial state, if it is effectful', () => {
    const machine = getSuccessfulEffectfulSignalMachine()

    const actual = machine.state.get()

    expect(actual).toEqual(notFetched)
  })
})
