import AdminLayout from '../../components/layouts/AdminLayout';
import TicketManagementPanel from '../../components/common/TicketManagementPanel';

export default function AdminTicketsPage() {
  return (
    <AdminLayout>
      <TicketManagementPanel mode="admin" />
    </AdminLayout>
  );
}
