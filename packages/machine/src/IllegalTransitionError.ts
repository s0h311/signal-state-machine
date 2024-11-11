export default class IllegalTransitionError extends Error {
  constructor(currentStateName: any, transitionName: any, sourceTransitionName: any, targetTransitionName: any) {
    const message = `Cannot execute transition: ${String(transitionName)} to: ${String(targetTransitionName)}.
    Current state: ${String(currentStateName)} does not match transitions source state: ${String(sourceTransitionName)}`

    super(message)
  }
}
