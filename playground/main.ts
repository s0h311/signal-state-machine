// @ts-check

import { createMachine } from '@yugen/machine'

const NOT_FETCHED = 'not fetched'
const FETCHING = 'fetching'
const FETCHED = 'fetched'
const FETCH_FAILED = 'fetch failed'

const fetchTransition = 'fetch'

type State = typeof NOT_FETCHED | typeof FETCHING | typeof FETCHED | typeof FETCH_FAILED

const machine = createMachine<State, object[]>({
  state: NOT_FETCHED,
  value: [],
  transitions: {
    [fetchTransition]: {
      sourceState: NOT_FETCHED,
      targetState: FETCHING,
      effect: (value) => {
        return new Promise((resolve, reject) => {
          // setTimeout(() => reject(), 1000)
          setTimeout(() => resolve([...value, { name: 'Jason Statham', age: 40 }]), 2000)
        })
      },
      successState: FETCHED,
      failureState: FETCH_FAILED,
    },
  },
})

console.log(machine.state())
console.log(machine.value())

machine.transitionTo(fetchTransition)

console.log(machine.state())
console.log(machine.value())

setTimeout(() => {
  console.log(machine.state())
  console.log(machine.value())
}, 2000)
