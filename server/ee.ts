import { EventEmitter } from "events";

export const ee = new EventEmitter();

// Definir tipos para los eventos si es necesario
export type Events = {
  taskUpdated: (task: any) => void;
};

// Sobrecargar emit y on para mejor tipado (opcional pero recomendado)
declare interface TypedEventEmitter {
  on<K extends keyof Events>(event: K, listener: Events[K]): this;
  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): boolean;
}

const typedEe = ee as unknown as TypedEventEmitter;
export { typedEe as eventEmitter };
