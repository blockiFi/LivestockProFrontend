import CustomersPage from "@/pages/crm/CustomersPage"
import CustomerDetailPage from "@/pages/crm/CustomerDetailPage"
import CustomerAccountStatementPage from "@/pages/crm/CustomerAccountStatementPage"
import { requireRoutePermission } from "@/lib/loader"

const crmRoutes = [
  {
    path: "crm/customers",
    loader: async ({ request }: { request: Request }) => {
      await requireRoutePermission(new URL(request.url).pathname)
      return null
    },
    element: <CustomersPage />,
  },
  {
    path: "crm/customers/:customerId",
    loader: async ({ request }: { request: Request }) => {
      await requireRoutePermission(new URL(request.url).pathname)
      return null
    },
    element: <CustomerDetailPage />,
  },
  {
    path: "crm/customers/:customerId/account",
    loader: async ({ request }: { request: Request }) => {
      await requireRoutePermission(new URL(request.url).pathname)
      return null
    },
    element: <CustomerAccountStatementPage />,
  },
]

export default crmRoutes
