import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface profileState {
  fullName: string;
  address: string;
  phoneNumber: string;
}

const initialState: profileState = {
  fullName: "",
  address: "",
  phoneNumber: "",
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setInfo: (state, action: PayloadAction<profileState>) => {
      state.fullName = action.payload.fullName;
      state.address = action.payload.address;
      state.phoneNumber = action.payload.phoneNumber;
    },
  },
});

export const { setInfo } = profileSlice.actions;

export default profileSlice.reducer;
