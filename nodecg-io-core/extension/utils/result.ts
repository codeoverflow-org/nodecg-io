/**
 * Result is a return type for functions which might return a value
 * or might fail and return a string which describes the error.
 * Intended for functions which are called from a GUI and should provide a error message if one occurs.
 *
 * The result is represented by the {@link Failure} and {@link Success} types.
 *
 * @typeParam T the return type of the function on success.
 */
export type Result<T> = Failure | Success<T>;

/**
 * Function has failed and has returned a string describing the error.
 * Should be created by calling {@link error}.
 */
export type Failure = {
    failed: true;
    errorMessage: string;
};

/**
 * Function has succeeded and has returned its result.
 * Should be created by calling {@link success} or {@link emptySuccess}.
 */
export type Success<T> = {
    failed: false;
    result: T;
};

/**
 * Indicates that the function has failed and has produced some error.
 *
 * @param errorMessage a precise description of the error.
 */
export function error(errorMessage: string): Failure {
    return {
        failed: true,
        errorMessage: errorMessage,
    };
}

/**
 * Indicates that the function has succeeded and has produced a return value.
 *
 * @param result the value that the function wants to return.
 */
export function success<T>(result: T): Success<T> {
    return {
        failed: false,
        result: result,
    };
}

/**
 * Indicates that a void function has executed successfully but wants to return void/nothing.
 */
export function emptySuccess(): Success<void> {
    return success(undefined);
}
