/**
 * Cancellable Promise Utility
 * 
 * Provides a wrapper to make promises cancellable using AbortController.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { CancellablePromise } from './types';

/**
 * Wraps a promise with cancellation capability using an AbortController.
 * 
 * @param promise - The promise to make cancellable
 * @param abortController - The AbortController to use for cancellation
 * @returns A CancellablePromise with a cancel() method
 * 
 * @example
 * const controller = new AbortController();
 * const cancellable = makeCancellable(fetchData(), controller);
 * 
 * // Later, to cancel:
 * cancellable.cancel();
 */
export function makeCancellable<T>(
  promise: Promise<T>,
  abortController: AbortController
): CancellablePromise<T> {
  // Track if the operation has been cancelled
  let isCancelled = false;

  // Create a promise that rejects when aborted
  const abortPromise = new Promise<never>((_, reject) => {
    abortController.signal.addEventListener('abort', () => {
      isCancelled = true;
      reject(new Error('Operation cancelled by user'));
    });
  });

  // Race the original promise against the abort promise
  const wrappedPromise = Promise.race([promise, abortPromise]).catch((error) => {
    // Re-throw cancellation errors with the standard message
    if (isCancelled || abortController.signal.aborted) {
      throw new Error('Operation cancelled by user');
    }
    throw error;
  });

  // Cast to CancellablePromise and add cancel method
  const cancellablePromise = wrappedPromise as CancellablePromise<T>;
  
  cancellablePromise.cancel = () => {
    abortController.abort();
  };
  
  return cancellablePromise;
}

/**
 * Creates a new CancellablePromise from an async operation.
 * This is a convenience function that creates the AbortController internally.
 * 
 * @param operation - An async function that accepts an AbortSignal
 * @returns A CancellablePromise with a cancel() method
 * 
 * @example
 * const cancellable = createCancellable(async (signal) => {
 *   const response = await fetch(url, { signal });
 *   return response.json();
 * });
 * 
 * // Later, to cancel:
 * cancellable.cancel();
 */
export function createCancellable<T>(
  operation: (signal: AbortSignal) => Promise<T>
): CancellablePromise<T> {
  const abortController = new AbortController();
  const promise = operation(abortController.signal);
  return makeCancellable(promise, abortController);
}
