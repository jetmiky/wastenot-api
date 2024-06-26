import User from "../types/User";
import AuthFields from "./auth";

type UserData = User & AuthFields;

const users: UserData[] = [
  {
    name: "John Doe",
    email: "johndoe@gmail.com",
    password: "password",
    phoneNumber: "+621234567810",
    address: "Jakarta",
    gender: "Laki Laki",
    role: "user",
    levelId: "",
    totalPoints: 0,
    wasteCollected: 0,
  },
  {
    name: "Annie Tate",
    email: "annietate@gmail.com",
    password: "password",
    phoneNumber: "+621234567811",
    address: "Jakarta",
    gender: "Perempuan",
    role: "user",
    levelId: "",
    totalPoints: 0,
    wasteCollected: 0,
  },
];

export default users;
