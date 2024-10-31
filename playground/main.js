// @ts-check

import { createMachine } from 'signal-state-machine'

const NOT_FETCHED = 'not fetched'
const FETCHING = 'fetching'
const FETCHED = 'fetched'
const FETCH_FAILED = 'fetch failed'

const fetchTransition = 'fetch'

const initialState = {
  name: NOT_FETCHED,
  value: [],
}

const machine = createMachine({
  initialState,
  transitions: {
    [fetchTransition]: {
      sourceState: initialState,
      targetState: {
        name: FETCHING,
        value: [],
      },
      effect: {
        run: (state) => {
          return new Promise((resolve, reject) => {
            // setTimeout(() => reject(), 1000)
            // setTimeout(() => resolve([...state.value, { name: 'Jason Statham', age: 40 }]), 2000)
          })
        },
        successState: {
          name: FETCHED,
          value: [],
        },
        failureState: {
          name: FETCH_FAILED,
          value: [],
        },
      },
    },
  },
})

console.log(machine.getCurrentState())

machine.transitionTo(fetchTransition)

console.log(machine.getCurrentState())

setTimeout(() => {
  console.log(machine.getCurrentState())
}, 2000)
