export const TRANSITION_FAILURE = 'TRANSITION_FAILURE'

export type State<ValueType> = {
  name: string
  value: ValueType
}

export type EffectfullTransition<
  SourceStateValueType,
  TargetStateValueType,
  FailureStateValueType,
  SuccessStateValueType
> = {
  sourceState: State<SourceStateValueType>
  targetState: State<TargetStateValueType>
  failureState: State<FailureStateValueType>
  effect: {
    run: () => Promise<SuccessStateValueType | FailureStateValueType>
    successState: State<SuccessStateValueType>
  }
}

type Transitions<TransitionsType> = {
  [name: string]: TransitionsType
}

const fetchTransition: EffectfullTransition<
  'initial',
  'fetching',
  typeof TRANSITION_FAILURE,
  string[]
> = {
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

        setTimeout(() => resolve(TRANSITION_FAILURE), 3000)
        // setTimeout(() => resolve(cities), 3000)
      })
    },
    successState: {
      name: 'fetched',
      value: [],
    },
  },
}

const fetchTransition2: EffectfullTransition<
  '11initial',
  '11fetching',
  typeof TRANSITION_FAILURE,
  '11fetched'
> = {
  sourceState: {
    name: 'initial',
    value: '11initial',
  },
  targetState: {
    name: 'fetching',
    value: '11fetching',
  },
  failureState: {
    name: 'fetchFailed',
    value: TRANSITION_FAILURE,
  },
  effect: {
    run: (): Promise<'11fetched' | typeof TRANSITION_FAILURE> => {
      return new Promise((resolve) => {
        const cities = ['London', 'Hamburg', 'Los Angeles']

        setTimeout(() => resolve(TRANSITION_FAILURE), 3000)
        // setTimeout(() => resolve(cities), 3000)
      })
    },
    successState: {
      name: 'fetched',
      value: '11fetched',
    },
  },
}

const transitions: Transitions<typeof fetchTransition | typeof fetchTransition2> = {
  fetch: fetchTransition,
  fetch2: fetchTransition2,
}

export type MachineBluePrint<InitialStateType, TransitionsType> = {
  initialState: State<InitialStateType>
  transitions: TransitionsType
}

const bluePrint: MachineBluePrint<'initial', typeof transitions> = {
  initialState: {
    name: 'initial',
    value: 'initial',
  },
  transitions,
}

export type Machine<TransitionsType> = {
  currentState: () => ExtractGeneric<TransitionsType>
  [key: string]: Function
}

type TypeWithGeneric<T> = T[]
export type ExtractGeneric<T> = T extends TypeWithGeneric<infer X> ? X : never
