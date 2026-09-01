import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from "react-router-dom";
import { Provider } from 'react-redux';
import store from './store/index.js';
import Landing from './pages/Landing.tsx';
import Login from './pages/auth/Login.tsx';
import Register from './pages/auth/Register.tsx';
import FarmSelection from './pages/FarmSelection.tsx';
import { Authenticated, LoadActiveFarm, LoadFarmData, LoadFarmPermissions, LoadFarmSettings, LoadFarmDashboard, LoadFarmSubscription, requireRoutePermission } from './lib/loader.ts';
import Dashboard from './pages/Dashboard.tsx';
import FarmPage from './pages/FarmPage.tsx';
import PoultryRoutes from "./routes/poultryRoutes";
import SettingsRoutes from "./routes/settingsRoutes";
import EquipmentRoutes from "./routes/equipmentRoutes";
import { InvoicesPage } from './pages/Invoice.tsx';
import { ThemeProvider, useTheme } from './providers/ThemeProvider.tsx';
import NotificationCenterPage from './pages/NotificationCenterPage.tsx';
import ForbiddenPage from './pages/ForbiddenPage.tsx';

function AppRouter() {
  const { resolvedTheme } = useTheme()

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer  
        position="top-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={resolvedTheme}
      />
    </>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element : <Landing />
  },
  {
    path: "/login",
    element : <Login />
  },
  {
    path: "/register",
    element : <Register />
  },

  {
    path : '/farm-selection',
    loader : async () => {
      const authenticated : boolean = await Authenticated();
      if(authenticated){

      } else{
        toast.error("You must be logged in to access this page.");
        return redirect('/login')
      }
    },
    element : <FarmSelection />

  },
  {
    path : "/dashboard", 
    loader : async () =>  {
      const authenticated : boolean = await Authenticated();
      if(authenticated){
       await LoadActiveFarm();
       await LoadFarmPermissions();
       await LoadFarmSubscription();
      } else{
        toast.error("You must be logged in to access this page.");
        return redirect('/login')
      }

    
    },
    element : <Dashboard />,
    children : [
      {
        path: "",
        loader: async ()   => {
          const {farmStats ,currentFarm} = await LoadFarmData();
          const { dashboard } = await LoadFarmDashboard({ preset: "lifetime" });

          console.log("current Farm in Loader :",currentFarm);
          if(currentFarm === null){
            toast.error("no Farm Selected!!!");
            throw redirect('/farm-selection')
           }
          
           return { currentFarm   , farmStats, dashboard};
        },
        element: <FarmPage />
      },
      {
        path: "forbidden",
        element: <ForbiddenPage />,
      },
      {
        path: "invoices",
        loader : async ({ request })   => {
          await requireRoutePermission(new URL(request.url).pathname);
          const {farmStats ,currentFarm} = await LoadFarmData();
          const { farmSettings } = await LoadFarmSettings();

          if(currentFarm === null){
            toast.error("no Farm Selected!!!");
            throw redirect('/farm-selection')
          }

          return { currentFarm , farmStats, farmSettings};
        },
        
        element: <InvoicesPage />
      },
      {
        path: "notifications",
        loader: async ({ request }) => {
          await requireRoutePermission(new URL(request.url).pathname);
          return null;
        },
        element: <NotificationCenterPage />
      },
      ...SettingsRoutes,
      ...EquipmentRoutes,
      ...PoultryRoutes

    ]
  }

]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </Provider>
   
  </StrictMode>,
)
