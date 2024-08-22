import { MapSchema, Schema, ToJSON } from '@colyseus/schema'

export const toJson = <V extends Schema>(
  schema: MapSchema<V>,
): Record<string, ToJSON<V>> => schema.toJSON()
