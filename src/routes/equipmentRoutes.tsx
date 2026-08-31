import EquipmentManagementPage from "@/pages/equipment/EquipmentManagementPage";
import { requireRoutePermission } from "@/lib/loader";

const EquipmentRoutes = [
  {
    path: "equipment",
    loader: async ({ request }: { request: Request }) => {
      await requireRoutePermission(new URL(request.url).pathname);
      return null;
    },
    element: <EquipmentManagementPage />,
  },
];

export default EquipmentRoutes;
