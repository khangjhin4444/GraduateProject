import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface profileState {
  id: number;
  fullName: string | undefined;
  phoneNumber: string | undefined;
  street: string | undefined;
  wardName: string | undefined;
  provinceName: string | undefined;
  role: "admin" | "user";
}

const initialState: profileState = {
  id: 0,
  fullName: "",
  street: "",
  wardName: "",
  provinceName: "",
  phoneNumber: "",
  role: "user",
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setInfo: (state, action: PayloadAction<profileState>) => {
      state.id = action.payload.id;
      state.fullName = action.payload.fullName;
      state.phoneNumber = action.payload.phoneNumber;
      state.role = action.payload.role;
      state.street = action.payload.street;
      state.wardName = action.payload.wardName;
      state.provinceName = action.payload.provinceName;
    },
    deleteInfo: () => {
      return initialState;
    },
  },
});

export const { setInfo, deleteInfo } = profileSlice.actions;

export default profileSlice.reducer;
