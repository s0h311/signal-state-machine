import { Machine } from './types.ts'

export const machineRegistery = new Map<Symbol, Machine<any, any>>()
