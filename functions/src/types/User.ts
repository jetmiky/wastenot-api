type Gender = "Laki Laki" | "Perempuan";

interface User {
  levelId: string;
  gender: Gender;
  address: string;
  totalPoints: number;
  wasteCollected: number;
}

export default User;
