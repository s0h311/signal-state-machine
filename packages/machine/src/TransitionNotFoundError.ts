export default class TransitionNotFoundError extends Error {
  constructor(transitionName: string) {
    const message = `Transition: ${transitionName} does not exist on this machine`

    super(message)
  }
}
