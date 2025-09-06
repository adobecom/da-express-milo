import { useContext, createContext } from 'react';
import { recipe2Form } from '../utils/recipe-form-utils.js';

export const DataContext = createContext(null);
export const DispatchContext = createContext(null);

export const InfoContext = createContext(null);

export function useFormData() {
  return useContext(DataContext);
}

export function useFormDispatch() {
  return useContext(DispatchContext);
}

export function useInfo() {
  return useContext(InfoContext);
}

export const ACTION_TYPES = {
  UPDATE_RECIPE: 'UPDATE_RECIPE',
  UPDATE_FORM: 'UPDATE_FORM',
  TOPICS_ADD: 'TOPICS_ADD',
  TOPICS_UPDATE: 'TOPICS_UPDATE',
  TOPICS_REMOVE: 'TOPICS_REMOVE',
  TOPICS_EXPAND: 'TOPICS_EXPAND',
  IDS_ADD: 'IDS_ADD',
  IDS_REMOVE: 'IDS_REMOVE',
  IDS_UPDATE: 'IDS_UPDATE'
};

export function reducer(state, action) {
  const { type, payload } = action;
  const { field, value, topicsRow, topicsCol, idsRow } = payload || {};

  switch (type) {
    case ACTION_TYPES.UPDATE_RECIPE: {
      return recipe2Form(value);
    }
    case ACTION_TYPES.UPDATE_FORM: {
      return { ...state, [field]: value };
    }
    case ACTION_TYPES.TOPICS_ADD: {
      const clonedTopics = structuredClone(state.topics);
      clonedTopics[topicsRow].push('');
      return { ...state, topics: clonedTopics };
    }
    case ACTION_TYPES.TOPICS_REMOVE: {
      const clonedTopics = structuredClone(state.topics);
      clonedTopics[topicsRow].pop();
      clonedTopics[topicsRow].length || clonedTopics.splice(topicsRow, 1);
      return {
        ...state,
        topics: clonedTopics,
      };
    }
    case ACTION_TYPES.TOPICS_UPDATE: {
      const clonedTopics = structuredClone(state.topics);
      clonedTopics[topicsRow][topicsCol] = value;
      return {
        ...state,
        topics: clonedTopics,
      };
    }
    case ACTION_TYPES.TOPICS_EXPAND: {
      return {
        ...state,
        topics: [...state.topics, ['']],
      };
    }
    case ACTION_TYPES.IDS_ADD: {
      return {
        ...state,
        templateIds: [...state.templateIds, ''],
      };
    }
    case ACTION_TYPES.IDS_UPDATE: {
      return {
        ...state,
        templateIds: [...state.templateIds.slice(0, idsRow), value, ...state.templateIds.slice(idsRow + 1)],
      };
    }
    case ACTION_TYPES.IDS_REMOVE: {
      return {
        ...state,
        templateIds: [...state.templateIds.slice(0, idsRow), ...state.templateIds.slice(idsRow + 1)],
      };
    }

    default:
      throw new Error(`Unhandled action type: ${type}`);
  }
}
