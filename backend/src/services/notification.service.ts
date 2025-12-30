import prisma from '../config/database';

export const createNotification = async (
  userId: string,
  type: string,
  message: string
): Promise<void> => {
  await prisma.notification.create({
    data: {
      userId,
      type,
      message,
    },
  });
};

export const notifyGrievanceStatusChange = async (
  grievanceId: string,
  status: string,
  message?: string
): Promise<void> => {
  const grievance = await prisma.grievance.findUnique({
    where: { id: grievanceId },
    include: {
      user: true,
    },
  });

  if (!grievance) return;

  const notificationMessage = message || `Your grievance "${grievance.title}" status changed to ${status}`;

  await createNotification(
    grievance.userId,
    'grievance_status',
    notificationMessage
  );
};

export const notifyGrievanceAssigned = async (
  grievanceId: string,
  assignedToId: string
): Promise<void> => {
  const grievance = await prisma.grievance.findUnique({
    where: { id: grievanceId },
  });

  if (!grievance) return;

  await createNotification(
    assignedToId,
    'grievance_assigned',
    `New grievance "${grievance.title}" assigned to you`
  );
};


