import { createMachine } from './machine.ts'
import IllegalTransitionError from './IllegalTransitionError.ts'
import { TRANSITION_FAILURE } from './consts.ts'

function getSimpleMachine() {
  return createMachine({
    initialState: {
      name: 'someState',
      value: 'someValue',
    },
    transitions: {
      someSimpleTransition: {
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

function getSuccessfulEffectFullMachine() {
  return createMachine({
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

              // setTimeout(() => resolve(TRANSITION_FAILURE), 3000)
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
          run: () => {
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
}

function getSuccessfulActionFullMachine() {
  return createMachine({
    initialState: {
      name: 'Hamburg',
      value: 'Hamburg',
    },
    transitions: {
      fetch: {
        sourceState: {
          name: 'Hamburg',
          value: 'Hamburg',
        },
        targetState: {
          name: '',
          value: null,
        },
        action: () => ({
          name: 'London',
          value: 'London',
        }),
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

  it('should have correct initialState if it is effectfull', () => {
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
    machine.transitionTo('someSimpleTransition')

    const actual = machine.getCurrentState()
    const expected = {
      name: 'someTargetState',
      value: 'someTargetStateValue',
    }

    expect(actual).toEqual(expected)
  })

  it('should transition to correct targetState when an effect is triggered', () => {
    const machine = getSuccessfulEffectFullMachine()

    machine.transitionTo('fetch')

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

      machine.transitionTo('fetch').then(() => {
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

      machine.transitionTo('fetch').then(() => {
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

  it('should throw an error if the sourceState of the transition that is called does not match the currentState', (): Promise<void> => {
    return new Promise((done) => {
      const machine = getSuccessfulEffectFullMachine()

      machine.transitionTo('fetch').then(() => {
        const expectedError = new IllegalTransitionError('fetched', 'fetch', 'initial', 'fetching')

        expect(() => machine.transitionTo('fetch')).toThrowError(expectedError.message)

        done()
      })

      vi.runAllTimers()
    })
  })
})
