import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import ProjectDirectory from './pages/Projects/ProjectDirectory';
import ProjectDetails from './pages/Projects/ProjectDetails';
import CreateProject from './pages/Projects/CreateProject';
import MyTasks from './pages/Tasks/MyTasks';
import ReplacementManagement from './pages/Replacements/ReplacementManagement';
import GlobalFinancialDashboard from './pages/Financials/GlobalFinancialDashboard';
import ClientDirectory from './pages/Clients/ClientDirectory';
import AuditLogs from './pages/Audit/AuditLogs';
import StaffKPI from './pages/Staff/StaffKPI';
import SupervisionTeamManagement from './pages/Supervision/SupervisionTeamManagement';
import ProfilePage from './pages/Profile/ProfilePage';
import AccountSettings from './pages/Profile/AccountSettings';
import ChangePassword from './pages/Profile/ChangePassword';
import EditProject from './pages/Projects/EditProject';
import ClosedProjects from './pages/Projects/ClosedProjects';
import PendingProjects from './pages/Projects/PendingProjects';
import CreateChangeOrder from './pages/Projects/CreateChangeOrder';
import TimelineView from './pages/Projects/TimelineView';
import PriorityEdit from './pages/Projects/PriorityEdit';
import AllTasks from './pages/Tasks/AllTasks';
import CreateTask from './pages/Tasks/CreateTask';
import TaskDetails from './pages/Tasks/TaskDetails';
import SupervisionDirectory from './pages/Supervision/SupervisionDirectory';
import ActionRequests from './pages/Supervision/ActionRequests';
import InternalDesignReview from './pages/Supervision/InternalDesignReview';
import InvoiceDetails from './pages/Financials/InvoiceDetails';
import FinancialReport from './pages/Financials/FinancialReport';
import ContractorsDirectory from './pages/Contractors/ContractorsDirectory';
import ContractorDetails from './pages/Contractors/ContractorDetails';
import StaffManagement from './pages/Admin/StaffManagement';
import UserManagement from './pages/Admin/UserManagement';
import ReportsAnalytics from './pages/Admin/ReportsAnalytics';
import ExternalLogs from './pages/Admin/ExternalLogs';
import ActiveProjects from './pages/Projects/ActiveProjects';
import ReportsCenter from './pages/Admin/ReportsCenter';
import ExportConsole from './pages/Admin/ExportConsole';
import InvoiceConsole from './pages/Financials/InvoiceConsole';
import ChatCenter from './pages/Chat/ChatCenter';
import ReviewDirectory from './pages/InternalReview/ReviewDirectory';
<<<<<<< HEAD
import EditTask from './pages/tasks/EditTask';  // غيّر المسار حسب مجلدك
import MySupervisionProjects from './pages/Supervision/MySupervisionProjects';  // غيّر المسار حسب مجلدك
=======
import EditTask from './pages/Tasks/EditTask';  // غيّر المسار حسب مجلدك

>>>>>>> e1d0f29f36e080bdebd6336e1b1c0dfb6ec65882
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectDirectory />} />
            {/* سيتم إضافة باقي المسارات هنا */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/create" element={<CreateProject />} />
            <Route path="/tasks" element={<MyTasks />} />
            <Route 
  path="/replacements" 
  element={
      <ReplacementManagement />
  } 
/>
<Route 
  path="/financials" 
  element={
    <ProtectedRoute allowedRoles={['GM', 'AGM', 'ACCOUNTANT']}>
      <GlobalFinancialDashboard />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/client-directory" 
  element={
    <ProtectedRoute allowedRoles={['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'ACCOUNTANT', 'SECRETARY' ]}>
      <ClientDirectory />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/audit-logs" 
  element={
    <ProtectedRoute allowedRoles={['GM', 'AGM','SUP_MGR','DESIGN_MGR']}>
      <AuditLogs />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/staff-kpi" 
  element={
    <ProtectedRoute allowedRoles={['GM', 'AGM', 'DESIGN_MGR']}>
      <StaffKPI />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/supervision-team" 
  element={
    <ProtectedRoute allowedRoles={['SUP_MGR', 'PM', 'GM', 'AGM']}>
      <SupervisionTeamManagement />
    </ProtectedRoute>
  } 
/>
  <Route path="/profile" element={<ProfilePage />} />
  <Route path="/profile/settings" element={<AccountSettings />} />
  <Route path="/profile/change-password" element={<ChangePassword />} />
 <Route path="/projects/:id/edit" element={<EditProject />} />
  <Route path="/projects/closed" element={<ClosedProjects />} />
  <Route path="/projects/pending" element={<PendingProjects />} />
  <Route path="/projects/:id/change-order" element={<CreateChangeOrder />} />
  <Route path="/projects/:id/timeline" element={<TimelineView />} />
  <Route path="/projects/:id/priority" element={<PriorityEdit />} />
  <Route path="/tasks/all" element={<AllTasks />} />
  <Route path="/tasks/create" element={<CreateTask />} />
  <Route path="/tasks/:id" element={<TaskDetails />} />
  <Route path="/supervision/projects" element={<SupervisionDirectory />} />
  <Route path="/projects/:id/action-requests" element={<ActionRequests />} />
  <Route path="/projects/:id/internal-design-review" element={<InternalDesignReview />} />
  <Route 
    path="/financials/report" 
    element={
      <ProtectedRoute allowedRoles={['GM', 'AGM', 'ACCOUNTANT']}>
        <FinancialReport />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/financials/invoices/:id" 
    element={
      <ProtectedRoute allowedRoles={['GM', 'AGM', 'ACCOUNTANT']}>
        <InvoiceDetails />
      </ProtectedRoute>
    } 
  />
  <Route path="/contractors" element={<ContractorsDirectory />} />
  <Route path="/contractors/:id" element={<ContractorDetails />} />
  <Route 
    path="/admin/staff" 
    element={
      <ProtectedRoute allowedRoles={['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM']}>
        <StaffManagement />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/admin/users" 
    element={
      <ProtectedRoute allowedRoles={['GM', 'AGM']}>
        <UserManagement />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/admin/reports" 
    element={
      <ProtectedRoute allowedRoles={['GM', 'AGM', 'ACCOUNTANT']}>
        <ReportsAnalytics />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/supervision/external-logs" 
    element={
      <ProtectedRoute allowedRoles={['SUP_MGR', 'GM' ,'AGM','DESIGN_MGR']}>
        <ExternalLogs />
      </ProtectedRoute>
          } 
  />
<Route path="/projects/active" element={<ActiveProjects />} />
<Route path="/reports" element={
  <ProtectedRoute allowedRoles={['GM','AGM','DESIGN_MGR','SUP_MGR','ACCOUNTANT']}>
    <ReportsCenter />
  </ProtectedRoute>
} />
<Route path="/reports/export" element={
  <ProtectedRoute allowedRoles={['GM','AGM','DESIGN_MGR','SUP_MGR','ACCOUNTANT']}>
    <ExportConsole />
  </ProtectedRoute>
} />
<Route path="/financials/vault" element={
  <ProtectedRoute allowedRoles={['GM','AGM','ACCOUNTANT']}>
    <InvoiceConsole />
  </ProtectedRoute>
} />
<Route path="/chat" element={<ChatCenter />} />


<Route path='/review-directory' element={<ReviewDirectory/>}/>

<Route path="/tasks/:id/edit" element={<EditTask />} />
<Route path="/my-supervision-projects" element={<MySupervisionProjects />} />



          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

