function Getter() {
  return function (target: any, propertyKey: string) {
    const privateKey = `_${propertyKey}`;
    Object.defineProperty(target, privateKey, {
      get(): any {
        return this[privateKey];
      },
      enumerable: true,
      configurable: true,
    });
  };
}

function Setter(options: { update?: boolean } = {}) {
  return function (target: any, propertyKey: string) {
    const privateKey = `_${propertyKey}`;
    const { update = true } = options;

    Object.defineProperty(target, privateKey, {
      set(value: any): void {
        this[privateKey] = value;
        if (update && this._updateAt) {
          this._updateAt = new Date();
        }
      },
      enumerable: true,
      configurable: true,
    });
  };
}
