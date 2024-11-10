import { createMachine } from './machine.ts'
import IllegalTransitionError from './IllegalTransitionError.ts'
import { TRANSITION_FAILURE } from './consts.ts'
import TransitionNotFoundError from './TransitionNotFoundError.ts'
import { Machine } from './types.ts'

const someSimpleTransition = 'someSimpleTransition'
function getSimpleMachine() {
  return createMachine({
    state: 'someState',
    value: 'who cares?',
    transitions: {
      [someSimpleTransition]: {
        sourceState: 'someState',
        targetState: 'someTargetState',
      },
    },
  })
}

const fetchTransition = 'fetch'
function getSuccessfulEffectFullMachine() {
  return createMachine({
    state: 'initial',
    value: [],
    transitions: {
      [fetchTransition]: {
        sourceState: 'initial',
        targetState: 'fetching',
        effect: (): Promise<string[]> => {
          return new Promise((resolve) => {
            const cities = ['London', 'Hamburg', 'Los Angeles']

            setTimeout(() => resolve(cities), 3000)
          })
        },
        successState: 'fetched',
        failureState: 'fetchFailed',
      },
    },
  })
}

function getFailingEffectFullMachine() {
  return createMachine({
    state: 'initial',
    value: [],
    transitions: {
      [fetchTransition]: {
        sourceState: 'initial',
        targetState: 'fetching',
        effect: () => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(TRANSITION_FAILURE), 3000)
          })
        },
        successState: 'fetched',
        failureState: 'fetchFailed',
      },
    },
  })
}

const addToCartTransition = 'addToCart'
const addToCartAgainTransition = 'addToCartAgain'
function getActionFullMachine() {
  return createMachine({
    state: 'emptyCart',
    value: [],
    transitions: {
      [addToCartTransition]: {
        sourceState: 'emptyCart',
        targetState: 'cartWithItem',
        action: (value: string[]) => {
          return [...value, 'newItem1']
        },
      },
      [addToCartAgainTransition]: {
        sourceState: 'cartWithItem',
        targetState: 'cartWithItem',
        action: (value: string[]) => {
          return [...value, 'newItem2']
        },
      },
    },
  })
}

describe('machine creation', () => {
  it('should have correct initialState', () => {
    const machine = getSimpleMachine()

    const actualState = machine.state()
    const expectedState = 'someState'

    expect(actualState).toEqual(expectedState)

    const actualValue = machine.value()
    const expectedValue = 'who cares?'

    expect(actualValue).toEqual(expectedValue)
  })

  it('should have correct initialState, if it is effectfull', () => {
    const machine = getSuccessfulEffectFullMachine()

    const actualState = machine.state()
    const expectedState = 'initial'

    expect(actualState).toEqual(expectedState)

    const actualValue = machine.value()
    const expectedValue: string[] = []

    expect(actualValue).toEqual(expectedValue)
  })
})

describe('machine transitions', () => {
  beforeEach(() => vi.useFakeTimers())

  afterEach(() => vi.restoreAllMocks())

  it('should transition to the correct targetState', () => {
    const machine = getSimpleMachine()
    machine.transitionTo(someSimpleTransition)

    const actualState = machine.state()
    const expectedState = 'someTargetState'

    expect(actualState).toEqual(expectedState)

    const actualValue = machine.value()
    const expectedValue = 'who cares?'

    expect(actualValue).toEqual(expectedValue)
  })

  it('should transition to correct targetState when an effect is triggered', () => {
    const machine = getSuccessfulEffectFullMachine()

    machine.transitionTo(fetchTransition)

    const actualState = machine.state()

    vi.runAllTimers()

    const expectedState = 'fetching'

    expect(actualState).toEqual(expectedState)
  })

  it('should transition to correct successState after an effect is executed', (): Promise<void> => {
    return new Promise((done) => {
      const machine = getSuccessfulEffectFullMachine()

      machine.transitionTo(fetchTransition).then(() => {
        const actualState = machine.state()
        const expectedState = 'fetched'

        expect(actualState).toEqual(expectedState)

        const actualValue = machine.value()
        const expectedValue = ['London', 'Hamburg', 'Los Angeles']

        expect(actualValue).toEqual(expectedValue)

        done()
      })

      vi.runAllTimers()
    })
  })

  it('should transition to correct failureState after an efffect is failed', (): Promise<void> => {
    return new Promise((done) => {
      const machine = getFailingEffectFullMachine()

      machine.transitionTo(fetchTransition).then(() => {
        const actualState = machine.state()
        const expectedState = 'fetchFailed'

        expect(actualState).toEqual(expectedState)

        const actualValue = machine.value()
        const expectedValue: string[] = []

        expect(actualValue).toEqual(expectedValue)

        done()
      })

      vi.runAllTimers()
    })
  })

  it('should transitions to targetState with correct value after an action is executed', () => {
    const machine = getActionFullMachine()

    machine.transitionTo(addToCartTransition)

    const actualState = machine.state()
    const expectedState = 'cartWithItem'

    expect(actualState).toEqual(expectedState)

    const actualValue = machine.value()
    const expectedValue = ['newItem1']

    expect(actualValue).toEqual(expectedValue)
  })

  it.each<{
    testCase: string
    input: {
      machine: Machine<any, any>
      firstTransition: string
      secondTransition: string
    }
    expected: string
  }>([
    {
      testCase:
        'should throw an IllegalTransitionError, if effectful transition from sourceState to targetState is not allowed even if they are the same',
      input: {
        machine: getSuccessfulEffectFullMachine(),
        firstTransition: fetchTransition,
        secondTransition: fetchTransition,
      },
      expected: new IllegalTransitionError('fetched', fetchTransition, 'initial', 'fetching').message,
    },
  ])('$testCase', ({ input: { machine, firstTransition, secondTransition }, expected }): Promise<void> => {
    return new Promise((done) => {
      machine.transitionTo(firstTransition).then(() => {
        expect(() => machine.transitionTo(secondTransition)).toThrowError(expected)

        done()
      })

      vi.runAllTimers()
    })
  })

  it.each<{
    testCase: string
    input: {
      machine: Machine<any, any>
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
      expected: new IllegalTransitionError('cartWithItem', addToCartTransition, 'emptyCart', 'cartWithItem').message,
    },
  ])('$testCase', ({ input: { machine, firstTransition, secondTransition }, expected }) => {
    machine.transitionTo(firstTransition)

    expect(() => machine.transitionTo(secondTransition)).toThrowError(expected)
  })

  it.each<{
    testCase: string
    input: {
      machine: Machine<any, any>
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

    expect(1).toBe(1)
  })

  it('should throw a TransitionNotFoundError, if transitionTo is called with a not existing transitionName', () => {
    const machine = getSuccessfulEffectFullMachine()

    const expectedError = new TransitionNotFoundError('someTransitionThatNotExists')

    expect(() => {
      machine.transitionTo('someTransitionThatNotExists')
    }).toThrowError(expectedError.message)
  })
})
