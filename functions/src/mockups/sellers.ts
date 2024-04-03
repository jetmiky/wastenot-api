import Seller from "../types/Seller";
import AuthFields from "./auth";

type SellerData = Seller & AuthFields;

const sellers: SellerData[] = [
  {
    name: "Toko Daur Ulang",
    email: "tokodaurulang@gmail.com",
    password: "password",
    phoneNumber: "+621234567820",
    address: "Jakarta Timur",
    role: "seller",
  },
  {
    name: "Toko Bekas Istimewa",
    email: "tokobekasistimewa@gmail.com",
    password: "password",
    phoneNumber: "+621234567821",
    address: "Jakarta Barat",
    role: "seller",
  },
];

export default sellers;
