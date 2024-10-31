import { createMachine } from './machine.ts'
import IllegalTransitionError from './IllegalTransitionError.ts'
import { TRANSITION_FAILURE } from './consts.ts'
import TransitionNotFoundError from './TransitionNotFoundError.ts'
import { Machine } from './types.ts'

const someSimpleTransition = 'someSimpleTransition'
function getSimpleMachine() {
  return createMachine({
    initialState: {
      name: 'someState',
      value: 'someValue',
    },
    transitions: {
      [someSimpleTransition]: {
        sourceState: {
          name: 'someState',
          value: 'someValue',
        },
        targetState: {
          name: 'someTargetState',
          value: 'someTargetStateValue',
        },
      },
    },
  })
}

const fetchTransition = 'fetch'
function getSuccessfulEffectFullMachine() {
  return createMachine({
    initialState: {
      name: 'initial',
      value: 'initial',
    },
    transitions: {
      [fetchTransition]: {
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

              setTimeout(() => resolve(cities), 3000)
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
}

function getFailingEffectFullMachine() {
  return createMachine({
    initialState: {
      name: 'initial',
      value: 'initial',
    },
    transitions: {
      [fetchTransition]: {
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
          run: () => {
            return new Promise((_, reject) => {
              setTimeout(() => reject(TRANSITION_FAILURE), 3000)
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
}

const addToCartTransition = 'addToCart'
const addToCartAgainTransition = 'addToCartAgain'
function getActionFullMachine() {
  return createMachine({
    initialState: {
      name: 'emptyCart',
      value: [],
    },
    transitions: {
      [addToCartTransition]: {
        sourceState: {
          name: 'emptyCart',
          value: [],
        },
        targetState: {
          name: 'cartWithItem',
          value: [],
        },
        action: (state) => {
          return [...state.value, 'newItem1']
        },
      },
      [addToCartAgainTransition]: {
        sourceState: {
          name: 'cartWithItem',
          value: [],
        },
        targetState: {
          name: 'cartWithItem',
          value: [],
        },
        action: (state) => {
          return [...state.value, 'newItem2']
        },
      },
    },
  })
}

describe('machine creation', () => {
  it('should have correct initialState', () => {
    const machine = getSimpleMachine()

    const actual = machine.getCurrentState()
    const expected = {
      name: 'someState',
      value: 'someValue',
    }

    expect(actual).toEqual(expected)
  })

  it('should have correct initialState, if it is effectfull', () => {
    const machine = getSuccessfulEffectFullMachine()

    const actual = machine.getCurrentState()
    const expected = {
      name: 'initial',
      value: 'initial',
    }

    expect(actual).toEqual(expected)
  })
})

describe('machine transitions', () => {
  beforeEach(() => vi.useFakeTimers())

  afterEach(() => vi.restoreAllMocks())

  it('should transition to the correct targetState', () => {
    const machine = getSimpleMachine()
    machine.transitionTo(someSimpleTransition)

    const actual = machine.getCurrentState()
    const expected = {
      name: 'someTargetState',
      value: 'someTargetStateValue',
    }

    expect(actual).toEqual(expected)
  })

  it('should transition to correct targetState when an effect is triggered', () => {
    const machine = getSuccessfulEffectFullMachine()

    machine.transitionTo(fetchTransition)

    const actual = machine.getCurrentState()

    vi.runAllTimers()

    const expected = {
      name: 'fetching',
      value: 'fetching',
    }

    expect(actual).toEqual(expected)
  })

  it('should transition to correct successState after an effect is executed', (): Promise<void> => {
    return new Promise((done) => {
      const machine = getSuccessfulEffectFullMachine()

      machine.transitionTo(fetchTransition).then(() => {
        const actual = machine.getCurrentState()
        const expected = {
          name: 'fetched',
          value: ['London', 'Hamburg', 'Los Angeles'],
        }

        expect(actual).toEqual(expected)

        done()
      })

      vi.runAllTimers()
    })
  })

  it('should transition to correct failureState after an efffect is failed', (): Promise<void> => {
    return new Promise((done) => {
      const machine = getFailingEffectFullMachine()

      machine.transitionTo(fetchTransition).then(() => {
        const actual = machine.getCurrentState()
        const expected = {
          name: 'fetchFailed',
          value: TRANSITION_FAILURE,
        }

        expect(actual).toEqual(expected)

        done()
      })

      vi.runAllTimers()
    })
  })

  it('should transitions to targetState with correct value after an action is executed', () => {
    const machine = getActionFullMachine()

    machine.transitionTo(addToCartTransition)

    const actual = machine.getCurrentState()
    const expected = {
      name: 'cartWithItem',
      value: ['newItem1'],
    }

    expect(actual).toEqual(expected)
  })

  it.each<{
    testCase: string
    input: {
      machine: Machine<any, any, any, any>
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
      expected: new IllegalTransitionError('fetched', fetchTransition, 'initial', 'fetching')
        .message,
    },
  ])(
    '$testCase',
    ({ input: { machine, firstTransition, secondTransition }, expected }): Promise<void> => {
      return new Promise((done) => {
        machine.transitionTo(firstTransition).then(() => {
          expect(() => machine.transitionTo(secondTransition)).toThrowError(expected)

          done()
        })

        vi.runAllTimers()
      })
    }
  )

  it.each<{
    testCase: string
    input: {
      machine: Machine<any, any, any, any>
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
      expected: new IllegalTransitionError(
        'cartWithItem',
        addToCartTransition,
        'emptyCart',
        'cartWithItem'
      ).message,
    },
  ])('$testCase', ({ input: { machine, firstTransition, secondTransition }, expected }) => {
    machine.transitionTo(firstTransition)

    expect(() => machine.transitionTo(secondTransition)).toThrowError(expected)
  })

  it.each<{
    testCase: string
    input: {
      machine: Machine<any, any, any, any>
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
