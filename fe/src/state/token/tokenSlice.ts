import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface tokenState {
  accessToken: string;
  authChecked: boolean;
}
const initialState: tokenState = {
  accessToken: "",
  authChecked: false,
};
export const tokenSlice = createSlice({
  name: "token",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.authChecked = true;
    },
    deleteToken: (state) => {
      state.accessToken = "";
      state.authChecked = false;
    },
  },
});

export const { setToken, deleteToken } = tokenSlice.actions;

export default tokenSlice.reducer;
