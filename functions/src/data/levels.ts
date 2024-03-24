import Level from "../types/Level";

const levels: Level[] = [
  { name: "Warrior", requiredPoint: 5, nextLevelPoint: 10, badgeDesignUrl: "" },
  { name: "Master", requiredPoint: 10, nextLevelPoint: 15, badgeDesignUrl: "" },
  {
    name: "Grand Master",
    requiredPoint: 15,
    nextLevelPoint: 20,
    badgeDesignUrl: "",
  },
  { name: "Epic", requiredPoint: 20, nextLevelPoint: 25, badgeDesignUrl: "" },
  { name: "Legend", requiredPoint: 25, nextLevelPoint: 30, badgeDesignUrl: "" },
  {
    name: "Mythic",
    requiredPoint: 30,
    nextLevelPoint: 1000,
    badgeDesignUrl: "",
  },
];

export default levels;
