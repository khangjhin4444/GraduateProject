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
    setToken: (state, action: PayloadAction<tokenState>) => {
      state.accessToken = action.payload.accessToken;
    },
  },
});

export const { setToken } = tokenSlice.actions;

export default tokenSlice.reducer;
