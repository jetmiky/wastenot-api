import { Timestamp } from "firebase-admin/firestore";

interface Sender {
  name: string;
  phone: string;
}

interface Waste {
  wasteId: string;
  wasteWeight: number;
  wastePoint: number;
}

interface DeliverOrder {
  userId: string;
  bankId: string;
  sender: Sender;
  sendSchedule: Timestamp;
  wasteImageUrl: string;
  wastes: Waste[];
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default DeliverOrder;
