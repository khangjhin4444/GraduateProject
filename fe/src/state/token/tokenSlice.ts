import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface tokenState {
  accessToken: string;
}
const initialState: tokenState = {
  accessToken: "",
};
export const tokenSlice = createSlice({
  name: "token",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    deleteToken: (state) => {
      state.accessToken = "";
    },
  },
});

export const { setToken, deleteToken } = tokenSlice.actions;

export default tokenSlice.reducer;
