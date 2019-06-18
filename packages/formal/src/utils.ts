/* eslint-disable no-restricted-syntax, @typescript-eslint/no-object-literal-type-assertion, no-prototype-builtins */
import { useEffect, useRef } from 'react'
import { Schema as YupSchema } from 'yup'

import { FormalErrors } from './types'

export function formatYupErrors<Values>(yupError: any): FormalErrors<Values> {
  const errors: any = {} as FormalErrors<Values>

  if(typeof yupError === 'object' && yupError.hasOwnProperty('inner')){
    for (const err of yupError.inner) {
      if (!errors[err.path]) {
        errors[err.path] = err.message
      }
    }
  }

  return errors
}

export function objectIsEmpty(obj: object): boolean {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) return false
  }

  return true
}

export function schemaHasAsyncValidation<Schema>(
  schema: YupSchema<Schema>,
  values: Schema
): boolean {
  try {
    schema.validateSync(values)
  } catch (error) {
    if (error.message.includes('Promise')) return true
  }

  return false
}

// Check if component is still mounted
export const useIsMounted = () => {
  const ref = useRef<boolean>(false)

  useEffect(() => {
    ref.current = true

    return () => {
      ref.current = false
    }
  }, [])

  return () => ref.current
}
