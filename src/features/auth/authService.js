import { saveToken, getToken, removeToken } from "../../utils/storage";

export { saveToken, getToken, removeToken };

export const isAuthenticated = () => {
  return !!getToken();
};
