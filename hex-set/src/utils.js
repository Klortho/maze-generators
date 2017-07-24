// True if the variable is defined and not null
export const notNull = obj => (typeof obj !== 'undefined') && obj !== null;

// True if an object is a regular object with the given non-null property.
export const propOk = obj => prop =>
  (typeof obj === 'object') && (obj !== null) &&
  (prop in obj) && (obj[prop] !== null);

// Rounds a float to the nearest 10^-5
export const round = num => Math.round(num*1000 + 0.1)/1000;
