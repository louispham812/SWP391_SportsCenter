import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import TicketManagementPanel from '../../components/common/TicketManagementPanel';

export default function ReceptionTicketsPage() {
  return (
    <ReceptionistLayout>
      <TicketManagementPanel mode="receptionist" />
    </ReceptionistLayout>
  );
}
