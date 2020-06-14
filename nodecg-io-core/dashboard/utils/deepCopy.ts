
/**
 * Creates a deep copy of a object.
 * @param obj the copy of which a deep copy should be created.
 */
export function objectDeepCopy<T extends Object>(obj: T | any): T {
    if (typeof obj === "object") {
        const copy = {} as any;
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = objectDeepCopy(obj[attr]);
        }
        return copy;
    } else {
        return obj;
    }
    
}