import { createSignalMachine } from './signalMachine'
import { describe, expect } from 'vitest'

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

const notLoggedIn = 'NOT_LOGGED_IN'
const loggedIn = 'LOGGED_IN'
const loggedOut = 'LOGGED_OUT'

const loginTransition = 'login'
const logoutTransition = 'logout'
const loginAgainTransition = 'login again'

type LoginState = typeof notLoggedIn | typeof loggedIn | typeof loggedOut
type LoginValue = null | string

function getActionfulSignalMachine() {
  return createSignalMachine<LoginState, LoginValue>({
    state: notLoggedIn,
    value: null,
    transitions: {
      [loginTransition]: {
        sourceState: notLoggedIn,
        targetState: loggedIn,
        action: (_, userId: string) => userId,
      },
      [logoutTransition]: {
        sourceState: loggedIn,
        targetState: loggedOut,
        action: () => null,
      },
      [loginAgainTransition]: {
        sourceState: loggedOut,
        targetState: loggedIn,
        action: (_, userId: string) => userId,
      },
    },
  })
}

describe('signal machine creation', () => {
  it('should have a signal holding the correct initial state and value, if the transition is effectful', () => {
    const machine = getSuccessfulEffectfulSignalMachine()

    const actualState = machine.state.get()
    const actualValue = machine.value.get()

    expect(actualState).toEqual(notFetched)
    expect(actualValue).toEqual([])
  })

  it('should have a signal holding the correct initial state and value, if the transition is actionful', () => {
    const machine = getActionfulSignalMachine()

    const actualState = machine.state.get()
    const actualValue = machine.value.get()

    expect(actualState).toEqual(notLoggedIn)
    expect(actualValue).toEqual(null)
  })
})

describe('signal machine transition', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.restoreAllMocks())

  it('should return correct state and value after a successful effect', () => {
    const machine = getSuccessfulEffectfulSignalMachine()

    machine.transitionTo(fetchTransition).then(() => {
      const actualState = machine.state.get()
      expect(actualState).toEqual(fetched)

      const actualValue = machine.value.get()
      expect(actualValue).toEqual(['London', 'Hamburg', 'Los Angeles'])
    })

    vi.runAllTimers()
  })
})
