type DfaBlueprint = {
  _states: State[]
  _initialState: State
  _finalStates: State[]
  _alphabet: PropertyKey[]
  _transitionFn: Function
}

type _exampleDfa = {
  currentState: State
  hasAccepted: boolean
  transitionTo: (input: PropertyKey) => void
} & DfaBlueprint

type State = string

function createDfa(blueprint: DfaBlueprint): _exampleDfa {
  function transitionTo(this: _exampleDfa, input: PropertyKey): void {
    this.currentState = this._transitionFn(this.currentState, input)
  }

  return {
    ...blueprint,
    currentState: blueprint._initialState,
    hasAccepted: blueprint._finalStates.includes(blueprint._initialState),
    transitionTo,
  }
}

function transitionFn(state: State, input: PropertyKey): State {
  if (state === 's1') {
    if (input === 't1') {
      return 's2'
    }
  }

  if (state === 's2') {
    if (input === 't2') {
      return 's3'
    }
  }

  return state
}

const dfa = createDfa({
  _states: ['s1', 's2', 's3'],
  _initialState: 's1',
  _finalStates: ['s3'],
  _alphabet: ['t1, t2'],
  _transitionFn: transitionFn,
})
