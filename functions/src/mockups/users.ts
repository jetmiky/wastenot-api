import User from "../types/User";
import AuthFields from "./auth";

type UserData = User & AuthFields;

const users: UserData[] = [
  {
    name: "John Doe",
    email: "johndoe@gmail.com",
    password: "password",
    phoneNumber: "+62123456781",
    address: "Jakarta",
    gender: "Laki Laki",
    role: "user",
    levelId: "",
    totalPoints: 10,
    wasteCollected: 10,
  },
  {
    name: "Annie Tate",
    email: "annietate@gmail.com",
    password: "password",
    phoneNumber: "+62123456782",
    address: "Jakarta",
    gender: "Perempuan",
    role: "user",
    levelId: "",
    totalPoints: 35,
    wasteCollected: 20,
  },
];

export default users;
