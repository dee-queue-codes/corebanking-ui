import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from './routes'

import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/auth/dashboard/DashboardPage'
import TransactionsPage from '@/pages/auth/transactions/TransactionsPage'
import TasksPage from '@/pages/auth/tasks/TasksPage'
import ClientsPage from '@/pages/auth/clients/ClientsPage'
import ClientDetailPage from '@/pages/auth/clients/ClientDetailPage'
import AddClientPage from '@/pages/auth/clients/AddClientPage'
import AccountLookupPage from '@/pages/auth/clients/AccountLookupPage'
import ProductsPage from '@/pages/auth/products/ProductsPage'
import PrepaidProductsListPage from '@/pages/auth/products/PrepaidProductsListPage'
import NewPrepaidProductPage from '@/pages/auth/products/NewPrepaidProductPage'
import LoanProductsListPage from '@/pages/auth/products/LoanProductsListPage'
import SavingsProductsListPage from '@/pages/auth/products/SavingsProductsListPage'
import AccountingPage from '@/pages/auth/accounting/AccountingPage'
import ChartOfAccountsPage from '@/pages/auth/accounting/ChartOfAccountsPage'
import JournalEntriesPage from '@/pages/auth/accounting/JournalEntriesPage'
import AdministrationsPage from '@/pages/auth/administration/AdministrationsPage'
import UserManagementPage from '@/pages/auth/administration/UserManagementPage'
import AddUserPage from '@/pages/auth/administration/AddUserPage'
import OfficeManagementPage from '@/pages/auth/administration/OfficeManagementPage'
import SecuritySettingsPage from '@/pages/auth/administration/SecuritySettingsPage'
import SystemConfigurationPage from '@/pages/auth/administration/SystemConfigurationPage'
import ReportsPage from '@/pages/auth/reports/ReportsPage'
import TransactionReportPage from '@/pages/auth/reports/TransactionReportPage'
import ClientReportPage from '@/pages/auth/reports/ClientReportPage'
import FinancialSummaryPage from '@/pages/auth/reports/FinancialSummaryPage'
import PerformanceReportPage from '@/pages/auth/reports/PerformanceReportPage'
import LoanManagementPage from '@/pages/auth/loans/LoanManagementPage'
import SettingsPage from '@/pages/auth/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.DASHBOARD,                element: <DashboardPage /> },
          { path: ROUTES.TRANSACTIONS,             element: <TransactionsPage /> },
          { path: ROUTES.TASKS,                    element: <TasksPage /> },
          { path: ROUTES.CLIENTS.LIST,             element: <ClientsPage /> },
          { path: ROUTES.CLIENTS.DETAIL,           element: <ClientDetailPage /> },
          { path: ROUTES.CLIENTS.ADD,              element: <AddClientPage /> },
          { path: ROUTES.CLIENTS.ACCOUNT_LOOKUP,  element: <AccountLookupPage /> },
          { path: ROUTES.PRODUCTS.LIST,            element: <ProductsPage /> },
          { path: ROUTES.PRODUCTS.PREPAID,         element: <PrepaidProductsListPage /> },
          { path: ROUTES.PRODUCTS.PREPAID_NEW,     element: <NewPrepaidProductPage /> },
          { path: ROUTES.PRODUCTS.LOAN,            element: <LoanProductsListPage /> },
          { path: ROUTES.PRODUCTS.SAVINGS,         element: <SavingsProductsListPage /> },
          { path: ROUTES.ACCOUNTING.ROOT,          element: <AccountingPage /> },
          { path: ROUTES.ACCOUNTING.CHART,         element: <ChartOfAccountsPage /> },
          { path: ROUTES.ACCOUNTING.JOURNAL,       element: <JournalEntriesPage /> },
          { path: ROUTES.ADMINISTRATION.ROOT,      element: <AdministrationsPage /> },
          { path: ROUTES.ADMINISTRATION.USERS,     element: <UserManagementPage /> },
          { path: ROUTES.ADMINISTRATION.USERS_ADD, element: <AddUserPage /> },
          { path: ROUTES.ADMINISTRATION.OFFICES,   element: <OfficeManagementPage /> },
          { path: ROUTES.ADMINISTRATION.SECURITY,  element: <SecuritySettingsPage /> },
          { path: ROUTES.ADMINISTRATION.SYSTEM,    element: <SystemConfigurationPage /> },
          { path: ROUTES.REPORTS.ROOT,             element: <ReportsPage /> },
          { path: ROUTES.REPORTS.TRANSACTIONS,     element: <TransactionReportPage /> },
          { path: ROUTES.REPORTS.CLIENTS,          element: <ClientReportPage /> },
          { path: ROUTES.REPORTS.FINANCIAL,        element: <FinancialSummaryPage /> },
          { path: ROUTES.REPORTS.PERFORMANCE,      element: <PerformanceReportPage /> },
          { path: ROUTES.LOANS,                    element: <LoanManagementPage /> },
          { path: ROUTES.SETTINGS,                 element: <SettingsPage /> },
        ],
      },
    ],
  },
])
