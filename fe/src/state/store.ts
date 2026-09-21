import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "./profile/profileSlice";
import tokenReducer from "./token/tokenSlice";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    token: tokenReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
