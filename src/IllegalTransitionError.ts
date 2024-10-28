export default class IllegalTransitionError extends Error {
  constructor(
    currentStateName: string,
    transitionName: string,
    sourceTransitionName: string,
    targetTransitionName: string
  ) {
    const message = `Cannot execute transition: ${transitionName} to: ${targetTransitionName}.
    Current state: ${currentStateName} does not match transitions source state: ${sourceTransitionName}`

    super(message)
  }
}
