import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ColorMappingState, ColorMapping } from '../../../types';

const initialState: ColorMappingState = {
  byId: {},
  allIds: [],
  selectedId: null,
  loading: false,
  error: null,
};

const colorMappingSlice = createSlice({
  name: 'colorMapping',
  initialState,
  reducers: {
    loadColorMappingsSuccess: (state, action: PayloadAction<ColorMapping[]>) => {
      action.payload.forEach((mapping) => {
        state.byId[mapping.id] = mapping;
        if (!state.allIds.includes(mapping.id)) {
          state.allIds.push(mapping.id);
        }
      });
    },
    selectColorMapping: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
    addColorMapping: (state, action: PayloadAction<ColorMapping>) => {
      state.byId[action.payload.id] = action.payload;
      state.allIds.push(action.payload.id);
    },
    updateColorMapping: (state, action: PayloadAction<ColorMapping>) => {
      state.byId[action.payload.id] = action.payload;
    },
    deleteColorMapping: (state, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
      state.allIds = state.allIds.filter((id) => id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export default colorMappingSlice.reducer;
export const colorMappingActions = colorMappingSlice.actions;
