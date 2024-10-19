export default class IllegalTransitionError extends Error {
  constructor(currentStateName, transitionName, transition) {
    const message = `Cannot execute transition: ${transitionName} to: ${transition.targetState.name}.
    Current state: ${currentStateName} does not match transitions source state: ${transition.sourceState.name}`

    super(message)
  }
}
