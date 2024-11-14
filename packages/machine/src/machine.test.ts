import { createMachine } from './machine.ts'
import IllegalTransitionError from './IllegalTransitionError.ts'
import { TRANSITION_FAILURE } from './consts.ts'
import TransitionNotFoundError from './TransitionNotFoundError.ts'
import { AbstractMachine } from './types.ts'

const notAcceptedCookies = 'NOT_ACCEPTED_COOKIES'
const acceptedCookies = 'ACCEPTED_COOKIES'

const acceptCookiesTransition = 'accept cookies'

function getSimpleMachine() {
  return createMachine({
    state: notAcceptedCookies,
    value: null,
    transitions: {
      [acceptCookiesTransition]: {
        sourceState: notAcceptedCookies,
        targetState: acceptedCookies,
      },
    },
  })
}

const notFetched = 'NOT_FETCHED'
const fetching = 'FETCHING'
const fetched = 'FETCHED'
const fetchFailed = 'FETCH_FAILED'

const fetchTransition = 'fetch'

function getSuccessfulEffectfulMachine() {
  return createMachine({
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

function getFailingEffectfulMachine() {
  return createMachine({
    state: notFetched,
    value: [],
    transitions: {
      [fetchTransition]: {
        sourceState: notFetched,
        targetState: fetching,
        effect: (): Promise<string[]> => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(TRANSITION_FAILURE), 3000)
          })
        },
        successState: fetched,
        failureState: fetchFailed,
      },
    },
  })
}

const emptyCart = 'EMPTY_CART'
const cartWithItem = 'CART_WITH_ITEM'

const addToCartTransition = 'addToCart'
const addToCartAgainTransition = 'addToCartAgain'

function getActionFullMachine() {
  return createMachine({
    state: emptyCart,
    value: [],
    transitions: {
      [addToCartTransition]: {
        sourceState: emptyCart,
        targetState: cartWithItem,
        action: (value: string[], newItem: string) => {
          return [...value, newItem]
        },
      },
      [addToCartAgainTransition]: {
        sourceState: cartWithItem,
        targetState: cartWithItem,
        action: (value: string[], newItem: string) => {
          return [...value, newItem]
        },
      },
    },
  })
}

describe('machine creation', () => {
  it('should have correct initialState', () => {
    const machine = getSimpleMachine()

    const actualState = machine.state
    expect(actualState).toEqual(notAcceptedCookies)

    const actualValue = machine.value
    expect(actualValue).toEqual(null)
  })

  it('should have correct initialState, if it is effectfull', () => {
    const machine = getSuccessfulEffectfulMachine()

    const actualState = machine.state
    expect(actualState).toEqual(notFetched)

    const actualValue = machine.value
    expect(actualValue).toEqual([])
  })
})

describe('machine transitions', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.restoreAllMocks())

  it('should transition to the correct targetState', () => {
    const machine = getSimpleMachine()
    machine.transitionTo(acceptCookiesTransition)

    const actualState = machine.state
    expect(actualState).toEqual(acceptedCookies)

    const actualValue = machine.value
    expect(actualValue).toEqual(null)
  })

  it('should transition to correct targetState when an effect is triggered', () => {
    const machine = getSuccessfulEffectfulMachine()

    machine.transitionTo(fetchTransition)

    const actualState = machine.state

    vi.runAllTimers()

    expect(actualState).toEqual(fetching)
  })

  it('should transition to correct successState after an effect is executed', () => {
    const machine = getSuccessfulEffectfulMachine()

    machine.transitionTo(fetchTransition).then(() => {
      const actualState = machine.state
      expect(actualState).toEqual(fetched)

      const actualValue = machine.value
      expect(actualValue).toEqual(['London', 'Hamburg', 'Los Angeles'])
    })

    vi.runAllTimers()
  })

  it('should transition to correct failureState after an effect is failed', () => {
    const machine = getFailingEffectfulMachine()

    machine.transitionTo(fetchTransition).then(() => {
      const actualState = machine.state
      expect(actualState).toEqual(fetchFailed)

      const actualValue = machine.value
      expect(actualValue).toEqual([])
    })

    vi.runAllTimers()
  })

  it('should transitions to targetState with correct value after an action is executed', () => {
    const machine = getActionFullMachine()

    machine.transitionTo(addToCartTransition, 'newItem1')

    const actualState = machine.state
    expect(actualState).toEqual(cartWithItem)

    const actualValue = machine.value
    expect(actualValue).toEqual(['newItem1'])
  })

  it.each<{
    testCase: string
    input: {
      machine: AbstractMachine<any, any, any, any>
      firstTransition: string
      secondTransition: string
    }
    expected: string
  }>([
    {
      testCase:
        'should throw an IllegalTransitionError, if effectful transition from sourceState to targetState is not allowed even if they are the same',
      input: {
        machine: getSuccessfulEffectfulMachine(),
        firstTransition: fetchTransition,
        secondTransition: fetchTransition,
      },
      expected: new IllegalTransitionError(fetched, fetchTransition, notFetched, fetching).message,
    },
  ])('$testCase', ({ input: { machine, firstTransition, secondTransition }, expected }) => {
    machine.transitionTo(firstTransition).then(() => {
      expect(() => machine.transitionTo(secondTransition)).toThrowError(expected)
    })

    vi.runAllTimers()
  })

  it.each<{
    testCase: string
    input: {
      machine: AbstractMachine<any, any, any, any>
      firstTransition: string
      secondTransition: string
    }
    expected: string
  }>([
    {
      testCase:
        'should throw an IllegalTransitionError, if actionful transition from sourceState to targetState is not allowed even if they are the same',
      input: {
        machine: getActionFullMachine(),
        firstTransition: addToCartTransition,
        secondTransition: addToCartTransition,
      },
      expected: new IllegalTransitionError(cartWithItem, addToCartTransition, emptyCart, cartWithItem).message,
    },
  ])('$testCase', ({ input: { machine, firstTransition, secondTransition }, expected }) => {
    machine.transitionTo(firstTransition)

    expect(() => machine.transitionTo(secondTransition)).toThrowError(expected)
  })

  it.each<{
    testCase: string
    input: {
      machine: AbstractMachine<any, any, any, any>
      firstTransition: string
      secondTransition: string
    }
  }>([
    {
      testCase:
        'should not throw an IllegalTransitionError, if actionful transition from sourceState to targetState is allowed even if they are the same',
      input: {
        machine: getActionFullMachine(),
        firstTransition: addToCartTransition,
        secondTransition: addToCartAgainTransition,
      },
    },
  ])('$testCase', ({ input: { machine, firstTransition, secondTransition } }) => {
    machine.transitionTo(firstTransition)

    machine.transitionTo(secondTransition)

    // asserts true at this points
  })

  it('should throw a TransitionNotFoundError, if transitionTo is called with a not existing transitionName', () => {
    const machine = getFailingEffectfulMachine()

    const expectedError = new TransitionNotFoundError('someTransitionThatNotExists')

    expect(() => {
      machine.transitionTo('someTransitionThatNotExists')
    }).toThrowError(expectedError.message)
  })
})
