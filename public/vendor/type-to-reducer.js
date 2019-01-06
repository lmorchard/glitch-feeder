// https://raw.githubusercontent.com/tomatau/type-to-reducer/master/src/index.js
let typeDelimiter = "_";

export const setTypeDelimiter = customTypeDelimiter =>
  (typeDelimiter = customTypeDelimiter);

export default function typeToReducer(reducerMap, initialState) {
  const makeType = (prefix, type) => prefix.concat(type).join(typeDelimiter);

  const iterator = (reducers, initial = {}, prefix = []) => {
    const reducerTypes = Object.keys(reducers || {});
    return reducerTypes.reduce((acc, type) => {
      const reducer = reducers[type];
      return typeof reducer === "function"
        ? { ...acc, [makeType(prefix, type)]: reducer }
        : iterator(reducer, acc, [makeType(prefix, type)]);
    }, initial);
  };

  const flattened = iterator(reducerMap);

  return (state = initialState, action) => {
    const reducer = flattened[action.type];
    return reducer ? reducer(state, action) : state;
  };
}
