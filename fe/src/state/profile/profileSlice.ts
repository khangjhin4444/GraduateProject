import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface profileState {
  id: number;
  cartQuantity: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  role: "admin" | "user";
}

const initialState: profileState = {
  id: 0,
  cartQuantity: 0,
  fullName: "",
  address: "",
  phoneNumber: "",
  role: "user",
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setInfo: (state, action: PayloadAction<profileState>) => {
      state.id = action.payload.id;
      state.cartQuantity = action.payload.cartQuantity;
      state.fullName = action.payload.fullName;
      state.address = action.payload.address;
      state.phoneNumber = action.payload.phoneNumber;
      state.role = action.payload.role;
    },
    deleteInfo: () => {
      return initialState;
    },
  },
});

export const { setInfo, deleteInfo } = profileSlice.actions;

export default profileSlice.reducer;
