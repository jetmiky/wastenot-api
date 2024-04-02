import UserRole from "../types/UserRole";

type AuthFields = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
};

export default AuthFields;
