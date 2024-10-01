function createInstrumentationGetter(isReadOnly: boolean, shallow: boolean) {}

export const mutableCollectionHandlers = {
  get: createInstrumentationGetter(false, false),
};
