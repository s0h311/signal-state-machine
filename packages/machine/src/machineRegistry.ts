import { AbstractMachine } from './types.ts'

export const _machineRegistry = new Map<Symbol, AbstractMachine<any, any, any, any>>()
