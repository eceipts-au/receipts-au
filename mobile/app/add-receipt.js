import CameraGate from "@/src/components/permissions/CameraGate";
import AddReceipt from "@/src/screens/AddReceipt";

export default function AddReceiptRoute() {
  return (
    <CameraGate>
      <AddReceipt />
    </CameraGate>
  );
}
