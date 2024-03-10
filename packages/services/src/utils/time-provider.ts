export interface Clock {
  now(): Date;
}

export const actualTimeProvider: Clock = {
  now() {
    return new Date();
  },
};

export const fakeTimeProvider = (date: Date): Clock => ({
  now() {
    return date;
  },
});
