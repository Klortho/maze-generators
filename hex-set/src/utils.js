// True if the variable is defined and not null
export const notNull = obj => (typeof obj !== 'undefined') && obj !== null;

// True if an object is a regular object with the given non-null property.
export const propOk = obj => prop =>
  (typeof obj === 'object') && (obj !== null) &&
  (prop in obj) && (obj[prop] !== null);
