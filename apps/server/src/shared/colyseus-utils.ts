import { MapSchema, ArraySchema, Schema } from '@colyseus/schema'

export type NonFunctionProps<T> = Omit<
  T,
  {
    [K in keyof T]: T[K] extends Function ? K : never
  }[keyof T]
>

export type NonFunctionPropNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

// TODO submit PR  to @colyseus/schema to make recursive
export type ToJSON<T> = NonFunctionProps<{
  [K in keyof T]: T[K] extends MapSchema<infer U>
    ? Record<string, ToJSON<U>>
    : T[K] extends Map<string, infer U>
      ? Record<string, ToJSON<U>>
      : T[K] extends ArraySchema<infer U>
        ? ToJSON<U>[]
        : T[K] extends Schema
          ? ToJSON<T[K]>
          : T[K]
}>
