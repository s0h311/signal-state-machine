import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createMachine } from './machine.js'
import IllegalTransitionError from './IllegalTransitionError.js'
import { TRANSITION_FAILURE } from './consts.js'

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
          run: () => {
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
  it('should have the someSimpleTransition function', () => {
    const machine = getSimpleMachine()

    const actual = 'someSimpleTransition' in machine
    assert.strictEqual(actual, true)
  })

  it('should have correct initialState', () => {
    const machine = getSimpleMachine()

    const actual = machine.getCurrentState()
    const expected = {
      name: 'someState',
      value: 'someValue',
    }

    assert.deepEqual(actual, expected)
  })

  it('should have correct initialState if it is effectfull', () => {
    const machine = getSuccessfulEffectFullMachine()

    const actual = machine.getCurrentState()
    const expected = {
      name: 'initial',
      value: 'initial',
    }

    assert.deepEqual(actual, expected)
  })
})

describe('machine transitions', () => {
  it('should transition to the correct targetState', () => {
    const machine = getSimpleMachine()
    machine.someSimpleTransition()

    const actual = machine.getCurrentState()
    const expected = {
      name: 'someTargetState',
      value: 'someTargetStateValue',
    }

    assert.deepEqual(actual, expected)
  })

  it('should transition to correct targetState when an effect is triggered', (context) => {
    const machine = getSuccessfulEffectFullMachine()

    context.mock.timers.enable({ apis: ['setTimeout'] })

    machine.fetch()

    const actual = machine.getCurrentState()

    context.mock.timers.runAll()

    const expected = {
      name: 'fetching',
      value: 'fetching',
    }

    assert.deepEqual(actual, expected)
  })

  it('should transition to correct successState after an effect is executed', (context, done) => {
    const machine = getSuccessfulEffectFullMachine()

    context.mock.timers.enable({ apis: ['setTimeout'] })

    machine.fetch().then(() => {
      const actual = machine.getCurrentState()
      const expected = {
        name: 'fetched',
        value: ['London', 'Hamburg', 'Los Angeles'],
      }

      assert.deepEqual(actual, expected)

      done()
    })

    context.mock.timers.runAll()
  })

  it('should transition to correct failureState after an efffect is failed', (context, done) => {
    const machine = getFailingEffectFullMachine()

    context.mock.timers.enable({ apis: ['setTimeout'] })

    machine.fetch().then(() => {
      const actual = machine.getCurrentState()
      const expected = {
        name: 'fetchFailed',
        value: TRANSITION_FAILURE,
      }

      assert.deepEqual(actual, expected)

      done()
    })

    context.mock.timers.runAll()
  })

  it('should throw an error if the sourceState of the transition that is called does not match the currentState', (context, done) => {
    const machine = getSuccessfulEffectFullMachine()

    context.mock.timers.enable({ apis: ['setTimeout'] })

    machine.fetch().then(() => {
      const expected = new IllegalTransitionError('fetched', 'fetch', {
        sourceState: {
          name: 'initial',
          value: 'initial',
        },
        targetState: {
          name: 'fetching',
          value: 'fetching',
        },
      })

      assert.throws(() => {
        machine.fetch()
      }, expected)

      done()
    })

    context.mock.timers.runAll()
  })
})
