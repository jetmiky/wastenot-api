import { Timestamp } from "firebase-admin/firestore";
import { PhoneNumberID } from "./Strings";

interface Sender {
  name: string;
  phone: PhoneNumberID;
}

interface Waste {
  wasteId: string;
  wasteWeight: number;
  wastePoint: number;
}

type Status = "Belum diproses" | "Menunggu penimbangan" | "Selesai";

interface DeliverOrder {
  userId: string;
  bankId: string;
  sender: Sender;
  sendSchedule: Timestamp;
  wasteImageUrl: string;
  wastes: Waste[];
  status: Status;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default DeliverOrder;
