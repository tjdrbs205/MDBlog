import { Types } from "mongoose";

type DTOValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | Types.ObjectId
  | DTOObject
  | DTOValue[]
  | Types.DocumentArray<any>;

interface DTOObject {
  [key: string]: DTOValue;
}

function isObjectIdString(str: string): boolean {
  return /^[a-f\d]{24}$/i.test(str);
}

function fromDTO<T extends DTOObject>(dto: DTOObject): T {
  const result: any = {};

  for (const key in dto) {
    const value = dto[key];

    if (typeof value === "string") {
      if (isObjectIdString(value)) {
        result[key] = new Types.ObjectId(value);
      } else if (!isNaN(Date.parse(value))) {
        result[key] = new Date(value);
      } else {
        result[key] = value;
      }
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" ? fromDTO(item as DTOObject) : item
      );
    } else if (value && typeof value === "object") {
      result[key] = fromDTO(value as DTOObject);
    } else {
      result[key] = value;
    }
  }

  return result;
}

function toDTO<T extends DTOObject>(doc: DTOObject): T {
  const result: any = {};

  for (const key in doc) {
    const value = doc[key];

    if (value instanceof Types.ObjectId) {
      result[key] = value.toString();
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        typeof item === "object" ? toDTO(item as DTOObject) : item;
      });
    } else if (value && typeof value === "object") {
      result[key] = toDTO(value as DTOObject);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export { fromDTO, toDTO };
