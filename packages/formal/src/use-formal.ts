import { useState, useMemo, useCallback } from 'react'
import isEqual from 'react-fast-compare'

import { FormalConfig, FormalState, FormalErrors } from './types'
import {
  objectIsEmpty,
  schemaHasAsyncValidation,
  formatYupErrors,
  useIsMounted,
} from './utils'

export default function useFormal<Schema>(
  initialValues: Schema,
  { schema, onSubmit }: FormalConfig<Schema>
): FormalState<Schema> {
  const [lastValues, setLastValues] = useState<Schema>(initialValues)
  const [values, setValues] = useState<Schema>(initialValues)

  const [errors, setErrors] = useState<FormalErrors<Schema>>({})

  const [isValidating, setIsValidating] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

  const isMounted = useIsMounted()

  const isDirty = useMemo(() => !isEqual(lastValues, values), [
    lastValues,
    values,
  ])

  const isValid = useMemo(() => !isDirty || objectIsEmpty(errors), [
    errors,
    isDirty,
  ])

  const change = useCallback(
    (field: keyof Schema, value: any): void => {
      setValues((prevValues: Schema) => ({ ...prevValues, [field]: value }))
    },
    []
  )

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const validate = useCallback(() => {
    if (!schema) {
      throw new Error(
        'You cannot call validate if you have not provided any schema.'
      )
    }

    return new Promise(async (resolve, reject) => {
      if (!isMounted()) reject()

      const isAsync = schemaHasAsyncValidation<Schema>(schema, values)

      try {
        const validationMethod = isAsync ? 'validate' : 'validateSync'

        clearErrors()
        if (isAsync) setIsValidating(true)
        await schema[validationMethod](values, { abortEarly: false })
        resolve()
      } catch (error) {
        if (!isMounted()) return

        setErrors(formatYupErrors<Schema>(error))
        reject()
      } finally {
        if (!isMounted()) return

        if (isAsync) setIsValidating(false)
      }
    })
  }, [schema, isMounted, values, clearErrors])

  const reset = useCallback(() => {
    setValues(lastValues)
    clearErrors()
  }, [clearErrors, lastValues])

  const submit = useCallback(async () => {
    if (schema) {
      try {
        await validate()
        if (!isMounted()) return
      } catch {
        return
      }
    }

    setIsSubmitting(true)
    
    await onSubmit(values)
    if (!isMounted()) return

    setLastValues(values)
    setIsSubmitted(true)
    setIsSubmitting(false)
  }, [schema, onSubmit, values, isMounted, validate])

  const getFieldProps = useCallback(
    (field: keyof Schema) => ({
      disabled: isSubmitting,
      value: values[field],
      error: errors[field] as string,
    }),
    [errors, isSubmitting, values]
  )

  const getResetButtonProps = useCallback(
    () => ({
      disabled:
        (!isDirty && objectIsEmpty(errors)) || isValidating || isSubmitting,
    }),
    [errors, isDirty, isSubmitting, isValidating]
  )

  const getSubmitButtonProps = useCallback(
    () => ({
      disabled:
        (!isDirty && objectIsEmpty(errors)) || isValidating || isSubmitting,
    }),
    [errors, isDirty, isSubmitting, isValidating]
  )

  return {
    isDirty,
    isValid,
    isValidating,
    isSubmitting,
    isSubmitted,
    values,
    errors,
    change,
    setErrors,
    clearErrors,
    validate,
    reset,
    submit,
    getFieldProps,
    getResetButtonProps,
    getSubmitButtonProps,
  }
}
