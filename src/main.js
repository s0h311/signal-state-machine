import { createMachine, TRANSITION_FAILURE } from './machine.js'

const machine = createMachine({
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

await machine.fetch()
await machine.fetch()
