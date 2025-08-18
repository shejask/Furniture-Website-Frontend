import {
  ref,
  set,
  get,
  push,
  remove,
  update,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { database } from './config';

export const createData = async (path: string, data: any) => {
  try {
    const reference = ref(database, path);
    await set(reference, data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const createDataWithAutoId = async (path: string, data: any) => {
  try {
    const reference = ref(database, path);
    const newRef = push(reference);
    await set(newRef, data);
    return { id: newRef.key, ...data };
  } catch (error) {
    throw error;
  }
};

export const readData = async (path: string) => {
  try {
    const reference = ref(database, path);
    const snapshot = await get(reference);
    return snapshot.val();
  } catch (error) {
    throw error;
  }
};

export const updateData = async (path: string, data: any) => {
  try {
    const reference = ref(database, path);
    await update(reference, data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteData = async (path: string) => {
  try {
    const reference = ref(database, path);
    await remove(reference);
  } catch (error) {
    throw error;
  }
};

export const queryData = async (path: string, field: string, value: any) => {
  try {
    const reference = ref(database, path);
    const queryRef = query(reference, orderByChild(field), equalTo(value));
    const snapshot = await get(queryRef);
    return snapshot.val();
  } catch (error) {
    throw error;
  }
};
